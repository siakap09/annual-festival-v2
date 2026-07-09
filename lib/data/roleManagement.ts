import { createClient } from "@/lib/supabase/server";
import { isDemo } from "@/lib/demo";
import type { OrganizationMember } from "@/lib/types";

export async function getOrganizationMembers(organizationId: string): Promise<OrganizationMember[]> {
  if (isDemo()) return [];

  const supabase = await createClient();
  const { data: members } = await supabase
    .from("organization_members")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });

  return (members ?? []) as OrganizationMember[];
}
