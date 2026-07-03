import { getWorkspace, findDepartment } from "@/lib/data/workspace";
import { getSponsors, getSponsorPackages, getVvipGuests } from "@/lib/data/sponsorship";
import { getManpower } from "@/lib/data/departments";
import { BackToEditions } from "@/components/shell/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Tabs } from "@/components/ui/Tabs";
import { SponsorPipeline } from "@/components/department/SponsorPipeline";
import { VvipGuestList } from "@/components/department/VvipGuestList";
import { SponsorPackagesList } from "@/components/department/SponsorPackagesList";
import { ManpowerPanel } from "@/components/department/ManpowerPanel";
import { formatMYR, percent } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SponsorshipPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "pipeline" } = await searchParams;
  const workspace = await getWorkspace();
  const { currentEdition, departments } = workspace;
  const dept = findDepartment(departments, "sponsorship");
  const path = "/sponsorship";

  const [sponsors, vvipGuests, packages, manpower] = await Promise.all([
    getSponsors(dept.id),
    getVvipGuests(dept.id),
    getSponsorPackages(dept.id),
    getManpower(dept.id),
  ]);

  const confirmed = sponsors.filter((s) => s.stage === "confirmed" || s.stage === "fulfilled").length;
  const pipelineRevenue = sponsors
    .filter((s) => s.stage === "confirmed" || s.stage === "fulfilled")
    .reduce((sum, s) => sum + Number(s.amount), 0);

  return (
    <div>
      <BackToEditions />

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Sponsors" value={sponsors.length} caption="in pipeline" icon="🏅" />
        <StatCard
          label="Confirmed"
          value={confirmed}
          caption="confirmed + fulfilled"
          icon="✅"
          progress={percent(confirmed, sponsors.length)}
        />
        <StatCard label="VVIP Guests" value={vvipGuests.length} caption="VVIP flagged" icon="⭐" />
        <StatCard label="Pipeline Revenue" value={formatMYR(pipelineRevenue)} caption="paid revenue items" icon="💰" />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <Tabs
          basePath={path}
          activeKey={tab}
          tabs={[
            { key: "pipeline", label: "Sponsor Pipeline", icon: "🚩" },
            { key: "vvip", label: "VVIP Guest List", icon: "⭐" },
            { key: "packages", label: "Sponsor Packages", icon: "🎁" },
            { key: "manpower", label: "Manpower", icon: "👥" },
          ]}
        />
        <div className="p-4">
          {tab === "pipeline" && (
            <SponsorPipeline departmentId={dept.id} editionId={currentEdition.id} sponsors={sponsors} path={path} />
          )}
          {tab === "vvip" && (
            <VvipGuestList departmentId={dept.id} editionId={currentEdition.id} guests={vvipGuests} path={path} />
          )}
          {tab === "packages" && (
            <SponsorPackagesList departmentId={dept.id} editionId={currentEdition.id} packages={packages} path={path} />
          )}
          {tab === "manpower" && <ManpowerPanel departmentId={dept.id} manpower={manpower} path={path} />}
        </div>
      </div>
    </div>
  );
}
