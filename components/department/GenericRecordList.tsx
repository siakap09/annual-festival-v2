"use client";

import type { DepartmentRecord } from "@/lib/types";
import { addRecord, deleteRecord, updateRecordStatus } from "@/app/actions/records";
import { ActionForm } from "@/components/ui/ActionForm";
import { InlineToggle } from "@/components/ui/InlineToggle";
import { Input, Select, Textarea } from "@/components/ui/fields";
import { Button, type ButtonVariant } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { formatMYR, formatDate } from "@/lib/utils";

export interface RecordListConfig {
  kind: string;
  heading: string;
  titleLabel: string;
  titlePlaceholder?: string;
  subtitleLabel?: string;
  subtitlePlaceholder?: string;
  showAmount?: boolean;
  amountLabel?: string;
  statusOptions?: { value: string; label: string }[];
  showDueDate?: boolean;
  showNotes?: boolean;
  addLabel: string;
  addVariant: ButtonVariant;
  emptyIcon?: string;
  emptyMessage: string;
}

export function GenericRecordList({
  departmentId,
  path,
  records,
  config,
}: {
  departmentId: string;
  path: string;
  records: DepartmentRecord[];
  config: RecordListConfig;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">{config.heading}</h3>
        <InlineToggle label={config.addLabel} variant={config.addVariant}>
          {(close) => (
            <ActionForm
              action={addRecord}
              onDone={close}
              className="flex flex-col gap-2 rounded-md border border-gray-200 p-3"
            >
              <input type="hidden" name="department_id" value={departmentId} />
              <input type="hidden" name="kind" value={config.kind} />
              <input type="hidden" name="path" value={path} />
              <Input name="title" placeholder={config.titlePlaceholder ?? config.titleLabel} autoFocus required />
              {config.subtitleLabel && (
                <Input name="subtitle" placeholder={config.subtitlePlaceholder ?? config.subtitleLabel} />
              )}
              <div className="flex gap-2">
                {config.showAmount && (
                  <Input name="amount" type="number" step="0.01" placeholder={config.amountLabel ?? "Amount"} />
                )}
                {config.statusOptions && (
                  <Select name="status" defaultValue={config.statusOptions[0]?.value}>
                    {config.statusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                )}
                {config.showDueDate && <Input name="due_date" type="date" />}
              </div>
              {config.showNotes && <Textarea name="notes" placeholder="Notes (optional)" />}
              <div className="flex gap-2">
                <Button type="submit" variant={config.addVariant} className="!px-3 !py-1.5 text-xs">
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

      {records.length === 0 ? (
        <EmptyState icon={config.emptyIcon} message={config.emptyMessage} />
      ) : (
        <ul className="divide-y divide-gray-100">
          {records.map((record) => (
            <li key={record.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <div>
                <div className="font-medium text-gray-800">{record.title}</div>
                <div className="text-xs text-gray-400">
                  {[record.subtitle, record.due_date ? formatDate(record.due_date) : null]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </div>
                {record.notes && <div className="text-xs text-gray-400">{record.notes}</div>}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {record.amount !== null && (
                  <span className="font-semibold text-gray-700">{formatMYR(record.amount)}</span>
                )}
                {config.statusOptions && record.status && (
                  <ActionForm action={updateRecordStatus}>
                    <input type="hidden" name="id" value={record.id} />
                    <input type="hidden" name="path" value={path} />
                    <Select
                      name="status"
                      defaultValue={record.status}
                      className="!py-1 text-xs"
                      onChange={(e) => e.currentTarget.form?.requestSubmit()}
                    >
                      {config.statusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </Select>
                  </ActionForm>
                )}
                {!config.statusOptions && record.status && <Badge>{record.status}</Badge>}
                <ActionForm action={deleteRecord}>
                  <input type="hidden" name="id" value={record.id} />
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
