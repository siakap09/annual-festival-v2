"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertNotDemo } from "@/lib/demo";

export async function addRecord(formData: FormData) {
  assertNotDemo();
  const departmentId = String(formData.get("department_id"));
  const kind = String(formData.get("kind"));
  const title = String(formData.get("title") ?? "").trim();
  const subtitle = String(formData.get("subtitle") ?? "").trim();
  const amountRaw = formData.get("amount");
  const amount = amountRaw !== null && amountRaw !== "" ? Number(amountRaw) : null;
  const status = String(formData.get("status") ?? "").trim();
  const dueDate = String(formData.get("due_date") ?? "") || null;
  const notes = String(formData.get("notes") ?? "").trim();
  const path = String(formData.get("path") ?? "/");
  if (!title) return;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("department_records")
    .insert({
      department_id: departmentId,
      kind,
      title,
      subtitle: subtitle || null,
      amount,
      status: status || null,
      due_date: dueDate,
      notes: notes || null,
    })
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("You don't have permission to add records here.");
  revalidatePath(path);
}

export async function updateRecordStatus(formData: FormData) {
  assertNotDemo();
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  const path = String(formData.get("path") ?? "/");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("department_records")
    .update({ status })
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("You don't have permission to update this record.");
  revalidatePath(path);
}

export async function deleteRecord(formData: FormData) {
  assertNotDemo();
  const id = String(formData.get("id"));
  const path = String(formData.get("path") ?? "/");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("department_records")
    .delete()
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("You don't have permission to delete this record.");
  revalidatePath(path);
}
