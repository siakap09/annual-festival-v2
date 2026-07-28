"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertNotDemo } from "@/lib/demo";

export async function addSectionAccess(formData: FormData) {
  assertNotDemo();
  const departmentId = String(formData.get("department_id"));
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const accessLevel = String(formData.get("access_level") ?? "viewer");
  const path = String(formData.get("path") ?? "/editions");
  const checkpointRaw = String(formData.get("checkpoint") ?? "").trim();
  const checkpoint = checkpointRaw ? Number(checkpointRaw) : null;
  if (!email || !departmentId) return;

  const supabase = await createClient();

  // Derive edition_id from the department itself server-side — never trust
  // a client-submitted edition_id, to guarantee the two can't mismatch.
  const { data: department, error: deptError } = await supabase
    .from("departments")
    .select("id, edition_id")
    .eq("id", departmentId)
    .single();

  if (deptError || !department) {
    throw new Error("Could not find that department.");
  }

  const { error: insertError } = await supabase.from("section_access").insert({
    edition_id: department.edition_id,
    department_id: department.id,
    email,
    access_level: accessLevel,
    checkpoint,
  });

  if (insertError) {
    throw new Error(insertError.message);
  }

  // No invite email is sent -- the section_access row is enough on its own:
  // handle_new_user() claims it on signup, and getWorkspace()'s self-heal
  // claims it on next login for someone who already had an account. (Same
  // fix as Role Management's Add User -- inviteUserByEmail() was failing
  // here too, since SMTP isn't configured on this Supabase project, and
  // that failure was surfacing as a hard error after the grant had already
  // been created successfully.)
  revalidatePath(path);
}

export async function updateSectionAccess(formData: FormData) {
  assertNotDemo();
  const id = String(formData.get("id"));
  const accessLevel = String(formData.get("access_level") ?? "viewer");
  const path = String(formData.get("path") ?? "/editions");
  const checkpointRaw = String(formData.get("checkpoint") ?? "").trim();
  const checkpoint = checkpointRaw ? Number(checkpointRaw) : null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("section_access")
    .update({ access_level: accessLevel, checkpoint })
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("You don't have permission to update this grant.");

  revalidatePath(path);
}

export async function removeSectionAccess(formData: FormData) {
  assertNotDemo();
  const id = String(formData.get("id"));
  const path = String(formData.get("path") ?? "/editions");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("section_access")
    .delete()
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("You don't have permission to remove this access grant.");

  revalidatePath(path);
}
