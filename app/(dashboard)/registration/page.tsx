import { getWorkspace, findDepartment } from "@/lib/data/workspace";
import { getParticipants } from "@/lib/data/registration";
import { BackToEditions, PageHeader } from "@/components/shell/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Tabs } from "@/components/ui/Tabs";
import { Field, Input } from "@/components/ui/fields";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ActionForm } from "@/components/ui/ActionForm";
import { formatDate, percent } from "@/lib/utils";
import { confirmParticipant, registerParticipant } from "@/app/actions/registration";

export const dynamic = "force-dynamic";

export default async function RegistrationPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "register" } = await searchParams;
  const workspace = await getWorkspace();
  const { currentEdition } = workspace;
  findDepartment(workspace.departments, "registration");
  const path = "/registration";

  const participants = await getParticipants(currentEdition.id);
  const registered = participants.filter((p) => !p.waitlisted);
  const confirmed = participants.filter((p) => p.confirmed);
  const emailPending = participants.filter((p) => !p.email_sent);
  const deadlinePassed = currentEdition.registration_deadline
    ? currentEdition.registration_deadline < new Date().toISOString().slice(0, 10)
    : false;

  return (
    <div>
      <BackToEditions />
      <PageHeader icon="📋" title="Registration" subtitle={currentEdition.name} />

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Registered"
          value={`${registered.length} / ${currentEdition.target_participants}`}
          caption={`${percent(registered.length, currentEdition.target_participants)}% of target`}
          icon="🎓"
          progress={percent(registered.length, currentEdition.target_participants)}
        />
        <StatCard label="Confirmed" value={confirmed.length} caption={`${participants.length - confirmed.length} pending confirmation`} icon="✅" />
        <StatCard label="Email Sent" value={participants.length - emailPending.length} caption={`${emailPending.length} not yet sent`} icon="✉️" />
        <StatCard
          label="Deadline Passed"
          value={deadlinePassed ? "Closed" : "Open"}
          caption={currentEdition.registration_deadline ? formatDate(currentEdition.registration_deadline) : "no deadline set"}
          icon="🗓️"
        />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <Tabs
          basePath={path}
          activeKey={tab}
          tabs={[
            { key: "register", label: "Register Student", icon: "➕" },
            { key: "list", label: "Student List", icon: "📄" },
            { key: "confirm", label: "Confirm Students", icon: "✅" },
          ]}
        />
        <div className="p-4">
          {tab === "register" && (
            <div className="max-w-md">
              <ActionForm action={registerParticipant} className="space-y-4">
                <input type="hidden" name="edition_id" value={currentEdition.id} />
                <input type="hidden" name="path" value={path} />
                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Student Info
                  </div>
                  <Field label="Student Name" required>
                    <Input name="student_name" placeholder="Full name" required />
                  </Field>
                </div>
                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Parent / Guardian
                  </div>
                  <div className="space-y-3">
                    <Field label="Parent Name" required>
                      <Input name="parent_name" placeholder="Parent / guardian name" required />
                    </Field>
                    <Field label="Parent Email" required>
                      <Input name="parent_email" type="email" placeholder="parent@example.com" required />
                    </Field>
                    <p className="-mt-2 text-xs text-gray-400">
                      QR code will be sent here once SMTP is configured.
                    </p>
                    <Field label="Parent Phone" required>
                      <Input name="parent_phone" placeholder="e.g. 012-3456789" required />
                    </Field>
                  </div>
                </div>
                <Button type="submit" variant="indigo" className="w-full justify-center">
                  Register &amp; Send QR to Parent
                </Button>
              </ActionForm>
            </div>
          )}

          {tab === "list" && (
            <div>
              {participants.length === 0 ? (
                <EmptyState message="No students registered yet" />
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase text-gray-400">
                      <th className="pb-2">Student</th>
                      <th className="pb-2">Parent</th>
                      <th className="pb-2">Contact</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {participants.map((p) => (
                      <tr key={p.id}>
                        <td className="py-2 font-medium text-gray-800">{p.student_name}</td>
                        <td className="py-2 text-gray-600">{p.parent_name}</td>
                        <td className="py-2 text-gray-600">
                          {p.parent_email}
                          <div className="text-xs text-gray-400">{p.parent_phone}</div>
                        </td>
                        <td className="py-2">
                          <div className="flex gap-1">
                            <Badge tone={p.confirmed ? "confirmed" : "pending"}>
                              {p.confirmed ? "Confirmed" : "Pending"}
                            </Badge>
                            {p.waitlisted && <Badge tone="pending">Waitlisted</Badge>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {tab === "confirm" && (
            <div>
              {participants.filter((p) => !p.confirmed).length === 0 ? (
                <EmptyState message="No students awaiting confirmation" />
              ) : (
                <ul className="divide-y divide-gray-100">
                  {participants
                    .filter((p) => !p.confirmed)
                    .map((p) => (
                      <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                        <div>
                          <div className="font-medium text-gray-800">{p.student_name}</div>
                          <div className="text-xs text-gray-400">
                            {p.parent_name} · {p.parent_email}
                          </div>
                        </div>
                        <ActionForm action={confirmParticipant}>
                          <input type="hidden" name="id" value={p.id} />
                          <input type="hidden" name="path" value={path} />
                          <Button type="submit" variant="green" className="!px-3 !py-1.5 text-xs">
                            Confirm
                          </Button>
                        </ActionForm>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
