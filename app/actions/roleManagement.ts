"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertNotDemo } from "@/lib/demo";
import type { OrgRole } from "@/lib/types";

async function assertNotLastOwner(
  organizationId: string,
  memberId: string,
  newRole: OrgRole | null
) {
  const supabase = await createClient();
  const { data: target } = await supabase
    .from("organization_members")
    .select("role")
    .eq("id", memberId)
    .single();

  if (target?.role !== "owner") return; // not currently an owner -- no guard needed
  if (newRole === "owner") return; // staying an owner -- fine

  const { count } = await supabase
    .from("organization_members")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("role", "owner");

  if ((count ?? 0) <= 1) {
    throw new Error("Cannot remove the last owner of an organization.");
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLE_LABEL: Record<string, string> = { admin: "Admin", member: "Member" };

export async function inviteMember(formData: FormData): Promise<string> {
  assertNotDemo();
  const organizationId = String(formData.get("organization_id"));
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "member");
  const path = String(formData.get("path") ?? "/role-management");

  if (!email) throw new Error("Enter an email address.");
  if (!EMAIL_RE.test(email)) throw new Error("Enter a valid email address.");
  // Owner is never settable at invite time -- the insert RLS policy also
  // enforces this, this just avoids a round trip for an obviously-bad request.
  if (role !== "admin" && role !== "member") {
    throw new Error("New members can only be invited as Admin or Member.");
  }

  const supabase = await createClient();

  const { data: existingRow } = await supabase
    .from("organization_members")
    .select("id, user_id")
    .eq("organization_id", organizationId)
    .eq("email", email)
    .maybeSingle();

  if (existingRow) {
    throw new Error(
      existingRow.user_id
        ? `${email} is already a member of this organization.`
        : `${email} has already been invited.`
    );
  }

  const admin = createAdminClient();

  // Check whether this email already has an account, so we can link it
  // immediately instead of leaving user_id null until their next login.
  // generateLink's "recovery" type only succeeds for an existing user, and
  // we never send the resulting link anywhere -- we just want the user id.
  const { data: existingAuth } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
  });
  const existingUserId = existingAuth?.user?.id ?? null;

  const { error: insertError } = await supabase.from("organization_members").insert({
    organization_id: organizationId,
    email,
    role,
    user_id: existingUserId,
  });

  if (insertError) {
    throw new Error(insertError.message);
  }

  revalidatePath(path);

  if (existingUserId) {
    return `Added ${email} as ${ROLE_LABEL[role]} -- they already have an account and can access it now.`;
  }

  const headerList = await headers();
  const origin = headerList.get("origin") ?? `https://${headerList.get("host")}`;

  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${origin}/auth/callback`,
  });

  if (inviteError && !/already been registered|already registered|already exists/i.test(inviteError.message)) {
    // The organization_members row is already created; surface the invite
    // failure so the admin knows the person won't get an email.
    throw new Error(`Member added, but the invite email failed to send: ${inviteError.message}`);
  }

  return `Invited ${email} as ${ROLE_LABEL[role]}. They'll get an email to set up their account.`;
}

export async function updateMemberRole(formData: FormData) {
  assertNotDemo();
  const memberId = String(formData.get("member_id"));
  const organizationId = String(formData.get("organization_id"));
  const role = String(formData.get("role")) as OrgRole;
  const path = String(formData.get("path") ?? "/role-management");

  await assertNotLastOwner(organizationId, memberId, role);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_members")
    .update({ role })
    .eq("id", memberId)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("You don't have permission to change this member's role.");

  revalidatePath(path);
}

export async function removeMember(formData: FormData) {
  assertNotDemo();
  const memberId = String(formData.get("member_id"));
  const organizationId = String(formData.get("organization_id"));
  const path = String(formData.get("path") ?? "/role-management");

  await assertNotLastOwner(organizationId, memberId, null);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_members")
    .delete()
    .eq("id", memberId)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("You don't have permission to remove this member.");

  revalidatePath(path);
}
