import Link from "next/link";

export function BackToEditions() {
  return (
    <Link href="/editions" className="mb-3 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
      <span aria-hidden>←</span> Back to Editions
    </Link>
  );
}

export function PageHeader({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between">
      <div className="flex items-start gap-3">
        <span className="text-2xl leading-none">{icon}</span>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
