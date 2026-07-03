import type { Announcement } from "@/lib/types";
import { addAnnouncement } from "@/app/actions/departments";
import { ActionForm } from "@/components/ui/ActionForm";
import { InlineToggle } from "@/components/ui/InlineToggle";
import { Input, Textarea } from "@/components/ui/fields";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export function AnnouncementsPanel({
  editionId,
  announcements,
  path,
}: {
  editionId: string;
  announcements: Announcement[];
  path: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">📣 Announcements</h3>
        <InlineToggle label="+ New Announcement" variant="primary">
          {(close) => (
            <ActionForm action={addAnnouncement} onDone={close} className="flex flex-col gap-2 rounded-md border border-gray-200 p-3">
              <input type="hidden" name="edition_id" value={editionId} />
              <input type="hidden" name="path" value={path} />
              <Input name="title" placeholder="Announcement title" autoFocus required />
              <Textarea name="body" placeholder="Details (optional)" />
              <div className="flex gap-2">
                <Button type="submit" className="!px-3 !py-1.5 text-xs">
                  Post
                </Button>
                <button type="button" onClick={close} className="text-xs text-gray-400">
                  Cancel
                </button>
              </div>
            </ActionForm>
          )}
        </InlineToggle>
      </div>

      {announcements.length === 0 ? (
        <EmptyState message="No announcements yet" />
      ) : (
        <ul className="space-y-3">
          {announcements.map((a) => (
            <li key={a.id} className="border-b border-gray-100 pb-2 last:border-0">
              <div className="text-sm font-medium text-gray-800">{a.title}</div>
              {a.body && <p className="text-sm text-gray-500">{a.body}</p>}
              <div className="mt-1 text-xs text-gray-400">
                {new Date(a.created_at).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
