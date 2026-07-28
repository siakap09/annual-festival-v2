"use client";

import { useState } from "react";
import { addSectionAccess, removeSectionAccess, updateSectionAccess } from "@/app/actions/sectionAccess";
import { InlineToggle } from "@/components/ui/InlineToggle";
import { ActionForm } from "@/components/ui/ActionForm";
import { Input, Select } from "@/components/ui/fields";
import { Button } from "@/components/ui/Button";
import type { Department, SectionAccess } from "@/lib/types";

const BOOTHS = [1, 2, 3, 4, 5];

export function SectionAccessButton({
  departments,
  access,
  path,
}: {
  departments: Department[];
  access: SectionAccess[];
  path: string;
}) {
  const [departmentId, setDepartmentId] = useState(departments[0]?.id ?? "");
  const selectedDept = departments.find((d) => d.id === departmentId);
  const isRegistrationArea = selectedDept?.key === "registration_area";

  return (
    <InlineToggle label="🔐 Access" variant="outline">
      {(close) => (
        <div className="w-[26rem] rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Section Access</h3>
            <button type="button" onClick={close} className="text-xs text-gray-400 hover:text-gray-600">
              Close
            </button>
          </div>

          <ActionForm action={addSectionAccess} className="mb-4 flex flex-col gap-2">
            <input type="hidden" name="path" value={path} />
            <Input name="email" type="email" placeholder="email@example.com" required />
            <div className="flex gap-2">
              <Select
                name="department_id"
                required
                className="flex-1"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
              <Select name="access_level" defaultValue="viewer">
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
              </Select>
            </div>
            {isRegistrationArea && (
              <Select name="checkpoint" defaultValue="">
                <option value="">All booths</option>
                {BOOTHS.map((b) => (
                  <option key={b} value={b}>
                    Booth {b}
                  </option>
                ))}
              </Select>
            )}
            <Button type="submit" className="!px-3 !py-1.5 text-xs">
              Invite
            </Button>
          </ActionForm>

          {access.length === 0 ? (
            <p className="text-center text-xs text-gray-400">No section access grants yet.</p>
          ) : (
            <ul className="max-h-64 divide-y divide-gray-100 overflow-y-auto">
              {access.map((a) => {
                const dept = departments.find((d) => d.id === a.department_id);
                return (
                  <li key={a.id} className="py-2 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-gray-800">{a.email}</div>
                        <div className="mt-0.5 text-xs text-gray-400">
                          {dept?.name ?? "Unknown section"} · {a.user_id ? "active" : "invited"}
                        </div>
                      </div>
                      <ActionForm action={removeSectionAccess}>
                        <input type="hidden" name="id" value={a.id} />
                        <input type="hidden" name="path" value={path} />
                        <button type="submit" className="shrink-0 text-xs text-gray-400 hover:text-red-500">
                          Remove
                        </button>
                      </ActionForm>
                    </div>
                    <ActionForm action={updateSectionAccess} className="mt-1.5 flex items-center gap-1.5">
                      <input type="hidden" name="id" value={a.id} />
                      <input type="hidden" name="path" value={path} />
                      {dept?.key === "registration_area" && (
                        <select
                          name="checkpoint"
                          defaultValue={a.checkpoint ?? ""}
                          onChange={(e) => e.currentTarget.form?.requestSubmit()}
                          className="rounded-md border border-gray-300 bg-white px-1.5 py-0.5 text-xs text-gray-700 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        >
                          <option value="">All booths</option>
                          {BOOTHS.map((b) => (
                            <option key={b} value={b}>
                              Booth {b}
                            </option>
                          ))}
                        </select>
                      )}
                      <select
                        name="access_level"
                        defaultValue={a.access_level}
                        onChange={(e) => e.currentTarget.form?.requestSubmit()}
                        className="rounded-md border border-gray-300 bg-white px-1.5 py-0.5 text-xs text-gray-700 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                      >
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                      </select>
                    </ActionForm>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </InlineToggle>
  );
}
