import { createClient } from "@/lib/supabase/server";
import type { DepartmentRecord } from "@/lib/types";

export async function getRecords(
  departmentId: string,
  kind: string
): Promise<DepartmentRecord[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("department_records")
    .select("*")
    .eq("department_id", departmentId)
    .eq("kind", kind)
    .order("position", { ascending: true })
    .order("created_at", { ascending: false });
  return (data ?? []) as DepartmentRecord[];
}
