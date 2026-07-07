"use client";

import { useState, useTransition } from "react";

export function ActionForm({
  action,
  onDone,
  className,
  children,
}: {
  action: (formData: FormData) => Promise<void>;
  onDone?: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const formData = new FormData(e.currentTarget);
        startTransition(async () => {
          try {
            await action(formData);
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
    </form>
  );
}
