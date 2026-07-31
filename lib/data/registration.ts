import { createClient } from "@/lib/supabase/server";
import { isDemo } from "@/lib/demo";
import type { CheckinEvent, Participant } from "@/lib/types";

const PAGE_SIZE = 1000;

export async function getParticipants(editionId: string): Promise<Participant[]> {
  if (isDemo()) return [];
  const supabase = await createClient();

  // PostgREST caps any single select at its configured max-rows (commonly
  // 1000) regardless of how many rows actually match -- paginate via
  // .range() so an edition with more students than that isn't silently
  // truncated.
  const all: Participant[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data } = await supabase
      .from("participants")
      .select("*")
      .eq("edition_id", editionId)
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    all.push(...((data ?? []) as Participant[]));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return all;
}

export async function getCheckinEvents(editionId: string): Promise<CheckinEvent[]> {
  if (isDemo()) return [];
  const supabase = await createClient();
  const { data: participants } = await supabase
    .from("participants")
    .select("id")
    .eq("edition_id", editionId);

  const ids = (participants ?? []).map((p) => p.id);
  if (ids.length === 0) return [];

  const { data } = await supabase
    .from("checkin_events")
    .select("*")
    .in("participant_id", ids);
  return (data ?? []) as CheckinEvent[];
}
