import { getWorkspace, findDepartment } from "@/lib/data/workspace";
import { getManpower } from "@/lib/data/departments";
import { getRecords } from "@/lib/data/records";
import { getCueBlocks } from "@/lib/data/showcase";
import { createClient } from "@/lib/supabase/server";
import { BackToEditions } from "@/components/shell/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Tabs } from "@/components/ui/Tabs";
import { ManpowerPanel } from "@/components/department/ManpowerPanel";
import { GenericRecordList } from "@/components/department/GenericRecordList";
import { CueSheet } from "@/components/department/CueSheet";
import { isDemo } from "@/lib/demo";

export const dynamic = "force-dynamic";

export default async function ShowcasePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; day?: string }>;
}) {
  const { tab = "cue_sheet", day = "1" } = await searchParams;
  const workspace = await getWorkspace();
  const { currentEdition } = workspace;
  const dept = findDepartment(workspace.departments, "showcase");
  const path = "/showcase";

  const [cueBlocks, schedule, scoring, checklist, manpower] = await Promise.all([
    getCueBlocks(dept.id),
    getRecords(dept.id, "participant_schedule"),
    getRecords(dept.id, "scoring"),
    getRecords(dept.id, "stage_checklist"),
    getManpower(dept.id),
  ]);

  let participantCount = 0;
  if (!isDemo()) {
    const supabase = await createClient();
    const { count } = await supabase
      .from("participants")
      .select("id", { count: "exact", head: true })
      .eq("edition_id", currentEdition.id)
      .eq("waitlisted", false);
    participantCount = count ?? 0;
  }

  const categoriesCount = new Set(scoring.map((s) => s.subtitle).filter(Boolean)).size;
  const judgesCount = manpower.filter((m) => m.role?.toLowerCase().includes("judge")).length;

  return (
    <div>
      <BackToEditions />

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Participants" value={participantCount ?? 0} caption="registered" icon="🎤" />
        <StatCard label="Categories" value={categoriesCount} caption="configured" icon="📁" />
        <StatCard label="Cue Sheet Items" value={cueBlocks.length} caption="all days" icon="📋" />
        <StatCard label="Judges" value={judgesCount || "—"} caption="add via Manpower tab" icon="🧑‍⚖️" />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <Tabs
          basePath={path}
          activeKey={tab}
          tabs={[
            { key: "cue_sheet", label: "Cue Sheet", icon: "📋" },
            { key: "participant_schedule", label: "Participant Schedule" },
            { key: "scoring", label: "Scoring", icon: "🧑‍⚖️" },
            { key: "stage_checklist", label: "Stage Checklist", icon: "✅" },
            { key: "manpower", label: "Manpower", icon: "👥" },
          ]}
        />
        <div className="p-4">
          {tab === "cue_sheet" && (
            <CueSheet departmentId={dept.id} blocks={cueBlocks} day={Number(day) || 1} path={path} />
          )}
          {tab === "participant_schedule" && (
            <GenericRecordList
              departmentId={dept.id}
              path={path}
              records={schedule}
              config={{
                kind: "participant_schedule",
                heading: "🗓️ Participant Schedule",
                titleLabel: "Participant / team",
                subtitleLabel: "Slot / time",
                addLabel: "+ Add Slot",
                addVariant: "primary",
                emptyMessage: "No schedule entries yet",
              }}
            />
          )}
          {tab === "scoring" && (
            <GenericRecordList
              departmentId={dept.id}
              path={path}
              records={scoring}
              config={{
                kind: "scoring",
                heading: "🧑‍⚖️ Scoring",
                titleLabel: "Participant / team",
                subtitleLabel: "Category",
                showAmount: true,
                amountLabel: "Score",
                addLabel: "+ Add Score",
                addVariant: "primary",
                emptyMessage: "No scores recorded yet",
              }}
            />
          )}
          {tab === "stage_checklist" && (
            <GenericRecordList
              departmentId={dept.id}
              path={path}
              records={checklist}
              config={{
                kind: "stage_checklist",
                heading: "✅ Stage Checklist",
                titleLabel: "Checklist item",
                statusOptions: [
                  { value: "pending", label: "Pending" },
                  { value: "done", label: "Done" },
                ],
                addLabel: "+ Add Item",
                addVariant: "primary",
                emptyMessage: "No checklist items yet",
              }}
            />
          )}
          {tab === "manpower" && <ManpowerPanel departmentId={dept.id} manpower={manpower} path={path} />}
        </div>
      </div>
    </div>
  );
}
