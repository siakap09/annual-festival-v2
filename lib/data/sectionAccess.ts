import { createClient } from "@/lib/supabase/server";
import { isDemo } from "@/lib/demo";
import type { SectionAccess } from "@/lib/types";

export async function getSectionAccessForEdition(editionId: string): Promise<SectionAccess[]> {
  if (isDemo()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("section_access")
    .select("*")
    .eq("edition_id", editionId)
    .order("created_at", { ascending: true });
  return (data ?? []) as SectionAccess[];
}
