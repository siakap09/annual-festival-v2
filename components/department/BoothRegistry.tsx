"use client";

import type { DepartmentRecord } from "@/lib/types";
import { addRecord, deleteRecord, updateRecordStatus } from "@/app/actions/records";
import { ActionForm } from "@/components/ui/ActionForm";
import { InlineToggle } from "@/components/ui/InlineToggle";
import { Input, Select } from "@/components/ui/fields";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export function BoothRegistry({
  departmentId,
  booths,
  query,
  path,
}: {
  departmentId: string;
  booths: DepartmentRecord[];
  query: string;
  path: string;
}) {
  const q = query.trim().toLowerCase();
  const filtered = q
    ? booths.filter(
        (b) => b.title.toLowerCase().includes(q) || (b.subtitle ?? "").toLowerCase().includes(q)
      )
    : booths;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <form action={path} className="flex-1">
          <input type="hidden" name="tab" value="booth_registry" />
          <Input name="q" defaultValue={query} placeholder="Search business or owner..." className="max-w-xs" />
        </form>
        <InlineToggle label="+ Register Booth" variant="teal">
          {(close) => (
            <div className="w-96 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
              <ActionForm action={addRecord} onDone={close} className="flex flex-col gap-2">
                <input type="hidden" name="department_id" value={departmentId} />
                <input type="hidden" name="kind" value="booth" />
                <input type="hidden" name="path" value={path} />
                <Input name="title" placeholder="Business name" autoFocus required />
                <Input name="subtitle" placeholder="Owner name" />
                <Select name="status" defaultValue="pending">
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                </Select>
                <div className="flex gap-2">
                  <Button type="submit" variant="teal" className="!px-3 !py-1.5 text-xs">
                    Register
                  </Button>
                  <button type="button" onClick={close} className="text-xs text-gray-400">
                    Cancel
                  </button>
                </div>
              </ActionForm>
            </div>
          )}
        </InlineToggle>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="🏬" message={q ? "No booths match your search" : "No booths registered yet"} />
      ) : (
        <ul className="divide-y divide-gray-100">
          {filtered.map((b) => (
            <li key={b.id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <div className="font-medium text-gray-800">{b.title}</div>
                <div className="text-xs text-gray-400">{b.subtitle ?? "—"}</div>
              </div>
              <div className="flex items-center gap-2">
                <ActionForm action={updateRecordStatus}>
                  <input type="hidden" name="id" value={b.id} />
                  <input type="hidden" name="path" value={path} />
                  <Select
                    name="status"
                    defaultValue={b.status ?? "pending"}
                    className="!py-1 text-xs"
                    onChange={(e) => e.currentTarget.form?.requestSubmit()}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                  </Select>
                </ActionForm>
                <ActionForm action={deleteRecord}>
                  <input type="hidden" name="id" value={b.id} />
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
