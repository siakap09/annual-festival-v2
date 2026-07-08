"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DEPARTMENTS, type DepartmentKey } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/shell/SidebarContext";

export function Sidebar({
  allowedKeys,
  homeHref = "/editions",
  showEditionManagement = true,
}: {
  /** Restrict visible department links (scoped/section-access users). Omit to show all. */
  allowedKeys?: DepartmentKey[];
  homeHref?: string;
  showEditionManagement?: boolean;
}) {
  const pathname = usePathname();
  const { open, close } = useSidebar();
  const departments = allowedKeys
    ? DEPARTMENTS.filter((d) => allowedKeys.includes(d.key))
    : DEPARTMENTS;

  useEffect(() => {
    close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 -translate-x-full flex-col justify-between border-r border-gray-200 bg-white transition-transform duration-200 ease-in-out",
          "md:static md:z-auto md:w-52 md:translate-x-0",
          open && "translate-x-0"
        )}
      >
        <div className="overflow-y-auto py-4">
          {showEditionManagement && (
            <>
              <div className="px-4 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Editions
              </div>
              <nav className="mt-1 mb-4 flex flex-col">
                <SidebarLink href="/editions" active={pathname === "/editions"} icon="🗓️" label="Edition Management" />
              </nav>
            </>
          )}

          <div className="px-4 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            Departments
          </div>
          <nav className="mt-1 flex flex-col">
            {departments.map((dept) => (
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
          <Link href={homeHref} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
            <span aria-hidden>←</span> Back to Portal
          </Link>
        </div>
      </aside>
    </>
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
