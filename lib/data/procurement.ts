import { createClient } from "@/lib/supabase/server";
import type { BudgetItem } from "@/lib/types";

export async function getBudgetItems(departmentId: string): Promise<BudgetItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("budget_items")
    .select("*")
    .eq("department_id", departmentId)
    .order("created_at", { ascending: false });
  return (data ?? []) as BudgetItem[];
}

export function summarizeBudget(items: BudgetItem[]) {
  const revenue = items.filter((i) => i.type === "revenue");
  const expenses = items.filter((i) => i.type === "expense");

  const totalBudgetedRevenue = revenue.reduce((sum, i) => sum + Number(i.amount), 0);
  const totalBudgetedExpenses = expenses.reduce((sum, i) => sum + Number(i.amount), 0);
  const revenueCollectedPaid = revenue
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + Number(i.amount), 0);
  const expensesPaid = expenses
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + Number(i.amount), 0);
  const netPaidPL = revenueCollectedPaid - expensesPaid;

  return {
    revenue,
    expenses,
    totalBudget: totalBudgetedRevenue + totalBudgetedExpenses,
    totalBudgetedRevenue,
    totalBudgetedExpenses,
    revenueCollectedPaid,
    totalExpensesAll: totalBudgetedExpenses,
    expensesPaid,
    netPaidPL,
  };
}
