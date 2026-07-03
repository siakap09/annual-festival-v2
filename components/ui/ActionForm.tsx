"use client";

import { useTransition } from "react";

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

  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(async () => {
          await action(formData);
          onDone?.();
        });
      }}
    >
      <fieldset disabled={pending} className="contents">
        {children}
      </fieldset>
    </form>
  );
}
