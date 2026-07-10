"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertNotDemo } from "@/lib/demo";

export async function addCueBlock(formData: FormData) {
  assertNotDemo();
  const departmentId = String(formData.get("department_id"));
  const day = Number(formData.get("day") ?? 1) || 1;
  const title = String(formData.get("title") ?? "").trim();
  const startTime = String(formData.get("start_time") ?? "").trim();
  const endTime = String(formData.get("end_time") ?? "").trim();
  const performer = String(formData.get("performer") ?? "").trim();
  const path = String(formData.get("path") ?? "/showcase");
  if (!title) return;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cue_blocks")
    .insert({
      department_id: departmentId,
      day,
      title,
      start_time: startTime || null,
      end_time: endTime || null,
      performer: performer || null,
    })
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("You don't have permission to add cue blocks here.");
  revalidatePath(path);
}

export async function deleteCueBlock(formData: FormData) {
  assertNotDemo();
  const id = String(formData.get("id"));
  const path = String(formData.get("path") ?? "/showcase");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cue_blocks")
    .delete()
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("You don't have permission to delete this cue block.");
  revalidatePath(path);
}
