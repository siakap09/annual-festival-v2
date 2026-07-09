// qrcode's package.json remaps its root entry to a browser/canvas-based
// implementation via the legacy "browser" field, which throws "You need to
// specify a canvas element" when it ends up in a server bundle. The
// "Node-safe" qrcode/lib/server entry doesn't fix this either: it
// unconditionally requires every renderer (including the PNG one) at module
// load time, and the PNG renderer depends on pngjs -> Node's zlib/stream,
// unavailable under the Edge Runtime this whole app runs on for Cloudflare
// compatibility. So we bypass qrcode/lib/server entirely and import only
// the two zero-native-dependency pieces we need directly: the QR matrix
// encoder (core/qrcode) and the SVG string renderer (renderer/svg-tag).
// @ts-expect-error -- no type declarations for this subpath
import { create as createQrData } from "qrcode/lib/core/qrcode";
// @ts-expect-error -- no type declarations for this subpath
import { render as renderQrSvg } from "qrcode/lib/renderer/svg-tag";
import { headers } from "next/headers";
import { getWorkspace, findDepartment } from "@/lib/data/workspace";
import { getCheckinEvents, getParticipants } from "@/lib/data/registration";
import { BackToEditions, PageHeader } from "@/components/shell/PageHeader";
import { CheckInKiosk } from "@/components/department/CheckInKiosk";

export const dynamic = "force-dynamic";

export default async function RegistrationAreaPage() {
  const workspace = await getWorkspace();
  const { currentEdition } = workspace;
  const regDept = findDepartment(workspace.departments, "registration_area");
  const path = "/registration-area";
  const allowedCheckpoints = workspace.checkpointsByDepartment[regDept.id] ?? null;

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
  const qrData = createQrData(checkinUrl, {});
  const qrSvg: string = renderQrSvg(qrData, { margin: 1, width: 200 });
  const qrDataUrl = `data:image/svg+xml;base64,${btoa(qrSvg)}`;

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
        allowedCheckpoints={allowedCheckpoints}
      />
    </div>
  );
}
