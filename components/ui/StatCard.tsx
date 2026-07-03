import { ProgressBar } from "./ProgressBar";

export function StatCard({
  label,
  value,
  caption,
  icon,
  progress,
}: {
  label: string;
  value: React.ReactNode;
  caption?: string;
  icon?: React.ReactNode;
  progress?: number;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        {icon && <span className="text-xl leading-none">{icon}</span>}
      </div>
      <div className="mt-2 text-2xl font-bold text-gray-900">{value}</div>
      {caption && <div className="mt-0.5 text-xs text-gray-400">{caption}</div>}
      {typeof progress === "number" && (
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1">
            <ProgressBar value={progress} />
          </div>
          <span className="text-xs text-gray-400">{progress}%</span>
        </div>
      )}
    </div>
  );
}
