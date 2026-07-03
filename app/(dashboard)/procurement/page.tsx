import { getWorkspace, findDepartment } from "@/lib/data/workspace";
import { getBudgetItems, summarizeBudget } from "@/lib/data/procurement";
import { getManpower } from "@/lib/data/departments";
import { getRecords } from "@/lib/data/records";
import { BackToEditions } from "@/components/shell/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Tabs } from "@/components/ui/Tabs";
import { BudgetPanel } from "@/components/department/BudgetPanel";
import { ManpowerPanel } from "@/components/department/ManpowerPanel";
import { GenericRecordList } from "@/components/department/GenericRecordList";
import { formatMYR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProcurementPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "budget" } = await searchParams;
  const workspace = await getWorkspace();
  const { currentEdition, departments } = workspace;
  const dept = findDepartment(departments, "procurement");
  const path = "/procurement";

  const budgetItems = await getBudgetItems(dept.id);
  const summary = summarizeBudget(budgetItems);

  return (
    <div>
      <BackToEditions />

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Budget" value={formatMYR(summary.totalBudget)} caption="all budget items" icon="📄" />
        <StatCard label="Revenue Collected" value={formatMYR(summary.revenueCollectedPaid)} caption="paid revenue items" icon="💰" />
        <StatCard label="Total Expenses" value={formatMYR(summary.totalBudgetedExpenses)} caption="all expense items" icon="📦" />
        <StatCard
          label="Net P&L"
          value={`${summary.netPaidPL >= 0 ? "+" : ""}${formatMYR(summary.netPaidPL)}`}
          caption="revenue – paid expenses"
          icon="📊"
        />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <Tabs
          basePath={path}
          activeKey={tab}
          tabs={[
            { key: "budget", label: "Budget & P&L", icon: "📄" },
            { key: "inventory", label: "Inventory" },
            { key: "payment_requests", label: "Payment Requests" },
            { key: "expense_tracker", label: "Expense Tracker" },
            { key: "manpower", label: "Manpower", icon: "👥" },
            { key: "participant_payments", label: "Participant Payments" },
            { key: "waitlist", label: "Waitlist" },
          ]}
        />
        <div className="p-4">
          {tab === "budget" && (
            <BudgetPanel
              departmentId={dept.id}
              editionId={currentEdition.id}
              items={budgetItems}
              path={path}
              profitabilityTarget={currentEdition.profitability_target_percent}
            />
          )}
          {tab === "inventory" && (
            <GenericRecordList
              departmentId={dept.id}
              path={path}
              records={await getRecords(dept.id, "inventory")}
              config={{
                kind: "inventory",
                heading: "📦 Inventory",
                titleLabel: "Item name",
                subtitleLabel: "Quantity / unit",
                statusOptions: [
                  { value: "in_stock", label: "In Stock" },
                  { value: "low", label: "Low" },
                  { value: "out", label: "Out of Stock" },
                ],
                addLabel: "+ Add Item",
                addVariant: "primary",
                emptyMessage: "No items yet",
              }}
            />
          )}
          {tab === "payment_requests" && (
            <GenericRecordList
              departmentId={dept.id}
              path={path}
              records={await getRecords(dept.id, "payment_request")}
              config={{
                kind: "payment_request",
                heading: "🧾 Payment Requests",
                titleLabel: "Purpose",
                subtitleLabel: "Requested by",
                showAmount: true,
                amountLabel: "Amount (MYR)",
                statusOptions: [
                  { value: "pending", label: "Pending" },
                  { value: "approved", label: "Approved" },
                  { value: "rejected", label: "Rejected" },
                  { value: "paid", label: "Paid" },
                ],
                addLabel: "+ New Request",
                addVariant: "primary",
                emptyMessage: "No payment requests yet",
              }}
            />
          )}
          {tab === "expense_tracker" && (
            <GenericRecordList
              departmentId={dept.id}
              path={path}
              records={await getRecords(dept.id, "expense_tracker")}
              config={{
                kind: "expense_tracker",
                heading: "🧮 Expense Tracker",
                titleLabel: "Expense",
                subtitleLabel: "Vendor",
                showAmount: true,
                amountLabel: "Amount (MYR)",
                statusOptions: [
                  { value: "pending", label: "Pending" },
                  { value: "paid", label: "Paid" },
                ],
                showDueDate: true,
                addLabel: "+ Log Expense",
                addVariant: "red",
                emptyMessage: "No expenses logged yet",
              }}
            />
          )}
          {tab === "manpower" && (
            <ManpowerPanel departmentId={dept.id} manpower={await getManpower(dept.id)} path={path} />
          )}
          {tab === "participant_payments" && (
            <GenericRecordList
              departmentId={dept.id}
              path={path}
              records={await getRecords(dept.id, "participant_payment")}
              config={{
                kind: "participant_payment",
                heading: "💳 Participant Payments",
                titleLabel: "Participant name",
                subtitleLabel: "Method",
                showAmount: true,
                amountLabel: "Amount (MYR)",
                statusOptions: [
                  { value: "pending", label: "Pending" },
                  { value: "paid", label: "Paid" },
                ],
                addLabel: "+ Record Payment",
                addVariant: "green",
                emptyMessage: "No participant payments yet",
              }}
            />
          )}
          {tab === "waitlist" && (
            <GenericRecordList
              departmentId={dept.id}
              path={path}
              records={await getRecords(dept.id, "waitlist")}
              config={{
                kind: "waitlist",
                heading: "📋 Waitlist",
                titleLabel: "Name",
                subtitleLabel: "Email / phone",
                addLabel: "+ Add to Waitlist",
                addVariant: "primary",
                emptyMessage: "Waitlist is empty",
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
