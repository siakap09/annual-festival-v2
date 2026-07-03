import QRCode from "qrcode";
import { headers } from "next/headers";
import { getWorkspace, findDepartment } from "@/lib/data/workspace";
import { getCheckinEvents, getParticipants } from "@/lib/data/registration";
import { BackToEditions, PageHeader } from "@/components/shell/PageHeader";
import { CheckInKiosk } from "@/components/department/CheckInKiosk";

export const dynamic = "force-dynamic";

export default async function RegistrationAreaPage() {
  const workspace = await getWorkspace();
  const { currentEdition } = workspace;
  findDepartment(workspace.departments, "registration_area");
  const path = "/registration-area";

  const [participants, checkinEvents] = await Promise.all([
    getParticipants(currentEdition.id),
    getCheckinEvents(currentEdition.id),
  ]);

  const registered = participants.filter((p) => !p.waitlisted);

  const reachedByParticipant: Record<string, number[]> = {};
  for (const event of checkinEvents) {
    reachedByParticipant[event.participant_id] = reachedByParticipant[event.participant_id] ?? [];
    reachedByParticipant[event.participant_id].push(event.checkpoint);
  }

  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const checkinUrl = `${protocol}://${host}${path}`;
  const qrDataUrl = await QRCode.toDataURL(checkinUrl, { margin: 1, width: 200 });

  return (
    <div>
      <BackToEditions />
      <PageHeader icon="🎫" title="Registration Area" subtitle={currentEdition.name} />

      <CheckInKiosk
        participants={registered}
        reachedByParticipant={reachedByParticipant}
        path={path}
        checkinUrl={checkinUrl}
        qrDataUrl={qrDataUrl}
      />
    </div>
  );
}
