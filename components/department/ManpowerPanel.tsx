"use client";

import type { Manpower } from "@/lib/types";
import { addManpower, removeManpower } from "@/app/actions/departments";
import { ActionForm } from "@/components/ui/ActionForm";
import { InlineToggle } from "@/components/ui/InlineToggle";
import { Input } from "@/components/ui/fields";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

function ManpowerColumn({
  departmentId,
  type,
  label,
  description,
  variant,
  people,
  path,
}: {
  departmentId: string;
  type: "internal" | "external";
  label: string;
  description: string;
  variant: "blue" | "purple";
  people: Manpower[];
  path: string;
}) {
  return (
    <div className="flex-1 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <span
            className={`rounded px-2 py-0.5 text-xs font-semibold ${
              variant === "blue" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
            }`}
          >
            {label}
          </span>
          <span className="ml-2 text-sm text-gray-500">{people.length} people</span>
          <div className="text-xs text-gray-400">{description}</div>
        </div>
        <InlineToggle label="+ Add" variant={variant}>
          {(close) => (
            <ActionForm action={addManpower} onDone={close} className="rounded-md border border-gray-200 p-3">
              <input type="hidden" name="department_id" value={departmentId} />
              <input type="hidden" name="type" value={type} />
              <input type="hidden" name="path" value={path} />
              <div className="flex flex-col gap-2">
                <Input name="name" placeholder="Name" autoFocus required />
                <Input name="role" placeholder="Role" />
                <Input name="contact" placeholder="Contact (email/phone)" />
                <div className="flex gap-2">
                  <Button type="submit" variant={variant} className="!px-3 !py-1.5 text-xs">
                    Save
                  </Button>
                  <button type="button" onClick={close} className="text-xs text-gray-400">
                    Cancel
                  </button>
                </div>
              </div>
            </ActionForm>
          )}
        </InlineToggle>
      </div>

      {people.length === 0 ? (
        <EmptyState message={`No ${type} manpower yet`} />
      ) : (
        <ul className="divide-y divide-gray-100">
          {people.map((p) => (
            <li key={p.id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <div className="font-medium text-gray-800">{p.name}</div>
                <div className="text-xs text-gray-400">
                  {[p.role, p.contact].filter(Boolean).join(" · ") || "—"}
                </div>
              </div>
              <ActionForm action={removeManpower}>
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="path" value={path} />
                <button type="submit" className="text-xs text-gray-400 hover:text-red-500">
                  Remove
                </button>
              </ActionForm>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ManpowerPanel({
  departmentId,
  manpower,
  path,
}: {
  departmentId: string;
  manpower: Manpower[];
  path: string;
}) {
  const internal = manpower.filter((m) => m.type === "internal");
  const external = manpower.filter((m) => m.type === "external");

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        Total Manpower: <span className="font-semibold text-blue-600">{internal.length} internal</span> +{" "}
        <span className="font-semibold text-purple-600">{external.length} external</span> ={" "}
        <span className="font-semibold">{manpower.length} people</span>
      </p>
      <div className="flex flex-col gap-4 lg:flex-row">
        <ManpowerColumn
          departmentId={departmentId}
          type="internal"
          label="Internal"
          description="Ebright staff & OC members"
          variant="blue"
          people={internal}
          path={path}
        />
        <ManpowerColumn
          departmentId={departmentId}
          type="external"
          label="External"
          description="Vendors, contractors, freelancers"
          variant="purple"
          people={external}
          path={path}
        />
      </div>
    </div>
  );
}
