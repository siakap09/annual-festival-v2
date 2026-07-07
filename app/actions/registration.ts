"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertNotDemo } from "@/lib/demo";

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
  if (checkpoint > 1 && !reached.has(checkpoint - 1)) {
    // order rule: must complete checkpoints sequentially
    revalidatePath(path);
    return;
  }
  if (reached.has(checkpoint)) {
    revalidatePath(path);
    return;
  }

  await supabase.from("checkin_events").insert({
    participant_id: participantId,
    checkpoint,
  });
  revalidatePath(path);
}
