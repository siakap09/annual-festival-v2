import { getWorkspace } from "@/lib/data/workspace";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/shell/Header";
import { Sidebar } from "@/components/shell/Sidebar";
import { SidebarProvider } from "@/components/shell/SidebarContext";
import { isDemo } from "@/lib/demo";
import { departmentByKey } from "@/lib/constants";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const workspace = await getWorkspace();
  let participantCount = 0;
  if (!isDemo()) {
    const supabase = await createClient();
    const { count } = await supabase
      .from("participants")
      .select("id", { count: "exact", head: true })
      .eq("edition_id", workspace.currentEdition.id)
      .eq("waitlisted", false);
    participantCount = count ?? 0;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen flex-col">
        <Header
          orgName={workspace.organization.name}
          currentEdition={workspace.currentEdition}
          editions={workspace.editions}
          participantCount={participantCount ?? 0}
          userEmail={workspace.userEmail}
        />
        <div className="flex flex-1">
          <Sidebar
            allowedKeys={workspace.scope === "restricted" ? workspace.departments.map((d) => d.key) : undefined}
            showEditionManagement={workspace.scope === "full"}
            showRoleManagement={workspace.scope === "full" && (workspace.role === "owner" || workspace.role === "admin")}
            homeHref={
              workspace.scope === "restricted" && workspace.departments[0]
                ? departmentByKey(workspace.departments[0].key).path
                : "/editions"
            }
          />
          <main className="min-w-0 flex-1 overflow-x-hidden bg-gray-50 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
