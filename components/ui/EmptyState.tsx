export function EmptyState({ icon, message }: { icon?: string; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      {icon && <span className="text-3xl">{icon}</span>}
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  );
}
