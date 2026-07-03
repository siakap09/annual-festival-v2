"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DEPARTMENTS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-52 shrink-0 flex-col justify-between border-r border-gray-200 bg-white">
      <div className="overflow-y-auto py-4">
        <div className="px-4 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          Editions
        </div>
        <nav className="mt-1 mb-4 flex flex-col">
          <SidebarLink href="/editions" active={pathname === "/editions"} icon="🗓️" label="Edition Management" />
        </nav>

        <div className="px-4 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          Departments
        </div>
        <nav className="mt-1 flex flex-col">
          {DEPARTMENTS.map((dept) => (
            <SidebarLink
              key={dept.key}
              href={dept.path}
              active={pathname.startsWith(dept.path)}
              icon={dept.icon}
              label={dept.name}
            />
          ))}
        </nav>
      </div>

      <div className="border-t border-gray-100 p-4">
        <Link href="/editions" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
          <span aria-hidden>←</span> Back to Portal
        </Link>
      </div>
    </aside>
  );
}

function SidebarLink({
  href,
  active,
  icon,
  label,
}: {
  href: string;
  active: boolean;
  icon: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 border-l-2 px-4 py-2 text-sm",
        active
          ? "border-orange-600 bg-orange-50 font-medium text-orange-700"
          : "border-transparent text-gray-600 hover:bg-gray-50"
      )}
    >
      <span className="w-4 text-center">{icon}</span>
      <span className="truncate">{label}</span>
    </Link>
  );
}
