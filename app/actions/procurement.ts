"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertNotDemo } from "@/lib/demo";

export async function addBudgetItem(formData: FormData) {
  assertNotDemo();
  const departmentId = String(formData.get("department_id"));
  const editionId = String(formData.get("edition_id"));
  const type = String(formData.get("type"));
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const amount = Number(formData.get("amount") ?? 0) || 0;
  const status = String(formData.get("status") ?? "pending");
  const path = String(formData.get("path") ?? "/procurement");
  if (!description) return;

  const supabase = await createClient();
  await supabase.from("budget_items").insert({
    department_id: departmentId,
    edition_id: editionId,
    type,
    description,
    category: category || null,
    amount,
    status,
  });
  revalidatePath(path);
}

export async function updateBudgetItemStatus(formData: FormData) {
  assertNotDemo();
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  const path = String(formData.get("path") ?? "/procurement");

  const supabase = await createClient();
  await supabase.from("budget_items").update({ status }).eq("id", id);
  revalidatePath(path);
}

export async function deleteBudgetItem(formData: FormData) {
  assertNotDemo();
  const id = String(formData.get("id"));
  const path = String(formData.get("path") ?? "/procurement");

  const supabase = await createClient();
  await supabase.from("budget_items").delete().eq("id", id);
  revalidatePath(path);
}
