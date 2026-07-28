"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertNotDemo } from "@/lib/demo";
import { parseCsv } from "@/lib/csv";

// Only student_name is required -- AOne (the external system this data
// usually comes from) never exports parent/guardian info at all. Parent
// columns are read if present, but their absence doesn't reject a row;
// those get filled in later via completeParticipantDetails().
const REQUIRED_COLUMNS = ["student_name"] as const;
const OPTIONAL_COLUMNS = ["parent_name", "parent_email", "parent_phone"] as const;

export async function bulkRegisterParticipants(formData: FormData): Promise<string> {
  assertNotDemo();
  const editionId = String(formData.get("edition_id"));
  const path = String(formData.get("path") ?? "/registration");
  const file = formData.get("csv_file");

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Choose a CSV file to upload.");
  }

  const text = await file.text();
  const rows = parseCsv(text);
  if (rows.length === 0) {
    throw new Error("The CSV file is empty.");
  }

  // Match columns by header name, not position, so column order in the
  // export doesn't matter.
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const colIndex: Record<string, number> = {};
  for (const col of REQUIRED_COLUMNS) colIndex[col] = header.indexOf(col);
  for (const col of OPTIONAL_COLUMNS) colIndex[col] = header.indexOf(col);
  if (REQUIRED_COLUMNS.some((col) => colIndex[col] === -1)) {
    throw new Error(`CSV must have a "${REQUIRED_COLUMNS.join(", ")}" column.`);
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

export async function registerParticipant(formData: FormData) {
  assertNotDemo();
  const editionId = String(formData.get("edition_id"));
  const studentName = String(formData.get("student_name") ?? "").trim();
  const parentName = String(formData.get("parent_name") ?? "").trim();
  const parentEmail = String(formData.get("parent_email") ?? "").trim();
  const parentPhone = String(formData.get("parent_phone") ?? "").trim();
  const path = String(formData.get("path") ?? "/registration");
  if (!studentName || !parentName || !parentEmail || !parentPhone) return;

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

  await supabase.from("participants").insert({
    edition_id: editionId,
    student_name: studentName,
    parent_name: parentName,
    parent_email: parentEmail,
    parent_phone: parentPhone,
    waitlisted,
  });

  revalidatePath(path);
}

export async function confirmParticipant(formData: FormData) {
  assertNotDemo();
  const id = String(formData.get("id"));
  const path = String(formData.get("path") ?? "/registration");

  const supabase = await createClient();
  await supabase.from("participants").update({ confirmed: true, email_sent: true }).eq("id", id);
  revalidatePath(path);
}

export async function markEmailSent(formData: FormData) {
  assertNotDemo();
  const id = String(formData.get("id"));
  const path = String(formData.get("path") ?? "/registration");

  const supabase = await createClient();
  await supabase.from("participants").update({ email_sent: true }).eq("id", id);
  revalidatePath(path);
}

export async function checkInParticipant(formData: FormData) {
  assertNotDemo();
  const participantId = String(formData.get("participant_id"));
  const checkpoint = Number(formData.get("checkpoint"));
  const path = String(formData.get("path") ?? "/registration-area");

  const supabase = await createClient();

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
