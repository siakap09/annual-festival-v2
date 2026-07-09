"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
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
