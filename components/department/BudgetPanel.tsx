import type { BudgetItem } from "@/lib/types";
import { summarizeBudget } from "@/lib/data/procurement";
import { addBudgetItem, deleteBudgetItem, updateBudgetItemStatus } from "@/app/actions/procurement";
import { ActionForm } from "@/components/ui/ActionForm";
import { InlineToggle } from "@/components/ui/InlineToggle";
import { Input, Select } from "@/components/ui/fields";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatMYR, percent } from "@/lib/utils";

function BudgetList({
  departmentId,
  editionId,
  type,
  items,
  path,
}: {
  departmentId: string;
  editionId: string;
  type: "revenue" | "expense";
  items: BudgetItem[];
  path: string;
}) {
  const variant = type === "revenue" ? "green" : "red";
  return (
    <div className="flex-1 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">
          {type === "revenue" ? "💰 Revenue" : "🧾 Expenses"}
        </h3>
        <InlineToggle label={type === "revenue" ? "+ Add Revenue" : "+ Add Expense"} variant={variant}>
          {(close) => (
            <ActionForm action={addBudgetItem} onDone={close} className="flex flex-col gap-2 rounded-md border border-gray-200 p-3">
              <input type="hidden" name="department_id" value={departmentId} />
              <input type="hidden" name="edition_id" value={editionId} />
              <input type="hidden" name="type" value={type} />
              <Input name="description" placeholder="Description" autoFocus required />
              <Input name="category" placeholder="Category (optional)" />
              <div className="flex gap-2">
                <Input name="amount" type="number" step="0.01" min="0" placeholder="Amount (MYR)" required />
                <Select name="status" defaultValue="pending">
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                </Select>
              </div>
              <input type="hidden" name="path" value={path} />
              <div className="flex gap-2">
                <Button type="submit" variant={variant} className="!px-3 !py-1.5 text-xs">
                  Save
                </Button>
                <button type="button" onClick={close} className="text-xs text-gray-400">
                  Cancel
                </button>
              </div>
            </ActionForm>
          )}
        </InlineToggle>
      </div>

      {items.length === 0 ? (
        <EmptyState message="No items yet" />
      ) : (
        <ul className="divide-y divide-gray-100">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <div className="font-medium text-gray-800">{item.description}</div>
                <div className="text-xs text-gray-400">{item.category ?? "—"}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-700">{formatMYR(item.amount)}</span>
                <ActionForm action={updateBudgetItemStatus}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="path" value={path} />
                  <Select
                    name="status"
                    defaultValue={item.status}
                    className="!py-1 text-xs"
                    onChange={(e) => e.currentTarget.form?.requestSubmit()}
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                  </Select>
                </ActionForm>
                <ActionForm action={deleteBudgetItem}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="path" value={path} />
                  <button type="submit" className="text-xs text-gray-400 hover:text-red-500">
                    ✕
                  </button>
                </ActionForm>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function BudgetPanel({
  departmentId,
  editionId,
  items,
  path,
  profitabilityTarget,
}: {
  departmentId: string;
  editionId: string;
  items: BudgetItem[];
  path: string;
  profitabilityTarget: number;
}) {
  const summary = summarizeBudget(items);
  const profitability = summary.revenueCollectedPaid
    ? percent(summary.netPaidPL, summary.revenueCollectedPaid)
    : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row">
        <BudgetList departmentId={departmentId} editionId={editionId} type="revenue" items={summary.revenue} path={path} />
        <BudgetList departmentId={departmentId} editionId={editionId} type="expense" items={summary.expenses} path={path} />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-gray-800">
          📊 P&amp;L Summary
        </h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <SummaryStat label="Total Budgeted Revenue" value={formatMYR(summary.totalBudgetedRevenue)} />
          <SummaryStat label="Total Budgeted Expenses" value={formatMYR(summary.totalBudgetedExpenses)} />
          <SummaryStat label="Revenue Collected (Paid)" value={formatMYR(summary.revenueCollectedPaid)} tone="text-green-600" />
          <SummaryStat
            label="Net P&L (Paid items)"
            value={`${summary.netPaidPL >= 0 ? "+" : ""}${formatMYR(summary.netPaidPL)}`}
            tone={summary.netPaidPL >= 0 ? "text-green-600" : "text-red-600"}
          />
        </div>
        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
            <span>Profitability: {profitability}%</span>
            <span>Target: {profitabilityTarget}%</span>
          </div>
          <ProgressBar value={profitability} />
        </div>
      </div>
    </div>
  );
}

function SummaryStat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div>
      <div className="text-xs text-gray-400">{label}</div>
      <div className={`text-lg font-bold ${tone ?? "text-gray-900"}`}>{value}</div>
    </div>
  );
}
