import type { SponsorPackage } from "@/lib/types";
import { addSponsorPackage } from "@/app/actions/sponsorship";
import { ActionForm } from "@/components/ui/ActionForm";
import { InlineToggle } from "@/components/ui/InlineToggle";
import { Input, Textarea } from "@/components/ui/fields";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatMYR } from "@/lib/utils";

export function SponsorPackagesList({
  departmentId,
  editionId,
  packages,
  path,
}: {
  departmentId: string;
  editionId: string;
  packages: SponsorPackage[];
  path: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">🎁 Sponsor Packages</h3>
        <InlineToggle label="+ Add Package" variant="amber">
          {(close) => (
            <ActionForm action={addSponsorPackage} onDone={close} className="flex flex-col gap-2 rounded-md border border-gray-200 p-3">
              <input type="hidden" name="department_id" value={departmentId} />
              <input type="hidden" name="edition_id" value={editionId} />
              <input type="hidden" name="path" value={path} />
              <Input name="name" placeholder="Package name (e.g. Gold)" autoFocus required />
              <Input name="price" type="number" step="0.01" placeholder="Price (MYR)" />
              <Input name="max_slots" type="number" min="0" placeholder="Max slots" />
              <Textarea name="benefits" placeholder="Benefits" />
              <div className="flex gap-2">
                <Button type="submit" variant="amber" className="!px-3 !py-1.5 text-xs">
                  Save
                </Button>
                <button type="button" onClick={close} className="text-xs text-gray-400">
                  Cancel
                </button>
              </div>
            </ActionForm>
          )}
        </InlineToggle>
      </div>
      {packages.length === 0 ? (
        <EmptyState message="No sponsor packages yet" />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((p) => (
            <div key={p.id} className="rounded-md border border-gray-200 p-3">
              <div className="font-semibold text-gray-800">{p.name}</div>
              <div className="text-lg font-bold text-amber-600">{formatMYR(p.price)}</div>
              {p.max_slots !== null && <div className="text-xs text-gray-400">{p.max_slots} slots</div>}
              {p.benefits && <p className="mt-1 text-xs text-gray-500">{p.benefits}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
