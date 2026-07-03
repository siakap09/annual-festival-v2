"use client";

import { updateWaitlistSetting } from "@/app/actions/editions";
import { ActionForm } from "@/components/ui/ActionForm";

export function WaitlistToggle({
  editionId,
  enabled,
}: {
  editionId: string;
  enabled: boolean;
}) {
  return (
    <ActionForm action={updateWaitlistSetting}>
      <input type="hidden" name="edition_id" value={editionId} />
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          name="enable_waitlist"
          defaultChecked={enabled}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
          className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
        />
        Enable waitlist when target is reached
      </label>
    </ActionForm>
  );
}
