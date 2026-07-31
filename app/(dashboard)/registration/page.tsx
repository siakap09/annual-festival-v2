import { getWorkspace, findDepartment } from "@/lib/data/workspace";
import { getParticipants } from "@/lib/data/registration";
import { BackToEditions, PageHeader } from "@/components/shell/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Tabs } from "@/components/ui/Tabs";
import { Field, Input } from "@/components/ui/fields";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ActionForm } from "@/components/ui/ActionForm";
import { StudentListTable } from "@/components/department/StudentListTable";
import { formatDate, percent } from "@/lib/utils";
import { bulkRegisterParticipants, registerParticipant, resendParticipantQrEmail } from "@/app/actions/registration";

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
          value={`${confirmed.length} / ${currentEdition.target_participants}`}
          caption={`${percent(confirmed.length, currentEdition.target_participants)}% of target (confirmed only)`}
          icon="🎓"
          progress={percent(confirmed.length, currentEdition.target_participants)}
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
            { key: "bulk", label: "Bulk Import", icon: "📤" },
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
                      The student&apos;s check-in QR code is emailed here automatically.
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

          {tab === "bulk" && (
            <div className="max-w-md">
              <ActionForm action={bulkRegisterParticipants} resetOnSuccess className="space-y-4">
                <input type="hidden" name="edition_id" value={currentEdition.id} />
                <input type="hidden" name="path" value={path} />
                <Field label="CSV or Excel file" required>
                  <input
                    type="file"
                    name="csv_file"
                    accept=".csv,text/csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    required
                    className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-orange-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-orange-700"
                  />
                </Field>
                <p className="-mt-2 text-xs text-gray-400">
                  Accepts .csv or .xlsx (e.g. an AOne export). Only these columns are read --
                  any other columns in the file are ignored: <strong>Name</strong> (required),
                  Guardian Name, Guardian Email, Guardian Mobile (optional -- add them from the
                  Student List later if the file doesn&apos;t have them). Rows matching an
                  already-registered student are skipped.
                </p>
                <Button type="submit" variant="indigo" className="w-full justify-center">
                  Import Students
                </Button>
              </ActionForm>
            </div>
          )}

          {tab === "list" && (
            <div>
              {participants.length === 0 ? (
                <EmptyState message="No students registered yet" />
              ) : (
                <StudentListTable participants={participants} path={path} />
              )}
            </div>
          )}

          {tab === "confirm" && (
            <div>
              {participants.filter((p) => !p.email_sent).length === 0 ? (
                <EmptyState message="Every student has been emailed their QR code" />
              ) : (
                <ul className="divide-y divide-gray-100">
                  {participants
                    .filter((p) => !p.email_sent)
                    .map((p) => (
                      <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                        <div>
                          <div className="font-medium text-gray-800">{p.student_name}</div>
                          <div className="text-xs text-gray-400">
                            {p.parent_name && p.parent_email ? `${p.parent_name} · ${p.parent_email}` : "Parent details not yet added"}
                          </div>
                        </div>
                        {p.parent_email ? (
                          <ActionForm action={resendParticipantQrEmail}>
                            <input type="hidden" name="id" value={p.id} />
                            <input type="hidden" name="path" value={path} />
                            <Button type="submit" variant="green" className="!px-3 !py-1.5 text-xs">
                              Send QR
                            </Button>
                          </ActionForm>
                        ) : (
                          <span className="text-xs text-gray-400">Add parent email from Student List first</span>
                        )}
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
