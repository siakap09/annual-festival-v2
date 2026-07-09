import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDemo } from "@/lib/demo";
import type { OrganizationMemberWithEmail, OrgRole } from "@/lib/types";

export async function getOrganizationMembers(organizationId: string): Promise<OrganizationMemberWithEmail[]> {
  if (isDemo()) return [];

  const supabase = await createClient();
  const { data: members } = await supabase
    .from("organization_members")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });

  if (!members || members.length === 0) return [];

  // organization_members has no email column, and auth.users isn't exposed
  // via PostgREST -- resolve each member's email server-side via the admin API.
  const admin = createAdminClient();
  return Promise.all(
    members.map(async (m) => {
      const { data } = await admin.auth.admin.getUserById(m.user_id);
      return {
        ...m,
        role: m.role as OrgRole,
        email: data.user?.email ?? "(unknown)",
      };
    })
  );
}
