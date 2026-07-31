import { headers } from "next/headers";
import { qrSvgDataUrl } from "@/lib/qr";
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
  const qrDataUrl = qrSvgDataUrl(checkinUrl);

  return { registered, reachedByParticipant, checkinUrl, qrDataUrl };
}
