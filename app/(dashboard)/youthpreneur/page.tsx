import { getWorkspace, findDepartment } from "@/lib/data/workspace";
import { getManpower } from "@/lib/data/departments";
import { getRecords } from "@/lib/data/records";
import { BackToEditions } from "@/components/shell/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Tabs } from "@/components/ui/Tabs";
import { ManpowerPanel } from "@/components/department/ManpowerPanel";
import { GenericRecordList } from "@/components/department/GenericRecordList";
import { BoothRegistry } from "@/components/department/BoothRegistry";

export const dynamic = "force-dynamic";

export default async function YouthpreneurPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  const { tab = "booth_registry", q = "" } = await searchParams;
  const workspace = await getWorkspace();
  const dept = findDepartment(workspace.departments, "youthpreneur");
  const path = "/youthpreneur";

  const [booths, assignments, products, manpower] = await Promise.all([
    getRecords(dept.id, "booth"),
    getRecords(dept.id, "booth_assignment"),
    getRecords(dept.id, "product"),
    getManpower(dept.id),
  ]);

  const confirmed = booths.filter((b) => b.status === "confirmed").length;
  const pending = booths.filter((b) => b.status !== "confirmed").length;

  return (
    <div>
      <BackToEditions />

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Booths" value={booths.length} caption="registered" icon="🏬" />
        <StatCard label="Confirmed" value={confirmed} caption="ready to go" icon="✅" />
        <StatCard label="Pending" value={pending} caption="awaiting confirmation" icon="⏳" />
        <StatCard label="Products Listed" value={products.length} caption="across all booths" icon="🛒" />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <Tabs
          basePath={path}
          activeKey={tab}
          tabs={[
            { key: "booth_registry", label: "Booth Registry", icon: "🏬" },
            { key: "booth_assignment", label: "Booth Assignment" },
            { key: "products", label: "Products", icon: "🛒" },
            { key: "manpower", label: "Manpower", icon: "👥" },
          ]}
        />
        <div className="p-4">
          {tab === "booth_registry" && (
            <BoothRegistry departmentId={dept.id} booths={booths} query={q} path={path} />
          )}
          {tab === "booth_assignment" && (
            <GenericRecordList
              departmentId={dept.id}
              path={path}
              records={assignments}
              config={{
                kind: "booth_assignment",
                heading: "🧭 Booth Assignment",
                titleLabel: "Booth number / location",
                subtitleLabel: "Assigned business",
                addLabel: "+ Assign Booth",
                addVariant: "primary",
                emptyMessage: "No booth assignments yet",
              }}
            />
          )}
          {tab === "products" && (
            <GenericRecordList
              departmentId={dept.id}
              path={path}
              records={products}
              config={{
                kind: "product",
                heading: "🛒 Products",
                titleLabel: "Product name",
                subtitleLabel: "Booth",
                showAmount: true,
                amountLabel: "Price (MYR)",
                addLabel: "+ Add Product",
                addVariant: "primary",
                emptyMessage: "No products listed yet",
              }}
            />
          )}
          {tab === "manpower" && <ManpowerPanel departmentId={dept.id} manpower={manpower} path={path} />}
        </div>
      </div>
    </div>
  );
}
