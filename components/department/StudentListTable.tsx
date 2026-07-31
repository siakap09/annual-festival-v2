"use client";

import { Fragment, useState } from "react";
import { completeParticipantDetails, confirmParticipant } from "@/app/actions/registration";
import { ActionForm } from "@/components/ui/ActionForm";
import { Input } from "@/components/ui/fields";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { Participant } from "@/lib/types";

type StatusFilter = "all" | "confirmed" | "pending" | "waitlisted" | "incomplete";

const STATUS_OPTIONS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "confirmed", label: "Confirmed" },
  { key: "pending", label: "Pending" },
  { key: "waitlisted", label: "Waitlisted" },
  { key: "incomplete", label: "Incomplete" },
];

function isIncomplete(p: Participant): boolean {
  return !p.parent_name || !p.parent_email || !p.parent_phone;
}

export function StudentListTable({ participants, path = "/registration" }: { participants: Participant[]; path?: string }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [completingId, setCompletingId] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const filtered = participants.filter((p) => {
    const matchesQuery =
      !q ||
      p.student_name.toLowerCase().includes(q) ||
      (p.parent_name ?? "").toLowerCase().includes(q) ||
      (p.parent_email ?? "").toLowerCase().includes(q);
    const matchesStatus =
      status === "all" ||
      (status === "confirmed" && p.confirmed) ||
      (status === "pending" && !p.confirmed) ||
      (status === "waitlisted" && p.waitlisted) ||
      (status === "incomplete" && isIncomplete(p));
    return matchesQuery && matchesStatus;
  });

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search student, parent, or email..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex gap-1">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setStatus(opt.key)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium",
                status === opt.key ? "bg-orange-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-400">
          {filtered.length} of {participants.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">No students match your search.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-gray-400">
              <th className="pb-2">Student</th>
              <th className="pb-2">Parent</th>
              <th className="pb-2">Contact</th>
              <th className="pb-2">Status</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((p) => {
              const incomplete = isIncomplete(p);
              return (
                <Fragment key={p.id}>
                  <tr>
                    <td className="py-2 font-medium text-gray-800">{p.student_name}</td>
                    <td className="py-2 text-gray-600">{p.parent_name ?? "—"}</td>
                    <td className="py-2 text-gray-600">
                      {p.parent_email ?? "—"}
                      <div className="text-xs text-gray-400">{p.parent_phone ?? ""}</div>
                    </td>
                    <td className="py-2">
                      <div className="flex flex-wrap gap-1">
                        <Badge tone={p.confirmed ? "confirmed" : "pending"}>
                          {p.confirmed ? "Confirmed" : "Pending"}
                        </Badge>
                        {p.waitlisted && <Badge tone="pending">Waitlisted</Badge>}
                        {incomplete && <Badge tone="pending">Incomplete</Badge>}
                      </div>
                    </td>
                    <td className="py-2 text-right">
                      {incomplete ? (
                        <button
                          type="button"
                          onClick={() => setCompletingId(completingId === p.id ? null : p.id)}
                          className="text-xs text-indigo-600 hover:underline"
                        >
                          {completingId === p.id ? "Cancel" : "Complete details"}
                        </button>
                      ) : (
                        !p.confirmed && (
                          <ActionForm action={confirmParticipant} className="inline">
                            <input type="hidden" name="id" value={p.id} />
                            <input type="hidden" name="path" value={path} />
                            <Button type="submit" variant="green" className="!px-2 !py-1 text-xs">
                              Confirm
                            </Button>
                          </ActionForm>
                        )
                      )}
                    </td>
                  </tr>
                  {completingId === p.id && (
                    <tr>
                      <td colSpan={5} className="bg-gray-50 py-3">
                        <ActionForm
                          action={completeParticipantDetails}
                          onDone={() => setCompletingId(null)}
                          className="flex flex-wrap items-end gap-2 px-1"
                        >
                          <input type="hidden" name="id" value={p.id} />
                          <input type="hidden" name="path" value={path} />
                          <Input name="parent_name" placeholder="Parent / guardian name" required className="max-w-[10rem]" />
                          <Input name="parent_email" type="email" placeholder="parent@example.com" required className="max-w-[12rem]" />
                          <Input name="parent_phone" placeholder="012-3456789" required className="max-w-[9rem]" />
                          <Button type="submit" className="!px-3 !py-1.5 text-xs">
                            Save
                          </Button>
                        </ActionForm>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
