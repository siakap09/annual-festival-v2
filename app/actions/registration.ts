"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { assertNotDemo } from "@/lib/demo";
import { parseCsv } from "@/lib/csv";
import { parseXlsx } from "@/lib/xlsx";
import { sendEmail } from "@/lib/email";
import type { Participant } from "@/lib/types";

/**
 * Emails a link to the student's personal check-in QR page to the parent
 * (not an attached SVG file -- a real, mobile-friendly web page reads much
 * better than a downloaded file opened raw in a browser tab). Throws on
 * failure -- callers decide whether that should block the surrounding
 * action or just be reported back.
 */
async function sendParticipantQrEmail(participant: Pick<Participant, "student_name" | "parent_name" | "parent_email" | "qr_token">) {
  if (!participant.parent_email) {
    throw new Error("No parent email on file for this student.");
  }
  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const qrUrl = `${protocol}://${host}/qr/${participant.qr_token}`;

  await sendEmail({
    to: participant.parent_email,
    subject: `${participant.student_name}'s Festival Check-in QR Code`,
    html: `
      <p>Hi ${participant.parent_name ?? "there"},</p>
      <p><strong>${participant.student_name}</strong> is registered for the festival.</p>
      <p><a href="${qrUrl}" style="display:inline-block;padding:10px 20px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">View Check-in QR Code</a></p>
      <p>Show this page (on your phone or printed) at the check-in booth on the day of the event.</p>
    `.trim(),
    text: `Hi ${participant.parent_name ?? "there"}, ${participant.student_name} is registered for the festival. View their check-in QR code here: ${qrUrl} -- show this page (on your phone or printed) at the check-in booth on the day of the event.`,
  });
}

// AOne's export has many columns we don't need -- pull out only these four
// by their actual header text (case-insensitive) and ignore everything
// else in the file. "Name" is required; the Guardian columns are optional
// since AOne doesn't always have them -- those get filled in later via
// completeParticipantDetails().
const COLUMN_HEADERS = {
  student_name: "name",
  parent_name: "guardian name",
  parent_email: "guardian email",
  parent_phone: "guardian mobile",
} as const;
const REQUIRED_COLUMNS = ["student_name"] as const;

