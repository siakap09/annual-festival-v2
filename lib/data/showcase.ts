import { createClient } from "@/lib/supabase/server";
import type { CueBlock } from "@/lib/types";

export async function getCueBlocks(departmentId: string): Promise<CueBlock[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cue_blocks")
    .select("*")
    .eq("department_id", departmentId)
    .order("day", { ascending: true })
    .order("position", { ascending: true });
  return (data ?? []) as CueBlock[];
}
