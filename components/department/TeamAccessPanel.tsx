"use client";

import type { TeamAccess } from "@/lib/types";
import { addTeamAccess, removeTeamAccess } from "@/app/actions/departments";
import { ActionForm } from "@/components/ui/ActionForm";
import { InlineToggle } from "@/components/ui/InlineToggle";
import { Input, Select } from "@/components/ui/fields";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";

export function TeamAccessPanel({
  departmentId,
  members,
  path,
}: {
  departmentId: string;
  members: TeamAccess[];
  path: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">👥 Team Access</h3>
        <InlineToggle label="+ Add Member" variant="primary">
          {(close) => (
            <ActionForm action={addTeamAccess} onDone={close} className="flex items-center gap-2">
              <input type="hidden" name="department_id" value={departmentId} />
              <input type="hidden" name="path" value={path} />
              <Input name="email" type="email" placeholder="email@example.com" autoFocus required className="w-56" />
              <Select name="access_level" defaultValue="viewer">
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                <option value="lead">Lead</option>
              </Select>
              <Button type="submit" className="!px-3 !py-1.5 text-xs">
                Add
              </Button>
              <button type="button" onClick={close} className="text-xs text-gray-400">
                Cancel
              </button>
            </ActionForm>
          )}
        </InlineToggle>
      </div>

      {members.length === 0 ? (
        <EmptyState message="No team members added yet" />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-gray-400">
              <th className="pb-2">Email</th>
              <th className="pb-2">Access</th>
              <th className="pb-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {members.map((m) => (
              <tr key={m.id}>
                <td className="py-2 text-gray-800">{m.email}</td>
                <td className="py-2">
                  <Badge tone={m.access_level}>{m.access_level}</Badge>
                </td>
                <td className="py-2 text-right">
                  <ActionForm action={removeTeamAccess}>
                    <input type="hidden" name="id" value={m.id} />
                    <input type="hidden" name="path" value={path} />
                    <button type="submit" className="text-xs text-gray-400 hover:text-red-500">
                      Remove
                    </button>
                  </ActionForm>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
