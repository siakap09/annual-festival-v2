import type { BudgetItem } from "@/lib/types";

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
