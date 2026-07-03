"use client";

import { createEdition } from "@/app/actions/editions";
import { InlineToggle } from "@/components/ui/InlineToggle";
import { ActionForm } from "@/components/ui/ActionForm";
import { Input } from "@/components/ui/fields";
import { Button } from "@/components/ui/Button";

export function NewEditionButton() {
  return (
    <InlineToggle label="+ New Edition" variant="primary">
      {(close) => (
        <div className="w-96 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
          <ActionForm action={createEdition} onDone={close} className="flex flex-col gap-3">
            <Input name="name" placeholder="Edition name" autoFocus required />
            <Input name="theme" placeholder="Theme" />
            <div className="flex gap-2">
              <Input name="start_date" type="date" />
              <Input name="end_date" type="date" />
            </div>
            <Input name="target_participants" type="number" min="1" placeholder="Target participants" defaultValue={500} />
            <div className="flex gap-2">
              <Button type="submit" className="!px-3 !py-1.5 text-xs">
                Create
              </Button>
              <button type="button" onClick={close} className="text-xs text-gray-400">
                Cancel
              </button>
            </div>
          </ActionForm>
        </div>
      )}
    </InlineToggle>
  );
}
