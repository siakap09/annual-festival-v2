"use client";

import { useState } from "react";
import { type ButtonVariant, buttonClasses } from "./Button";

export function InlineToggle({
  label,
  variant = "primary",
  className,
  children,
}: {
  label: string;
  variant?: ButtonVariant;
  className?: string;
  children: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button type="button" className={buttonClasses(variant, className)} onClick={() => setOpen(true)}>
        {label}
      </button>
    );
  }

  return <>{children(() => setOpen(false))}</>;
}
