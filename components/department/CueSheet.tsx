"use client";

import type { CueBlock } from "@/lib/types";
import { addCueBlock, deleteCueBlock } from "@/app/actions/showcase";
import { ActionForm } from "@/components/ui/ActionForm";
import { InlineToggle } from "@/components/ui/InlineToggle";
import { Input } from "@/components/ui/fields";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pills } from "@/components/ui/Tabs";

export function CueSheet({
  departmentId,
  blocks,
  day,
  path,
}: {
  departmentId: string;
  blocks: CueBlock[];
  day: number;
  path: string;
}) {
  const dayBlocks = blocks.filter((b) => b.day === day);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Pills
          basePath={path}
          param="day"
          activeKey={String(day)}
          extraParams={{ tab: "cue_sheet" }}
          items={[
            { key: "1", label: "Day 1" },
            { key: "2", label: "Day 2" },
            { key: "3", label: "Day 3" },
          ]}
        />
        <div className="flex gap-2">
          <Button type="button" variant="red" className="!px-3 !py-1.5 text-xs">
            🔴 Go Live
          </Button>
          <InlineToggle label="+ Add Block" variant="purple" className="!px-3 !py-1.5 text-xs">
            {(close) => (
              <div className="w-80 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
                <ActionForm action={addCueBlock} onDone={close} className="flex flex-col gap-2">
                  <input type="hidden" name="department_id" value={departmentId} />
                  <input type="hidden" name="day" value={day} />
                  <input type="hidden" name="path" value={path} />
                  <Input name="title" placeholder="Block title" autoFocus required />
                  <Input name="performer" placeholder="Performer / participant" />
                  <div className="flex gap-2">
                    <Input name="start_time" type="time" />
                    <Input name="end_time" type="time" />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" variant="purple" className="!px-3 !py-1.5 text-xs">
                      Save
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
      </div>

      {dayBlocks.length === 0 ? (
        <EmptyState icon="📋" message={`No blocks for Day ${day} yet`} />
      ) : (
        <ul className="divide-y divide-gray-100">
          {dayBlocks.map((block) => (
            <li key={block.id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <div className="font-medium text-gray-800">{block.title}</div>
                <div className="text-xs text-gray-400">
                  {[block.start_time && block.end_time ? `${block.start_time} – ${block.end_time}` : null, block.performer]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </div>
              </div>
              <ActionForm action={deleteCueBlock}>
                <input type="hidden" name="id" value={block.id} />
                <input type="hidden" name="path" value={path} />
                <button type="submit" className="text-xs text-gray-400 hover:text-red-500">
                  ✕
                </button>
              </ActionForm>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
