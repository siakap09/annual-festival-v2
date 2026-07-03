import { getWorkspace } from "@/lib/data/workspace";
import { getEditionsWithStats } from "@/lib/data/editions";
import { PageHeader } from "@/components/shell/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { InlineToggle } from "@/components/ui/InlineToggle";
import { ActionForm } from "@/components/ui/ActionForm";
import { Input } from "@/components/ui/fields";
import { Button } from "@/components/ui/Button";
import { formatDateRange } from "@/lib/utils";
import {
  archiveEdition,
  copyEdition,
  createEdition,
  setCurrentEditionAndGo,
  updateEditionStatus,
} from "@/app/actions/editions";

export const dynamic = "force-dynamic";

export default async function EditionsPage() {
  const workspace = await getWorkspace();
  const stats = await getEditionsWithStats(workspace.editions);

  return (
    <div>
      <PageHeader
        icon="🗓️"
        title="Edition Management"
        subtitle="Create and manage Annual Showcase editions across years"
        action={
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
        }
      />

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400">
              <th className="px-4 py-3">Edition</th>
              <th className="px-4 py-3">Theme</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Event Dates</th>
              <th className="px-4 py-3">Participants</th>
              <th className="px-4 py-3">Tasks</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {stats.map(({ edition, participantCount, tasksDone, tasksTotal }) => (
              <tr key={edition.id}>
                <td className="px-4 py-3">
                  <span className="font-medium text-gray-900">{edition.name}, </span>
                  <Badge tone={edition.status === "archived" ? "archived" : "active"}>
                    {edition.status === "archived" ? "Archived" : "Active"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-gray-600">{edition.theme ?? "—"}</td>
                <td className="px-4 py-3">
                  <ActionForm action={updateEditionStatus}>
                    <input type="hidden" name="edition_id" value={edition.id} />
                    <select
                      name="status"
                      defaultValue={edition.status}
                      onChange={(e) => e.currentTarget.form?.requestSubmit()}
                      className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium uppercase"
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="archived">Archived</option>
                    </select>
                  </ActionForm>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {formatDateRange(edition.start_date, edition.end_date)}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {participantCount} / {edition.target_participants}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {tasksDone}/{tasksTotal}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <form action={setCurrentEditionAndGo}>
                      <input type="hidden" name="edition_id" value={edition.id} />
                      <input type="hidden" name="destination" value="/oc" />
                      <button type="submit" className="text-blue-600 hover:underline">
                        View
                      </button>
                    </form>
                    <form action={copyEdition}>
                      <input type="hidden" name="edition_id" value={edition.id} />
                      <button type="submit" className="text-purple-600 hover:underline">
                        Copy
                      </button>
                    </form>
                    <form action={archiveEdition}>
                      <input type="hidden" name="edition_id" value={edition.id} />
                      <button type="submit" className="text-red-500 hover:underline">
                        Archive
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
