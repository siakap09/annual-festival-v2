"use client";

import type { VvipGuest } from "@/lib/types";
import { addVvipGuest } from "@/app/actions/sponsorship";
import { ActionForm } from "@/components/ui/ActionForm";
import { InlineToggle } from "@/components/ui/InlineToggle";
import { Input } from "@/components/ui/fields";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export function VvipGuestList({
  departmentId,
  editionId,
  guests,
  path,
}: {
  departmentId: string;
  editionId: string;
  guests: VvipGuest[];
  path: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">⭐ VVIP Guest List</h3>
        <InlineToggle label="+ Add Guest" variant="amber">
          {(close) => (
            <ActionForm action={addVvipGuest} onDone={close} className="flex items-center gap-2">
              <input type="hidden" name="department_id" value={departmentId} />
              <input type="hidden" name="edition_id" value={editionId} />
              <input type="hidden" name="path" value={path} />
              <Input name="name" placeholder="Guest name" autoFocus required className="w-40" />
              <Input name="title" placeholder="Title" className="w-32" />
              <Input name="organization" placeholder="Organization" className="w-40" />
              <Button type="submit" variant="amber" className="!px-3 !py-1.5 text-xs">
                Add
              </Button>
              <button type="button" onClick={close} className="text-xs text-gray-400">
                Cancel
              </button>
            </ActionForm>
          )}
        </InlineToggle>
      </div>
      {guests.length === 0 ? (
        <EmptyState message="No VVIP guests yet" />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-gray-400">
              <th className="pb-2">Name</th>
              <th className="pb-2">Title</th>
              <th className="pb-2">Organization</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {guests.map((g) => (
              <tr key={g.id}>
                <td className="py-2 font-medium text-gray-800">{g.name}</td>
                <td className="py-2 text-gray-600">{g.title ?? "—"}</td>
                <td className="py-2 text-gray-600">{g.organization ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
