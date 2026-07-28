import { notFound, redirect } from "next/navigation";
import { getWorkspace, findDepartment } from "@/lib/data/workspace";
import { getBoothCheckinData } from "@/lib/data/booth-checkin";
import { BackToEditions, PageHeader } from "@/components/shell/PageHeader";
import { CheckInKiosk } from "@/components/department/CheckInKiosk";

export const dynamic = "force-dynamic";

export default async function BoothPage({
  params,
}: {
  params: Promise<{ checkpoint: string }>;
}) {
  const { checkpoint: checkpointParam } = await params;
  const checkpoint = Number(checkpointParam);
  if (!Number.isInteger(checkpoint) || checkpoint < 1 || checkpoint > 5) {
    notFound();
  }

  const workspace = await getWorkspace();
  const { currentEdition } = workspace;
  const regDept = findDepartment(workspace.departments, "registration_area");
  const allowedCheckpoints = workspace.checkpointsByDepartment[regDept.id] ?? null;

  // null = whole-department grant (every booth allowed). Otherwise this
  // booth must be explicitly in the viewer's own checkpoint list -- same
  // boundary RLS enforces on the actual writes, this just avoids sending
  // someone to a booth page they have no access to.
  if (allowedCheckpoints !== null && !allowedCheckpoints.includes(checkpoint)) {
    redirect("/registration-area");
  }

  const path = `/registration-area/${checkpoint}`;
  const { registered, reachedByParticipant, checkinUrl, qrDataUrl } = await getBoothCheckinData(
    currentEdition.id,
    path
  );

  return (
    <div className="space-y-6">
      <BackToEditions />
      <PageHeader icon="🎫" title={`Booth ${checkpoint}`} subtitle={currentEdition.name} />

      <CheckInKiosk
        participants={registered}
        reachedByParticipant={reachedByParticipant}
        path={path}
        checkinUrl={checkinUrl}
        qrDataUrl={qrDataUrl}
        allowedCheckpoints={[checkpoint]}
      />
    </div>
  );
}
