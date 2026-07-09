import { redirect } from "next/navigation";
import { getWorkspace } from "@/lib/data/workspace";
import { getOrganizationMembers } from "@/lib/data/roleManagement";
import { PageHeader } from "@/components/shell/PageHeader";
import { RoleManagementTable } from "@/components/roleManagement/RoleManagementTable";

export const dynamic = "force-dynamic";

export default async function RoleManagementPage() {
  const workspace = await getWorkspace();

  // Defense in depth beyond the sidebar link being hidden: a member (or a
  // scoped/restricted user) navigating here directly gets bounced. RLS is
  // the real boundary for the actual writes -- this just avoids exposing
  // the member list's read view to someone who shouldn't see it.
  if (workspace.scope !== "full" || (workspace.role !== "owner" && workspace.role !== "admin")) {
    redirect("/editions");
  }

  const members = await getOrganizationMembers(workspace.organization.id);

  return (
    <div>
      <PageHeader
        icon="🛡️"
        title="Role Management"
        subtitle="Manage admin and superadmin access for your organization"
      />
      <RoleManagementTable
        organizationId={workspace.organization.id}
        members={members}
        viewerRole={workspace.role}
        path="/role-management"
      />
    </div>
  );
}
