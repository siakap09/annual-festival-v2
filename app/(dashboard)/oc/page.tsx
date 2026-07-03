import { getWorkspace, findDepartment } from "@/lib/data/workspace";
import { getAllTasksForEdition, getAnnouncements, getManpower, getTeamAccess } from "@/lib/data/departments";
import { createClient } from "@/lib/supabase/server";
import { BackToEditions } from "@/components/shell/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Tabs } from "@/components/ui/Tabs";
import { TaskBoard } from "@/components/department/TaskBoard";
import { ManpowerPanel } from "@/components/department/ManpowerPanel";
import { TeamAccessPanel } from "@/components/department/TeamAccessPanel";
import { UnitProgress } from "@/components/department/UnitProgress";
import { AnnouncementsPanel } from "@/components/department/AnnouncementsPanel";
import { departmentByKey } from "@/lib/constants";
import { formatMYR, percent, daysUntilLabel, formatDate } from "@/lib/utils";
import { WaitlistToggle } from "@/components/editions/WaitlistToggle";
import { isDemo } from "@/lib/demo";

export const dynamic = "force-dynamic";

export default async function OCPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "task_board" } = await searchParams;
  const workspace = await getWorkspace();
  const { currentEdition, departments } = workspace;
  const oc = findDepartment(departments, "oc");

  const [tasksByDepartment, manpower, teamAccess, announcements] = await Promise.all([
    getAllTasksForEdition(departments),
    getManpower(oc.id),
    getTeamAccess(oc.id),
    getAnnouncements(currentEdition.id),
  ]);

  const departmentIds = departments.map((d) => d.id);

  let participantCount = 0;
  let revenueItems: { amount: number }[] = [];
  if (!isDemo()) {
    const supabase = await createClient();
    const [{ count }, { data }] = await Promise.all([
      supabase
        .from("participants")
        .select("id", { count: "exact", head: true })
        .eq("edition_id", currentEdition.id)
        .eq("waitlisted", false),
      departmentIds.length
        ? supabase
            .from("budget_items")
            .select("amount")
            .in("department_id", departmentIds)
            .eq("type", "revenue")
            .eq("status", "paid")
        : Promise.resolve({ data: [] as { amount: number }[] }),
    ]);
    participantCount = count ?? 0;
    revenueItems = (data ?? []) as { amount: number }[];
  }

  const allTasks = Object.values(tasksByDepartment).flat();
  const tasksDone = allTasks.filter((t) => t.status === "done").length;
  const revenue = (revenueItems ?? []).reduce((sum, i) => sum + Number(i.amount), 0);
  const path = "/oc";

  return (
    <div>
      <BackToEditions />

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Participants"
          value={`${participantCount ?? 0} / ${currentEdition.target_participants}`}
          caption="registered / target"
          icon="🎓"
          progress={percent(participantCount ?? 0, currentEdition.target_participants)}
        />
        <StatCard label="Revenue" value={formatMYR(revenue)} caption="paid revenue items" icon="💰" />
        <StatCard
          label="Tasks Done"
          value={`${tasksDone} / ${allTasks.length}`}
          caption="across all units"
          icon="✅"
          progress={percent(tasksDone, allTasks.length)}
        />
        <StatCard
          label="Event Day!"
          value={daysUntilLabel(currentEdition.start_date)}
          caption={currentEdition.start_date ? formatDate(currentEdition.start_date) : "no date set"}
          icon="📅"
        />
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-1 text-sm font-medium text-gray-500">👥 Department Leads</div>
          <ul className="space-y-0.5 text-xs text-gray-600">
            {departments.map((d) => (
              <li key={d.id} className="flex justify-between">
                <span>{departmentByKey(d.key).name}</span>
                <span className="font-medium text-gray-800">{d.lead_name ?? "TBD"}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mb-5 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h3 className="mb-2 text-sm font-semibold text-gray-800">Registration Settings</h3>
        <WaitlistToggle editionId={currentEdition.id} enabled={currentEdition.enable_waitlist} />
      </div>

      <div className="mb-5 rounded-lg border border-gray-200 bg-white shadow-sm">
        <Tabs
          basePath={path}
          activeKey={tab}
          tabs={[
            { key: "task_board", label: "Task Board", icon: "🏛️" },
            { key: "manpower", label: "Manpower", icon: "👥" },
            { key: "team_access", label: "Team Access", icon: "👥" },
          ]}
        />
        <div className="p-4">
          {tab === "task_board" && (
            <TaskBoard departmentId={oc.id} tasks={tasksByDepartment[oc.id] ?? []} path={path} title="OC Task Board" />
          )}
          {tab === "manpower" && <ManpowerPanel departmentId={oc.id} manpower={manpower} path={path} />}
          {tab === "team_access" && <TeamAccessPanel departmentId={oc.id} members={teamAccess} path={path} />}
        </div>
      </div>

      <div className="mb-5">
        <UnitProgress departments={departments} tasksByDepartment={tasksByDepartment} />
      </div>

      <AnnouncementsPanel editionId={currentEdition.id} announcements={announcements} path={path} />
    </div>
  );
}
