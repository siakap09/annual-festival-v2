import { createClient } from "@/lib/supabase/server";
import { isDemo } from "@/lib/demo";
import type { BudgetItem } from "@/lib/types";

export { summarizeBudget } from "@/lib/budget";

export async function getBudgetItems(departmentId: string): Promise<BudgetItem[]> {
  if (isDemo()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("budget_items")
    .select("*")
    .eq("department_id", departmentId)
    .order("created_at", { ascending: false });
  return (data ?? []) as BudgetItem[];
}
