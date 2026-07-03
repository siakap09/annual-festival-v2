import { createClient } from "@/lib/supabase/server";
import { isDemo } from "@/lib/demo";
import type { CheckinEvent, Participant } from "@/lib/types";

export async function getParticipants(editionId: string): Promise<Participant[]> {
  if (isDemo()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("participants")
    .select("*")
    .eq("edition_id", editionId)
    .order("created_at", { ascending: false });
  return (data ?? []) as Participant[];
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
