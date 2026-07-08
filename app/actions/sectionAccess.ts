"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertNotDemo } from "@/lib/demo";

export async function addSectionAccess(formData: FormData) {
  assertNotDemo();
  const departmentId = String(formData.get("department_id"));
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const accessLevel = String(formData.get("access_level") ?? "viewer");
  const path = String(formData.get("path") ?? "/editions");
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
  });

  if (insertError) {
    throw new Error(insertError.message);
  }

  const headerList = await headers();
  const origin = headerList.get("origin") ?? `https://${headerList.get("host")}`;

  const admin = createAdminClient();
  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${origin}/auth/callback`,
  });

  if (inviteError && !/already been registered|already registered|already exists/i.test(inviteError.message)) {
    // The section_access row is already created; surface the invite failure
    // so the admin knows the person won't get an email (e.g. bad service key).
    throw new Error(`Access granted, but the invite email failed to send: ${inviteError.message}`);
  }
  // If the person already has an account, no email is sent here — they'll
  // get access automatically the next time they sign in (getWorkspace()
  // self-heal claims the row by email).

  revalidatePath(path);
}

export async function removeSectionAccess(formData: FormData) {
  assertNotDemo();
  const id = String(formData.get("id"));
  const path = String(formData.get("path") ?? "/editions");

  const supabase = await createClient();
  await supabase.from("section_access").delete().eq("id", id);
  revalidatePath(path);
}
