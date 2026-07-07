"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertNotDemo } from "@/lib/demo";

export async function addTask(formData: FormData) {
  assertNotDemo();
  const departmentId = String(formData.get("department_id"));
  const title = String(formData.get("title") ?? "").trim();
  const status = String(formData.get("status") ?? "todo");
  const path = String(formData.get("path") ?? "/oc");
  if (!title) return;

  const supabase = await createClient();
  await supabase.from("tasks").insert({ department_id: departmentId, title, status });
  revalidatePath(path);
}

export async function updateTaskStatus(formData: FormData) {
  assertNotDemo();
  const taskId = String(formData.get("task_id"));
  const status = String(formData.get("status"));
  const path = String(formData.get("path") ?? "/oc");

  const supabase = await createClient();
  await supabase.from("tasks").update({ status }).eq("id", taskId);
  revalidatePath(path);
}

export async function deleteTask(formData: FormData) {
  assertNotDemo();
  const taskId = String(formData.get("task_id"));
  const path = String(formData.get("path") ?? "/oc");

  const supabase = await createClient();
  await supabase.from("tasks").delete().eq("id", taskId);
  revalidatePath(path);
}

export async function addManpower(formData: FormData) {
  assertNotDemo();
  const departmentId = String(formData.get("department_id"));
  const type = String(formData.get("type") ?? "internal");
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const contact = String(formData.get("contact") ?? "").trim();
  const path = String(formData.get("path") ?? "/oc");
  if (!name) return;

  const supabase = await createClient();
  await supabase.from("manpower").insert({
    department_id: departmentId,
    type,
    name,
    role: role || null,
    contact: contact || null,
  });
  revalidatePath(path);
}

export async function removeManpower(formData: FormData) {
  assertNotDemo();
  const id = String(formData.get("id"));
  const path = String(formData.get("path") ?? "/oc");

  const supabase = await createClient();
  await supabase.from("manpower").delete().eq("id", id);
  revalidatePath(path);
}

export async function addTeamAccess(formData: FormData) {
  assertNotDemo();
  const departmentId = String(formData.get("department_id"));
  const email = String(formData.get("email") ?? "").trim();
  const accessLevel = String(formData.get("access_level") ?? "viewer");
  const path = String(formData.get("path") ?? "/oc");
  if (!email) return;

  const supabase = await createClient();
  await supabase.from("team_access").insert({
    department_id: departmentId,
    email,
    access_level: accessLevel,
  });
  revalidatePath(path);
}

export async function removeTeamAccess(formData: FormData) {
  assertNotDemo();
  const id = String(formData.get("id"));
  const path = String(formData.get("path") ?? "/oc");

  const supabase = await createClient();
  await supabase.from("team_access").delete().eq("id", id);
  revalidatePath(path);
}

export async function addAnnouncement(formData: FormData) {
  assertNotDemo();
  const editionId = String(formData.get("edition_id"));
  const departmentId = formData.get("department_id")
    ? String(formData.get("department_id"))
    : null;
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const path = String(formData.get("path") ?? "/oc");
  if (!title) return;

  const supabase = await createClient();
  await supabase.from("announcements").insert({
    edition_id: editionId,
    department_id: departmentId,
    title,
    body: body || null,
  });
  revalidatePath(path);
}
