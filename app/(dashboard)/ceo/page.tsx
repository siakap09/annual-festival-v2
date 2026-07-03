import { getWorkspace } from "@/lib/data/workspace";
import { findDepartment } from "@/lib/data/workspace";
import {
  getAllTasksForEdition,
  getManpower,
  getManpowerCountsForEdition,
} from "@/lib/data/departments";
import { getRecords } from "@/lib/data/records";
import { createClient } from "@/lib/supabase/server";
import { BackToEditions } from "@/components/shell/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Tabs } from "@/components/ui/Tabs";
import { ManpowerPanel } from "@/components/department/ManpowerPanel";
import { GenericRecordList } from "@/components/department/GenericRecordList";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { departmentByKey } from "@/lib/constants";
import { formatDate, formatMYR, daysUntil, percent } from "@/lib/utils";
import { isDemo } from "@/lib/demo";

export const dynamic = "force-dynamic";

export default async function CeoPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "overview" } = await searchParams;
  const workspace = await getWorkspace();
  const { currentEdition, departments } = workspace;
  const dept = findDepartment(departments, "ceo");
  const path = "/ceo";

  const [tasksByDepartment, manpowerCounts, ceoManpower, crossUnitReports, postMortems] =
    await Promise.all([
      getAllTasksForEdition(departments),
      getManpowerCountsForEdition(departments),
      getManpower(dept.id),
      getRecords(dept.id, "cross_unit_report"),
      getRecords(dept.id, "post_mortem"),
    ]);

  const departmentIds = departments.map((d) => d.id);

  let participantCount = 0;
  let budgetItems: { type: string; amount: number; status: string }[] = [];
  if (!isDemo()) {
    const supabase = await createClient();
    const [{ count }, { data }] = await Promise.all([
      supabase
        .from("participants")
        .select("id", { count: "exact", head: true })
        .eq("edition_id", currentEdition.id)
        .eq("waitlisted", false),
      departmentIds.length
        ? supabase.from("budget_items").select("type, amount, status").in("department_id", departmentIds)
        : Promise.resolve({ data: [] as { type: string; amount: number; status: string }[] }),
    ]);
    participantCount = count ?? 0;
    budgetItems = (data ?? []) as { type: string; amount: number; status: string }[];
  }

  const revenuePaid = (budgetItems ?? [])
    .filter((b) => b.type === "revenue" && b.status === "paid")
    .reduce((sum, b) => sum + Number(b.amount), 0);
  const totalExpenses = (budgetItems ?? [])
    .filter((b) => b.type === "expense")
    .reduce((sum, b) => sum + Number(b.amount), 0);

  const allTasks = Object.values(tasksByDepartment).flat();
  const tasksDone = allTasks.filter((t) => t.status === "done").length;
  const totalManpower = manpowerCounts.internal + manpowerCounts.external;
  const daysToEvent = daysUntil(currentEdition.start_date);

  const activity = [
    ...allTasks.map((t) => ({ label: `Task added: ${t.title}`, at: t.created_at })),
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 5);

  return (
    <div>
      <BackToEditions />

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total Participants" value={participantCount ?? 0} caption={`target: ${currentEdition.target_participants}`} icon="👥" />
        <StatCard label="Revenue (Paid)" value={formatMYR(revenuePaid)} caption="paid revenue items" icon="💰" />
        <StatCard label="Total Expenses" value={formatMYR(totalExpenses)} caption="paid expense items" icon="📄" />
        <StatCard
          label="Tasks Done"
          value={`${tasksDone} / ${allTasks.length}`}
          caption="across all units"
          icon="✅"
          progress={percent(tasksDone, allTasks.length)}
        />
        <StatCard label="Total Manpower" value={totalManpower} caption={`${manpowerCounts.internal} internal · ${manpowerCounts.external} external`} icon="🏃" />
        <StatCard
          label="Days to Event"
          value={daysToEvent === null ? "—" : daysToEvent}
          caption={daysToEvent === null ? "no date set" : daysToEvent < 0 ? "days ago" : daysToEvent === 0 ? "today" : "days to go"}
          icon="🗓️"
        />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <Tabs
          basePath={path}
          activeKey={tab}
          tabs={[
            { key: "overview", label: "Edition Overview", icon: "📊" },
            { key: "cross_unit_report", label: "Cross-unit Report", icon: "📈" },
            { key: "post_mortem", label: "Post-Mortem", icon: "🔍" },
            { key: "manpower", label: "Manpower", icon: "👥" },
          ]}
        />
        <div className="p-4">
          {tab === "overview" && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                  <h3 className="mb-3 text-sm font-semibold text-gray-800">Edition Details</h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    <DetailField label="Theme" value={currentEdition.theme ?? "—"} />
                    <DetailField label="Status" value={currentEdition.status.toUpperCase()} />
                    <DetailField label="Start Date" value={formatDate(currentEdition.start_date)} />
                    <DetailField label="End Date" value={formatDate(currentEdition.end_date)} />
                    <DetailField label="Venue" value={currentEdition.venue ?? "—"} />
                    <DetailField label="Venue Address" value={currentEdition.venue_address ?? "—"} />
                    <DetailField label="Participant Target" value={String(currentEdition.target_participants)} />
                    <DetailField label="Profitability Target" value={`${currentEdition.profitability_target_percent}%`} />
                    <DetailField label="Reg. Deadline" value={formatDate(currentEdition.registration_deadline)} />
                    <DetailField label="Test Run" value={formatDate(currentEdition.test_run_date)} />
                    <DetailField label="Days to Event" value={daysToEvent === null ? "—" : `${daysToEvent} days`} />
                    <DetailField label="Total Manpower" value={String(totalManpower)} />
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                  <h3 className="mb-3 text-sm font-semibold text-gray-800">Department Leads</h3>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {departments.map((d) => (
                      <div key={d.id} className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-sm">
                        <span className="text-gray-500">{departmentByKey(d.key).name}</span>
                        <span className="font-medium text-gray-800">{d.lead_name ?? "TBD"}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                  <h3 className="mb-3 text-sm font-semibold text-gray-800">Tasks by Unit</h3>
                  <div className="space-y-2">
                    {departments.map((d) => {
                      const tasks = tasksByDepartment[d.id] ?? [];
                      const done = tasks.filter((t) => t.status === "done").length;
                      return (
                        <div key={d.id}>
                          <div className="mb-1 flex justify-between text-xs text-gray-600">
                            <span>{departmentByKey(d.key).name}</span>
                            <span>
                              {done}/{tasks.length}
                            </span>
                          </div>
                          <ProgressBar value={percent(done, tasks.length)} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                  <h3 className="mb-3 text-sm font-semibold text-gray-800">Activity Feed</h3>
                  {activity.length === 0 ? (
                    <p className="py-6 text-center text-sm text-gray-400">No recent activity</p>
                  ) : (
                    <ul className="space-y-2 text-xs text-gray-600">
                      {activity.map((a, i) => (
                        <li key={i} className="border-b border-gray-100 pb-2 last:border-0">
                          {a.label}
                          <div className="text-gray-400">{new Date(a.at).toLocaleString()}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                  <h3 className="mb-3 text-sm font-semibold text-gray-800">Key Metrics</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Tasks Done</dt>
                      <dd className="font-semibold text-green-600">
                        {tasksDone}/{allTasks.length}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Total Manpower</dt>
                      <dd className="font-semibold text-blue-600">{totalManpower} people</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Participants</dt>
                      <dd className="font-semibold text-purple-600">
                        {participantCount ?? 0}/{currentEdition.target_participants}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          )}

          {tab === "cross_unit_report" && (
            <GenericRecordList
              departmentId={dept.id}
              path={path}
              records={crossUnitReports}
              config={{
                kind: "cross_unit_report",
                heading: "📈 Cross-unit Report",
                titleLabel: "Report title",
                showNotes: true,
                addLabel: "+ Add Report",
                addVariant: "primary",
                emptyMessage: "No reports yet",
              }}
            />
          )}

          {tab === "post_mortem" && (
            <GenericRecordList
              departmentId={dept.id}
              path={path}
              records={postMortems}
              config={{
                kind: "post_mortem",
                heading: "🔍 Post-Mortem",
                titleLabel: "Topic",
                subtitleLabel: "Department",
                showNotes: true,
                addLabel: "+ Add Note",
                addVariant: "primary",
                emptyMessage: "No post-mortem notes yet",
              }}
            />
          )}

          {tab === "manpower" && <ManpowerPanel departmentId={dept.id} manpower={ceoManpower} path={path} />}
        </div>
      </div>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-gray-400">{label}</div>
      <div className="font-medium text-gray-800">{value}</div>
    </div>
  );
}
