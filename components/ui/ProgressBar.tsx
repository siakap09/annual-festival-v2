export function ProgressBar({ value, colorClass = "bg-orange-500" }: { value: number; colorClass?: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="h-1.5 w-full rounded-full bg-gray-100">
      <div
        className={`h-1.5 rounded-full ${colorClass}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
