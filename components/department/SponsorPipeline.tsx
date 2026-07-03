"use client";

import { SPONSOR_STAGES } from "@/lib/constants";
import type { Sponsor } from "@/lib/types";
import { addSponsor, deleteSponsor, updateSponsorStage } from "@/app/actions/sponsorship";
import { ActionForm } from "@/components/ui/ActionForm";
import { InlineToggle } from "@/components/ui/InlineToggle";
import { Input } from "@/components/ui/fields";
import { Button } from "@/components/ui/Button";
import { formatMYR } from "@/lib/utils";

export function SponsorPipeline({
  departmentId,
  editionId,
  sponsors,
  path,
}: {
  departmentId: string;
  editionId: string;
  sponsors: Sponsor[];
  path: string;
}) {
  return (
    <div>
      <div className="mb-3 flex justify-end">
        <InlineToggle label="+ Add Sponsor" variant="amber">
          {(close) => (
            <div className="w-96 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
              <ActionForm action={addSponsor} onDone={close} className="flex flex-col gap-2">
                <input type="hidden" name="department_id" value={departmentId} />
                <input type="hidden" name="edition_id" value={editionId} />
                <input type="hidden" name="path" value={path} />
                <Input name="name" placeholder="Sponsor / company name" autoFocus required />
                <Input name="contact_name" placeholder="Contact person" />
                <Input name="contact_email" type="email" placeholder="Contact email" />
                <Input name="amount" type="number" step="0.01" placeholder="Sponsorship amount (MYR)" />
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input type="checkbox" name="is_vvip" className="h-4 w-4 rounded border-gray-300" />
                  Flag as VVIP
                </label>
                <div className="flex gap-2">
                  <Button type="submit" variant="amber" className="!px-3 !py-1.5 text-xs">
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {SPONSOR_STAGES.map((stage) => {
          const stageSponsors = sponsors.filter((s) => s.stage === stage.key);
          return (
            <div key={stage.key} className="rounded-md bg-gray-50 p-2">
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{stage.label}</span>
                <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
                  {stageSponsors.length}
                </span>
              </div>
              <div className="flex min-h-[80px] flex-col gap-2">
                {stageSponsors.map((sponsor) => (
                  <div key={sponsor.id} className="rounded-md border border-gray-200 bg-white p-2 text-sm shadow-sm">
                    <div className="flex items-center gap-1 font-medium text-gray-800">
                      {sponsor.name}
                      {sponsor.is_vvip && <span title="VVIP">⭐</span>}
                    </div>
                    {sponsor.amount > 0 && (
                      <div className="text-xs text-gray-500">{formatMYR(sponsor.amount)}</div>
                    )}
                    <div className="mt-2 flex items-center justify-between gap-1">
                      <ActionForm action={updateSponsorStage}>
                        <input type="hidden" name="id" value={sponsor.id} />
                        <input type="hidden" name="path" value={path} />
                        <select
                          name="stage"
                          defaultValue={sponsor.stage}
                          onChange={(e) => e.currentTarget.form?.requestSubmit()}
                          className="rounded border border-gray-200 py-1 text-xs"
                        >
                          {SPONSOR_STAGES.map((s) => (
                            <option key={s.key} value={s.key}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </ActionForm>
                      <ActionForm action={deleteSponsor}>
                        <input type="hidden" name="id" value={sponsor.id} />
                        <input type="hidden" name="path" value={path} />
                        <button type="submit" className="text-xs text-gray-400 hover:text-red-500">
                          ✕
                        </button>
                      </ActionForm>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
