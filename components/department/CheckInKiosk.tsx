"use client";

import { useMemo, useState, useTransition } from "react";
import { checkInParticipant } from "@/app/actions/registration";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Input } from "@/components/ui/fields";
import { ShareCheckinLink } from "@/components/department/ShareCheckinLink";
import { cn, percent } from "@/lib/utils";
import type { Participant } from "@/lib/types";

const CHECKPOINTS = [1, 2, 3, 4, 5];

export function CheckInKiosk({
  participants,
  reachedByParticipant,
  path,
  checkinUrl,
  qrDataUrl,
  allowedCheckpoints,
}: {
  participants: Participant[];
  reachedByParticipant: Record<string, number[]>;
  path: string;
  checkinUrl: string;
  qrDataUrl: string;
  /** Restrict the checkpoint selector to specific booths (e.g. a booth-scoped
   * staff member). null/undefined = all 5, unrestricted. */
  allowedCheckpoints?: number[] | null;
}) {
  const selectableCheckpoints = allowedCheckpoints ?? CHECKPOINTS;
  const [checkpoint, setCheckpoint] = useState(selectableCheckpoints[0] ?? 1);
  const [mode, setMode] = useState<"scan" | "search">("search");
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  const cpCounts = useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const reached of Object.values(reachedByParticipant)) {
      for (const cp of reached) counts[cp] = (counts[cp] ?? 0) + 1;
    }
    return counts;
  }, [reachedByParticipant]);

  const filtered = query.trim()
    ? participants.filter((p) => p.student_name.toLowerCase().includes(query.trim().toLowerCase()))
    : participants;

  function nextAllowedCheckpoint(participantId: string) {
    const reached = new Set(reachedByParticipant[participantId] ?? []);
    for (const cp of CHECKPOINTS) {
      if (!reached.has(cp)) return cp;
    }
    return null;
  }

  function handleCheckIn(participant: Participant) {
    const allowed = nextAllowedCheckpoint(participant.id);
    if (allowed !== checkpoint) {
      setFeedback(
        allowed === null
          ? `${participant.student_name} has completed all checkpoints.`
          : `${participant.student_name} must check in to CP${allowed} next (order rule).`
      );
      return;
    }
    const formData = new FormData();
    formData.set("participant_id", participant.id);
    formData.set("checkpoint", String(checkpoint));
    formData.set("path", path);
    startTransition(async () => {
      await checkInParticipant(formData);
      setFeedback(`✅ ${participant.student_name} checked in at CP${checkpoint}`);
    });
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="rounded-lg bg-indigo-600 p-4 text-white shadow-sm lg:col-span-1">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-indigo-100">
          Student Check-in
        </div>
        <div className="mb-4 grid grid-cols-5 gap-1 text-center">
          {CHECKPOINTS.map((cp) => (
            <div key={cp} className="rounded bg-indigo-500/60 py-1.5">
              <div className="text-[10px] text-indigo-100">CP{cp}</div>
              <div className="text-sm font-bold">{cpCounts[cp] ?? 0}</div>
            </div>
          ))}
        </div>

        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-100">
          Select Checkpoint
        </div>
        <div className="mb-4 grid grid-cols-5 gap-1">
          {CHECKPOINTS.map((cp) => {
            const selectable = selectableCheckpoints.includes(cp);
            return (
              <button
                key={cp}
                type="button"
                disabled={!selectable}
                onClick={() => setCheckpoint(cp)}
                className={cn(
                  "rounded py-1.5 text-sm font-semibold",
                  !selectable
                    ? "cursor-not-allowed bg-indigo-500/20 text-indigo-200/50"
                    : cp === checkpoint
                      ? "bg-white text-indigo-700"
                      : "bg-indigo-500/60 text-white hover:bg-indigo-500"
                )}
              >
                {cp}
              </button>
            );
          })}
        </div>

        <div className="mb-3 flex gap-2">
          <button
            type="button"
            onClick={() => setMode("scan")}
            className={cn(
              "flex-1 rounded-md py-1.5 text-xs font-semibold",
              mode === "scan" ? "bg-white text-indigo-700" : "bg-indigo-500/60 text-white"
            )}
          >
            📷 Scan QR
          </button>
          <button
            type="button"
            onClick={() => setMode("search")}
            className={cn(
              "flex-1 rounded-md py-1.5 text-xs font-semibold",
              mode === "search" ? "bg-white text-indigo-700" : "bg-indigo-500/60 text-white"
            )}
          >
            🔍 Search Name
          </button>
        </div>

        {mode === "search" ? (
          <div className="rounded-md bg-white p-2 text-gray-900">
            <Input
              placeholder="Search student name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="mb-2"
            />
            <div className="max-h-56 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="py-4 text-center text-xs text-gray-400">No students found</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {filtered.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => handleCheckIn(p)}
                        className="flex w-full items-center justify-between py-1.5 text-left text-sm hover:bg-gray-50 disabled:opacity-50"
                      >
                        <span>{p.student_name}</span>
                        <span className="text-xs text-gray-400">
                          {(reachedByParticipant[p.id] ?? []).length}/5
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : (
          <div className="flex aspect-video flex-col items-center justify-center gap-1 rounded-md bg-black/40 text-center text-xs text-indigo-100">
            <span className="text-2xl">📷</span>
            Point at parent&apos;s QR code
          </div>
        )}

        {feedback && <p className="mt-3 rounded bg-indigo-500/60 p-2 text-xs">{feedback}</p>}
      </div>

      <div className="space-y-4 lg:col-span-2">
        <ShareCheckinLink url={checkinUrl} qrDataUrl={qrDataUrl} />

        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Order rule: Students must go 1 → 2 → 3 → 4 → 5. Skipping is blocked.
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-800">Live Checkpoint Progress</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
            {CHECKPOINTS.map((cp) => (
              <div key={cp} className="rounded-md border border-gray-100 p-3 text-center">
                <div className="text-xs text-gray-400">CP {cp}</div>
                <div className="text-xl font-bold text-indigo-600">{cpCounts[cp] ?? 0}</div>
                <div className="mt-2">
                  <ProgressBar value={percent(cpCounts[cp] ?? 0, participants.length)} colorClass="bg-indigo-500" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Student Progress</h3>
            <span className="text-xs text-gray-400">{participants.length} students</span>
          </div>
          {participants.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">No students registered yet</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {participants.map((p) => {
                const reached = (reachedByParticipant[p.id] ?? []).length;
                return (
                  <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-gray-800">{p.student_name}</span>
                    <div className="flex w-32 items-center gap-2">
                      <ProgressBar value={percent(reached, 5)} />
                      <span className="w-8 text-right text-xs text-gray-400">{reached}/5</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
