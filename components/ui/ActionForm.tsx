"use client";

import { useState, useTransition } from "react";

export function ActionForm({
  action,
  onDone,
  resetOnSuccess,
  className,
  children,
}: {
  action: (formData: FormData) => Promise<void | string>;
  onDone?: () => void;
  /** Reset the form's fields back to their defaults after a successful submit. */
  resetOnSuccess?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        const form = e.currentTarget;
        const formData = new FormData(form);
        startTransition(async () => {
          try {
            const result = await action(formData);
            if (typeof result === "string") setSuccess(result);
            if (resetOnSuccess) form.reset();
            onDone?.();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong.");
          }
        });
      }}
    >
      <fieldset disabled={pending} className="contents">
        {children}
      </fieldset>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {success && <p className="mt-1 text-xs text-green-600">{success}</p>}
    </form>
  );
}
