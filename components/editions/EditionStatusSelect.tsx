"use client";

import { updateEditionStatus } from "@/app/actions/editions";
import { ActionForm } from "@/components/ui/ActionForm";

export function EditionStatusSelect({
  editionId,
  status,
}: {
  editionId: string;
  status: string;
}) {
  return (
    <ActionForm action={updateEditionStatus}>
      <input type="hidden" name="edition_id" value={editionId} />
      <select
        name="status"
        defaultValue={status}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium uppercase"
      >
        <option value="draft">Draft</option>
        <option value="active">Active</option>
        <option value="archived">Archived</option>
      </select>
    </ActionForm>
  );
}
