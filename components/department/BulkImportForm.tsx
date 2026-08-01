"use client";

import { ActionForm } from "@/components/ui/ActionForm";
import { Field } from "@/components/ui/fields";
import { Button } from "@/components/ui/Button";
import { bulkRegisterParticipants } from "@/app/actions/registration";

const TEMPLATE_CSV =
  "Name,Guardian Name,Guardian Email,Guardian Mobile\nJohn Doe,Jane Doe,jane.doe@example.com,0123456789\n";

export function BulkImportForm({ editionId, path }: { editionId: string; path: string }) {
  return (
    <ActionForm action={bulkRegisterParticipants} resetOnSuccess className="space-y-4">
      {(pending) => (
        <>
          <input type="hidden" name="edition_id" value={editionId} />
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
          <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs leading-relaxed text-gray-500">
            <p>
              Accepts .csv or .xlsx (e.g. an AOne export). Only these columns are read -- any
              other columns in the file are ignored: <strong className="text-gray-600">Name</strong> (required),
              Guardian Name, Guardian Email, Guardian Mobile (optional -- add them from the
              Student List later if the file doesn&apos;t have them). Rows matching an
              already-registered student are skipped.
            </p>
            <a
              href={`data:text/csv;charset=utf-8,${encodeURIComponent(TEMPLATE_CSV)}`}
              download="student-import-template.csv"
              className="mt-2 block font-medium text-indigo-600 hover:underline"
            >
              ↓ Download CSV template
            </a>
          </div>
          <Button type="submit" variant="indigo" className="w-full justify-center" disabled={pending}>
            {pending ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Importing...
              </>
            ) : (
              "Import Students"
            )}
          </Button>
        </>
      )}
    </ActionForm>
  );
}