export async function bulkRegisterParticipants(formData: FormData): Promise<string> {
  assertNotDemo();
  const editionId = String(formData.get("edition_id"));
  const path = String(formData.get("path") ?? "/registration");
  const file = formData.get("csv_file");

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Choose a CSV or Excel (.xlsx) file to upload.");
  }

  const isXlsx = file.name.toLowerCase().endsWith(".xlsx");
  const rows = isXlsx ? parseXlsx(await file.arrayBuffer()) : parseCsv(await file.text());
  if (rows.length === 0) {
    throw new Error("The CSV file is empty.");
  }

  // Match columns by header text, not position -- so column order, and any
  // extra columns AOne includes that we don't care about, don't matter.
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const colIndex: Record<string, number> = {};
  for (const [field, label] of Object.entries(COLUMN_HEADERS)) {
    colIndex[field] = header.indexOf(label);
  }
  if (REQUIRED_COLUMNS.some((col) => colIndex[col] === -1)) {
    throw new Error(`File must have a "${COLUMN_HEADERS.student_name}" column.`);
  }

  const supabase = await createClient();

  const { data: edition } = await supabase
    .from("editions")
    .select("target_participants, enable_waitlist")
    .eq("id", editionId)
    .single();

  const { data: existing } = await supabase
    .from("participants")
    .select("student_name, parent_email, waitlisted")
    .eq("edition_id", editionId);

  // Dedupe by email when a row has one (works for legacy/manually-entered
  // records too); for a name-only AOne row, dedupe by exact name match
  // against other name-only records instead -- this catches the realistic
  // case (the same AOne export accidentally re-uploaded) without risking a
  // false match against an unrelated student who just shares a name.
  const existingEmails = new Set(
    (existing ?? []).filter((p) => p.parent_email).map((p) => p.parent_email!.trim().toLowerCase())
  );
  const existingNamesNoEmail = new Set(
    (existing ?? []).filter((p) => !p.parent_email).map((p) => p.student_name.trim().toLowerCase())
  );
  let registeredCount = (existing ?? []).filter((p) => !p.waitlisted).length;
  const targetParticipants = edition?.target_participants ?? Infinity;
  const enableWaitlist = edition?.enable_waitlist ?? false;

  const toInsert: {
    edition_id: string;
    student_name: string;
    parent_name: string | null;
    parent_email: string | null;
    parent_phone: string | null;
    waitlisted: boolean;
  }[] = [];

  let skippedDuplicates = 0;
  let skippedInvalid = 0;
  let skippedFull = 0;

  for (const row of rows.slice(1)) {
    if (row.every((cell) => !cell.trim())) continue; // blank line

    const studentName = (row[colIndex.student_name] ?? "").trim();
    const parentName = (row[colIndex.parent_name] ?? "").trim() || null;
    const parentEmail = (row[colIndex.parent_email] ?? "").trim() || null;
    const parentPhone = (row[colIndex.parent_phone] ?? "").trim() || null;

    if (!studentName) {
      skippedInvalid++;
      continue;
    }

    if (parentEmail) {
      const emailKey = parentEmail.toLowerCase();
      if (existingEmails.has(emailKey)) {
        skippedDuplicates++;
        continue;
      }
      existingEmails.add(emailKey); // guard against duplicates within the same file too
    } else {
      const nameKey = studentName.toLowerCase();
      if (existingNamesNoEmail.has(nameKey)) {
        skippedDuplicates++;
        continue;
      }
      existingNamesNoEmail.add(nameKey);
    }

    const isFull = registeredCount >= targetParticipants;
    if (isFull && !enableWaitlist) {
      skippedFull++;
      continue;
    }

    const waitlisted = isFull && enableWaitlist;
    if (!waitlisted) registeredCount++;

    toInsert.push({
      edition_id: editionId,
      student_name: studentName,
      parent_name: parentName,
      parent_email: parentEmail,
      parent_phone: parentPhone,
      waitlisted,
    });
  }

  if (toInsert.length === 0) {
    const reasons = [];
    if (skippedDuplicates > 0) reasons.push(`${skippedDuplicates} duplicate(s)`);
    if (skippedInvalid > 0) reasons.push(`${skippedInvalid} invalid row(s)`);
    if (skippedFull > 0) reasons.push(`${skippedFull} row(s) rejected (registration full)`);
    throw new Error(reasons.length > 0 ? `Nothing imported -- ${reasons.join(", ")}.` : "No valid rows found in the CSV.");
  }

  const { error } = await supabase.from("participants").insert(toInsert);
  if (error) throw new Error(error.message);

  revalidatePath(path);

  const summary = [`Imported ${toInsert.length} student${toInsert.length === 1 ? "" : "s"}.`];
  if (skippedDuplicates > 0) summary.push(`${skippedDuplicates} duplicate(s) skipped.`);
  if (skippedInvalid > 0) summary.push(`${skippedInvalid} invalid row(s) skipped.`);
  if (skippedFull > 0) summary.push(`${skippedFull} row(s) rejected (registration full).`);
  return summary.join(" ");
}

