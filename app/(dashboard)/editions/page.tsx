import { getWorkspace } from "@/lib/data/workspace";
import { getEditionsWithStats } from "@/lib/data/editions";
import { PageHeader } from "@/components/shell/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { NewEditionButton } from "@/components/editions/NewEditionButton";
import { EditionStatusSelect } from "@/components/editions/EditionStatusSelect";
import { ActionForm } from "@/components/ui/ActionForm";
import { formatDateRange } from "@/lib/utils";
import { archiveEdition, copyEdition, setCurrentEditionAndGo } from "@/app/actions/editions";

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
        action={<NewEditionButton />}
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
                  <EditionStatusSelect editionId={edition.id} status={edition.status} />
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
                    <ActionForm action={copyEdition}>
                      <input type="hidden" name="edition_id" value={edition.id} />
                      <button type="submit" className="text-purple-600 hover:underline">
                        Copy
                      </button>
                    </ActionForm>
                    <ActionForm action={archiveEdition}>
                      <input type="hidden" name="edition_id" value={edition.id} />
                      <button type="submit" className="text-red-500 hover:underline">
                        Archive
                      </button>
                    </ActionForm>
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
