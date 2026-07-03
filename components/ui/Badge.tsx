import { cn } from "@/lib/utils";

const STATUS_CLASSES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 border border-gray-300",
  active: "bg-green-100 text-green-700",
  archived: "bg-gray-200 text-gray-500",
  paid: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-green-100 text-green-700",
  lead: "bg-gray-100 text-gray-600",
  todo: "bg-gray-100 text-gray-600",
  in_progress: "bg-blue-100 text-blue-700",
  in_review: "bg-amber-100 text-amber-700",
  done: "bg-green-100 text-green-700",
};

export function Badge({
  children,
  tone,
  className,
}: {
  children: React.ReactNode;
  tone?: string;
  className?: string;
}) {
  const key = (tone ?? String(children)).toLowerCase().replace(/\s+/g, "_");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        STATUS_CLASSES[key] ?? "bg-gray-100 text-gray-700",
        className
      )}
    >
      {children}
    </span>
  );
}