export async function completeParticipantDetails(formData: FormData): Promise<string> {
  assertNotDemo();
  const id = String(formData.get("id"));
  const parentName = String(formData.get("parent_name") ?? "").trim();
  const parentEmail = String(formData.get("parent_email") ?? "").trim();
  const parentPhone = String(formData.get("parent_phone") ?? "").trim();
  const path = String(formData.get("path") ?? "/registration");

  if (!parentName || !parentEmail || !parentPhone) {
    throw new Error("Fill in parent name, email, and phone.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("participants")
    .update({ parent_name: parentName, parent_email: parentEmail, parent_phone: parentPhone })
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("You don't have permission to update this student's details.");

  revalidatePath(path);
  return "Details saved.";
}

export async function registerParticipant(formData: FormData): Promise<string> {
  assertNotDemo();
  const editionId = String(formData.get("edition_id"));
  const studentName = String(formData.get("student_name") ?? "").trim();
  const parentName = String(formData.get("parent_name") ?? "").trim();
  const parentEmail = String(formData.get("parent_email") ?? "").trim();
  const parentPhone = String(formData.get("parent_phone") ?? "").trim();
  const path = String(formData.get("path") ?? "/registration");
  if (!studentName || !parentName || !parentEmail || !parentPhone) {
    throw new Error("Fill in student name, parent name, email, and phone.");
  }

  const supabase = await createClient();

  const { data: edition } = await supabase
    .from("editions")
    .select("target_participants, enable_waitlist")
    .eq("id", editionId)
    .single();

  const { count } = await supabase
    .from("participants")
    .select("id", { count: "exact", head: true })
    .eq("edition_id", editionId)
    .eq("waitlisted", false);

  const isFull = edition ? (count ?? 0) >= edition.target_participants : false;
  const waitlisted = Boolean(isFull && edition?.enable_waitlist);

  const { error } = await supabase.from("participants").insert({
    edition_id: editionId,
    student_name: studentName,
    parent_name: parentName,
    parent_email: parentEmail,
    parent_phone: parentPhone,
    waitlisted,
  });
  if (error) throw new Error(error.message);

  revalidatePath(path);

  return waitlisted
    ? `${studentName} registered on the waitlist.`
    : `${studentName} registered. Send their QR code from the Confirm Students tab when ready.`;
}

// Deliberately does not touch email_sent -- confirming a student and
// emailing them their QR are separate actions (Student List's "Confirm"
// button vs. the Confirm Students tab's "Send QR" button).
export async function confirmParticipant(formData: FormData): Promise<string> {
  assertNotDemo();
  const id = String(formData.get("id"));
  const path = String(formData.get("path") ?? "/registration");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("participants")
    .update({ confirmed: true })
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("You don't have permission to confirm this student.");

  revalidatePath(path);
  return "Confirmed.";
}

export async function resendParticipantQrEmail(formData: FormData): Promise<string> {
  assertNotDemo();
  const id = String(formData.get("id"));
  const path = String(formData.get("path") ?? "/registration");

  const supabase = await createClient();
  const { data: participant, error } = await supabase
    .from("participants")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);

  await sendParticipantQrEmail(participant as Participant);
  await supabase.from("participants").update({ email_sent: true }).eq("id", id);
  revalidatePath(path);
  return `QR code emailed to ${participant.parent_email}.`;
}


async function checkInParticipantId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  participantId: string,
  checkpoint: number,
  path: string
) {
  const { data: existing } = await supabase
    .from("checkin_events")
    .select("checkpoint")
    .eq("participant_id", participantId);

  const reached = new Set((existing ?? []).map((e) => e.checkpoint));

  if (reached.has(checkpoint)) {
    throw new Error(`Already checked in at Booth ${checkpoint}.`);
  }

  if (checkpoint > 1 && !reached.has(checkpoint - 1)) {
    // Order rule: must complete checkpoints sequentially -- reject with the
    // specific booth they skipped instead of silently no-op'ing, so a stale
    // client or a race between two staff scanning concurrently still gets a
    // clear rejection instead of looking like nothing happened.
    throw new Error(
      `Cannot check in at Booth ${checkpoint} -- this student hasn't checked in at Booth ${checkpoint - 1} yet.`
    );
  }

  const { data, error } = await supabase
    .from("checkin_events")
    .insert({ participant_id: participantId, checkpoint })
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("You don't have permission to check students in at this booth.");

  revalidatePath(path);
}

export async function checkInParticipant(formData: FormData) {
  assertNotDemo();
  const participantId = String(formData.get("participant_id"));
  const checkpoint = Number(formData.get("checkpoint"));
  const path = String(formData.get("path") ?? "/registration-area");

  const supabase = await createClient();
  await checkInParticipantId(supabase, participantId, checkpoint, path);
}

/** Used by the camera-based "Scan QR" flow -- the QR encodes the student's
 * qr_token directly, so this resolves it to a participant before running
 * the same order-rule check-in logic as the search-based flow. */
export async function checkInByQrToken(formData: FormData): Promise<string> {
  assertNotDemo();
  const token = String(formData.get("qr_token"));
  const checkpoint = Number(formData.get("checkpoint"));
  const path = String(formData.get("path") ?? "/registration-area");

  const supabase = await createClient();
  const { data: participant } = await supabase
    .from("participants")
    .select("id, student_name")
    .eq("qr_token", token)
    .maybeSingle();

  if (!participant) {
    throw new Error("QR code not recognized.");
  }

  await checkInParticipantId(supabase, participant.id, checkpoint, path);
  return `${participant.student_name} checked in at Booth ${checkpoint}.`;
}
