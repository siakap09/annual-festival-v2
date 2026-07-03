import { getWorkspace, findDepartment } from "@/lib/data/workspace";
import { getManpower } from "@/lib/data/departments";
import { getRecords } from "@/lib/data/records";
import { BackToEditions, PageHeader } from "@/components/shell/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Tabs } from "@/components/ui/Tabs";
import { ManpowerPanel } from "@/components/department/ManpowerPanel";
import { GenericRecordList } from "@/components/department/GenericRecordList";

export const dynamic = "force-dynamic";

// Note: no reference screenshot was provided for this department yet.
// Built to match the visual language of the other department pages;
// refine once the real design is shared.
export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "calendar" } = await searchParams;
  const workspace = await getWorkspace();
  const dept = findDepartment(workspace.departments, "media");
  const path = "/media";

  const [calendar, press, assets, manpower] = await Promise.all([
    getRecords(dept.id, "content_calendar"),
    getRecords(dept.id, "press_coverage"),
    getRecords(dept.id, "asset"),
    getManpower(dept.id),
  ]);

  return (
    <div>
      <BackToEditions />
      <PageHeader icon="📣" title="Media & Publicity" subtitle={workspace.currentEdition.name} />

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Content Pieces" value={calendar.length} caption="planned" icon="🗓️" />
        <StatCard
          label="Published"
          value={calendar.filter((c) => c.status === "published").length}
          caption="live"
          icon="✅"
        />
        <StatCard label="Press Mentions" value={press.length} caption="coverage logged" icon="📰" />
        <StatCard label="Assets" value={assets.length} caption="uploaded" icon="🖼️" />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <Tabs
          basePath={path}
          activeKey={tab}
          tabs={[
            { key: "calendar", label: "Content Calendar", icon: "🗓️" },
            { key: "press", label: "Press Coverage", icon: "📰" },
            { key: "assets", label: "Assets", icon: "🖼️" },
            { key: "manpower", label: "Manpower", icon: "👥" },
          ]}
        />
        <div className="p-4">
          {tab === "calendar" && (
            <GenericRecordList
              departmentId={dept.id}
              path={path}
              records={calendar}
              config={{
                kind: "content_calendar",
                heading: "🗓️ Content Calendar",
                titleLabel: "Post title",
                subtitleLabel: "Channel (IG, FB, TikTok...)",
                statusOptions: [
                  { value: "planned", label: "Planned" },
                  { value: "scheduled", label: "Scheduled" },
                  { value: "published", label: "Published" },
                ],
                showDueDate: true,
                addLabel: "+ Add Post",
                addVariant: "primary",
                emptyMessage: "No content planned yet",
              }}
            />
          )}
          {tab === "press" && (
            <GenericRecordList
              departmentId={dept.id}
              path={path}
              records={press}
              config={{
                kind: "press_coverage",
                heading: "📰 Press Coverage",
                titleLabel: "Outlet / publication",
                subtitleLabel: "Article title or link",
                statusOptions: [
                  { value: "pitched", label: "Pitched" },
                  { value: "confirmed", label: "Confirmed" },
                  { value: "published", label: "Published" },
                ],
                addLabel: "+ Add Coverage",
                addVariant: "primary",
                emptyMessage: "No press coverage logged yet",
              }}
            />
          )}
          {tab === "assets" && (
            <GenericRecordList
              departmentId={dept.id}
              path={path}
              records={assets}
              config={{
                kind: "asset",
                heading: "🖼️ Assets",
                titleLabel: "Asset name",
                subtitleLabel: "Link / location",
                statusOptions: [
                  { value: "draft", label: "Draft" },
                  { value: "final", label: "Final" },
                ],
                addLabel: "+ Add Asset",
                addVariant: "primary",
                emptyMessage: "No assets yet",
              }}
            />
          )}
          {tab === "manpower" && <ManpowerPanel departmentId={dept.id} manpower={manpower} path={path} />}
        </div>
      </div>
    </div>
  );
}
