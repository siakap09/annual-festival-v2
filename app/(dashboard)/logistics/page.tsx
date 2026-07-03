import { getWorkspace, findDepartment } from "@/lib/data/workspace";
import { getManpower } from "@/lib/data/departments";
import { getRecords } from "@/lib/data/records";
import { BackToEditions, PageHeader } from "@/components/shell/PageHeader";
import { Tabs } from "@/components/ui/Tabs";
import { ManpowerPanel } from "@/components/department/ManpowerPanel";
import { GenericRecordList, type RecordListConfig } from "@/components/department/GenericRecordList";

export const dynamic = "force-dynamic";

const LIST_TABS: { key: string; label: string; config: RecordListConfig }[] = [
  {
    key: "venue_site",
    label: "Venue & Site",
    config: {
      kind: "venue_site",
      heading: "📍 Venue & Site",
      titleLabel: "Item",
      subtitleLabel: "Details",
      addLabel: "+ Add Item",
      addVariant: "primary",
      emptyMessage: "No venue details yet",
    },
  },
  {
    key: "loading_bay",
    label: "Loading Bay",
    config: {
      kind: "loading_bay",
      heading: "🚛 Loading Bay",
      titleLabel: "Slot / vendor",
      subtitleLabel: "Notes",
      showDueDate: true,
      addLabel: "+ Add Slot",
      addVariant: "primary",
      emptyMessage: "No loading bay slots yet",
    },
  },
  {
    key: "pack_checklist",
    label: "Pack Checklist",
    config: {
      kind: "pack_checklist",
      heading: "✅ Pack Checklist",
      titleLabel: "Item",
      statusOptions: [
        { value: "pending", label: "Pending" },
        { value: "packed", label: "Packed" },
      ],
      addLabel: "+ Add Item",
      addVariant: "primary",
      emptyMessage: "No checklist items yet",
    },
  },
  {
    key: "todo_list",
    label: "To-Do List",
    config: {
      kind: "todo_list",
      heading: "📝 To-Do List",
      titleLabel: "Task",
      statusOptions: [
        { value: "pending", label: "Pending" },
        { value: "done", label: "Done" },
      ],
      showDueDate: true,
      addLabel: "+ Add Task",
      addVariant: "primary",
      emptyMessage: "No to-dos yet",
    },
  },
  {
    key: "long_lead_items",
    label: "Long Lead Items",
    config: {
      kind: "long_lead_items",
      heading: "⏳ Long Lead Items",
      titleLabel: "Item",
      subtitleLabel: "Vendor",
      showDueDate: true,
      addLabel: "+ Add Item",
      addVariant: "primary",
      emptyMessage: "No long lead items yet",
    },
  },
  {
    key: "daily_tasks",
    label: "Daily Tasks",
    config: {
      kind: "daily_tasks",
      heading: "📆 Daily Tasks",
      titleLabel: "Task",
      subtitleLabel: "Day",
      statusOptions: [
        { value: "pending", label: "Pending" },
        { value: "done", label: "Done" },
      ],
      addLabel: "+ Add Task",
      addVariant: "primary",
      emptyMessage: "No daily tasks yet",
    },
  },
  {
    key: "accommodation",
    label: "Accommodation",
    config: {
      kind: "accommodation",
      heading: "🏨 Accommodation",
      titleLabel: "Guest / group",
      subtitleLabel: "Room / hotel",
      showDueDate: true,
      addLabel: "+ Add Booking",
      addVariant: "primary",
      emptyMessage: "No bookings yet",
    },
  },
  {
    key: "registration_flow",
    label: "Registration Flow",
    config: {
      kind: "registration_flow",
      heading: "🔁 Registration Flow",
      titleLabel: "Step",
      subtitleLabel: "Owner",
      addLabel: "+ Add Step",
      addVariant: "primary",
      emptyMessage: "No flow steps yet",
    },
  },
  {
    key: "meals",
    label: "Meals & Refreshment",
    config: {
      kind: "meals",
      heading: "🍽️ Meals & Refreshment",
      titleLabel: "Meal / item",
      subtitleLabel: "Time / vendor",
      addLabel: "+ Add Item",
      addVariant: "primary",
      emptyMessage: "No meal plans yet",
    },
  },
];

export default async function LogisticsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "manpower" } = await searchParams;
  const workspace = await getWorkspace();
  const dept = findDepartment(workspace.departments, "logistics");
  const path = "/logistics";

  const manpower = tab === "manpower" ? await getManpower(dept.id) : [];
  const activeListTab = LIST_TABS.find((t) => t.key === tab);
  const records = activeListTab ? await getRecords(dept.id, activeListTab.config.kind) : [];

  return (
    <div>
      <BackToEditions />
      <PageHeader icon="🚚" title="Logistics" subtitle={workspace.currentEdition.name} />

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <Tabs
          basePath={path}
          activeKey={tab}
          tabs={[
            { key: "manpower", label: "Manpower", icon: "👥" },
            ...LIST_TABS.map((t) => ({ key: t.key, label: t.label })),
          ]}
        />
        <div className="p-4">
          {tab === "manpower" && <ManpowerPanel departmentId={dept.id} manpower={manpower} path={path} />}
          {activeListTab && (
            <GenericRecordList departmentId={dept.id} path={path} records={records} config={activeListTab.config} />
          )}
        </div>
      </div>
    </div>
  );
}
