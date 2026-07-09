"use client";

import { updateMemberRole, removeMember } from "@/app/actions/roleManagement";
import { ActionForm } from "@/components/ui/ActionForm";
import { Select } from "@/components/ui/fields";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import type { OrganizationMemberWithEmail, OrgRole } from "@/lib/types";

const ROLE_LABELS: Record<OrgRole, string> = {
  owner: "Superadmin",
  admin: "Admin",
  member: "Member",
};

export function RoleManagementTable({
  organizationId,
  members,
  viewerRole,
  path,
}: {
  organizationId: string;
  members: OrganizationMemberWithEmail[];
  viewerRole: OrgRole | null;
  path: string;
}) {
  const isOwner = viewerRole === "owner";

  if (members.length === 0) {
    return <EmptyState message="No members found" />;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400">
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Role</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {members.map((m) => {
            // Admins can't touch a row that's currently an owner -- RLS
            // enforces this too, this just keeps the UI from offering a
            // control that would silently no-op.
            const locked = m.role === "owner" && !isOwner;
            return (
              <tr key={m.id}>
                <td className="px-4 py-3 text-gray-800">{m.email}</td>
                <td className="px-4 py-3">
                  {locked ? (
                    <Badge tone={m.role}>{ROLE_LABELS[m.role]}</Badge>
                  ) : (
                    <ActionForm action={updateMemberRole}>
                      <input type="hidden" name="member_id" value={m.id} />
                      <input type="hidden" name="organization_id" value={organizationId} />
                      <input type="hidden" name="path" value={path} />
                      <Select
                        name="role"
                        defaultValue={m.role}
                        className="!py-1 text-xs"
                        onChange={(e) => e.currentTarget.form?.requestSubmit()}
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                        {isOwner && <option value="owner">Superadmin</option>}
                      </Select>
                    </ActionForm>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {!locked && (
                    <ActionForm action={removeMember}>
                      <input type="hidden" name="member_id" value={m.id} />
                      <input type="hidden" name="organization_id" value={organizationId} />
                      <input type="hidden" name="path" value={path} />
                      <button type="submit" className="text-xs text-gray-400 hover:text-red-500">
                        Remove
                      </button>
                    </ActionForm>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
