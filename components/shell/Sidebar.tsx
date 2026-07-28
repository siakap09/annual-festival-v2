"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { DEPARTMENTS, type DepartmentKey } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/shell/SidebarContext";

const ALL_BOOTHS = [1, 2, 3, 4, 5];

export function Sidebar({
  allowedKeys,
  homeHref = "/editions",
  showEditionManagement = true,
  showRoleManagement = false,
  boothCheckpoints,
}: {
  /** Restrict visible department links (scoped/section-access users). Omit to show all. */
  allowedKeys?: DepartmentKey[];
  homeHref?: string;
  showEditionManagement?: boolean;
  showRoleManagement?: boolean;
  /**
   * Booths (checkpoints) the viewer can jump to via the Booth Area dropdown.
   * undefined = no registration_area access at all, don't render it. null =
   * whole-department grant (all 5). Array = a checkpoint-scoped subset.
   */
  boothCheckpoints?: number[] | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { open, close } = useSidebar();
  const departments = allowedKeys
    ? DEPARTMENTS.filter((d) => allowedKeys.includes(d.key))
    : DEPARTMENTS;
  const booths = boothCheckpoints ?? ALL_BOOTHS;
  const boothMatch = pathname.match(/^\/registration-area\/(\d+)$/);
  const selectedBooth = boothMatch ? boothMatch[1] : "";
  // Departments only make sense once you're inside an actual department/edition
  // route -- org-level pages (Edition Management, Role Management, and any
  // future ones) have no single edition/department in view. Positive check
  // against known department routes instead of an exclusion list, so adding
  // another org-level page later doesn't require remembering to update this.
  const isDepartmentRoute = DEPARTMENTS.some(
    (d) => pathname === d.path || pathname.startsWith(`${d.path}/`)
  );
  const hideDepartments = !isDepartmentRoute;

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

          {showRoleManagement && (
            <>
              <div className="px-4 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Organization
              </div>
              <nav className="mt-1 mb-4 flex flex-col">
                <SidebarLink
                  href="/role-management"
                  active={pathname === "/role-management"}
                  icon="🛡️"
                  label="Role Management"
                />
              </nav>
            </>
          )}

          {!hideDepartments && (
            <>
              <div className="px-4 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Departments
              </div>
              <nav className="mt-1 flex flex-col">
                {departments.map((dept) => {
                  // Boundary-safe prefix check -- plain startsWith would also
                  // match "/registration" against "/registration-area/3".
                  const active = pathname === dept.path || pathname.startsWith(`${dept.path}/`);
                  const showBoothDropdown = dept.key === "registration_area" && boothCheckpoints !== undefined;

                  if (!showBoothDropdown) {
                    return (
                      <SidebarLink key={dept.key} href={dept.path} active={active} icon={dept.icon} label={dept.name} />
                    );
                  }

                  return (
                    <div
                      key={dept.key}
                      className={cn(
                        "flex items-center justify-between gap-2 border-l-2 py-2 pl-4 pr-3",
                        active ? "border-orange-600 bg-orange-50" : "border-transparent hover:bg-gray-50"
                      )}
                    >
                      <Link
                        href={dept.path}
                        className={cn(
                          "flex min-w-0 items-center gap-2 text-sm",
                          active ? "font-medium text-orange-700" : "text-gray-600 hover:text-gray-900"
                        )}
                      >
                        <span className="w-4 shrink-0 text-center">{dept.icon}</span>
                        <span className="truncate">{dept.name}</span>
                      </Link>
                      <select
                        value={selectedBooth}
                        onChange={(e) =>
                          router.push(
                            e.target.value ? `/registration-area/${e.target.value}` : "/registration-area"
                          )
                        }
                        title="Jump to a booth"
                        className="w-11 shrink-0 rounded-md border border-gray-300 bg-white py-0.5 pl-1.5 pr-0.5 text-xs text-gray-700 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                      >
                        <option value="">All</option>
                        {booths.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </nav>
            </>
          )}
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
