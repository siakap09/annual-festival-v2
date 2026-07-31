import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

/**
 * Public lookup for the parent-facing QR page -- the visitor has no
 * Supabase session (they're not staff, just a parent who opened an email
 * link), so the normal RLS-scoped client would return nothing. Uses the
 * service-role client instead, scoped tightly to an exact match on the
 * qr_token itself (a random, unguessable 24-hex-char value -- effectively
 * a capability URL), so this can never leak any other student's data.
 */
export async function getParticipantByQrToken(token: string): Promise<Participant | null> {
  if (isDemo()) return null;
  const admin = createAdminClient();
  const { data } = await admin.from("participants").select("*").eq("qr_token", token).maybeSingle();
  return (data as Participant | null) ?? null;
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
