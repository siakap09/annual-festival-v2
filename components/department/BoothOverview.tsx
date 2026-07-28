import { ProgressBar } from "@/components/ui/ProgressBar";
import { percent } from "@/lib/utils";
import type { Participant } from "@/lib/types";

const CHECKPOINTS = [1, 2, 3, 4, 5];

export function BoothOverview({
  participants,
  reachedByParticipant,
}: {
  participants: Participant[];
  reachedByParticipant: Record<string, number[]>;
}) {
  const cpCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const reached of Object.values(reachedByParticipant)) {
    for (const cp of reached) cpCounts[cp] = (cpCounts[cp] ?? 0) + 1;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-gray-800">Live Checkpoint Progress</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
          {CHECKPOINTS.map((cp) => (
            <div key={cp} className="rounded-md border border-gray-100 p-3 text-center">
              <div className="text-xs text-gray-400">Booth {cp}</div>
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
  );
}
