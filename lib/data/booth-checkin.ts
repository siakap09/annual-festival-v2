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
import { getCheckinEvents, getParticipants } from "@/lib/data/registration";
import type { Participant } from "@/lib/types";

export interface BoothCheckinData {
  registered: Participant[];
  reachedByParticipant: Record<string, number[]>;
  checkinUrl: string;
  qrDataUrl: string;
}

/**
 * Shared by the Booth Area overview page and each per-booth page: both need
 * the same edition-wide participant/check-in data (the sequential-order
 * rule needs a student's full cross-checkpoint progress regardless of which
 * booth is viewing it) plus a QR/share link pointing at their own path.
 */
export async function getBoothCheckinData(editionId: string, path: string): Promise<BoothCheckinData> {
  const [participants, checkinEvents] = await Promise.all([
    getParticipants(editionId),
    getCheckinEvents(editionId),
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

  return { registered, reachedByParticipant, checkinUrl, qrDataUrl };
}
