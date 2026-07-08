"use client";

import { useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { setCurrentEditionAndGo } from "@/app/actions/editions";
import { logout } from "@/app/actions/auth";
import { percent } from "@/lib/utils";
import { useSidebar } from "@/components/shell/SidebarContext";
import type { Edition } from "@/lib/types";

export function Header({
  orgName,
  currentEdition,
  editions,
  participantCount,
  userEmail,
}: {
  orgName: string;
  currentEdition: Edition;
  editions: Edition[];
  participantCount: number;
  userEmail: string;
}) {
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const target = currentEdition.target_participants || 1;
  const { toggle } = useSidebar();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 bg-orange-600 px-3 text-white sm:px-5">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={toggle}
          aria-label="Toggle navigation"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-lg hover:bg-orange-500 md:hidden"
        >
          ☰
        </button>
        <span className="shrink-0 text-xl">🎪</span>
        <span className="shrink-0 truncate text-lg font-bold">Annual Showcase</span>
        <span className="ml-2 hidden shrink-0 text-sm text-orange-100 md:inline">{orgName},</span>
        <Badge tone={currentEdition.status}>{currentEdition.status}</Badge>
        <span className="hidden shrink-0 truncate text-sm text-orange-100 lg:inline">{currentEdition.name},</span>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <span className="hidden whitespace-nowrap text-sm font-medium lg:inline">
          {participantCount} / {currentEdition.target_participants} ·{" "}
          {percent(participantCount, target)}% of target
        </span>

        <form ref={formRef} action={setCurrentEditionAndGo}>
          <input type="hidden" name="destination" value={pathname} />
          <select
            name="edition_id"
            defaultValue={currentEdition.id}
            onChange={() => formRef.current?.requestSubmit()}
            className="w-28 rounded-md border border-orange-400 bg-orange-500 px-2 py-1 text-xs font-medium text-white focus:outline-none sm:w-auto"
          >
            {editions.map((e) => (
              <option key={e.id} value={e.id} className="text-gray-900">
                {e.name}
              </option>
            ))}
          </select>
        </form>

        <div className="relative">
          <button
            type="button"
            onClick={() => setUserMenuOpen((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-sm font-bold uppercase"
          >
            {userEmail.charAt(0) || "U"}
          </button>
          {userMenuOpen && (
            <div className="absolute right-0 top-10 z-20 w-52 rounded-md border border-gray-200 bg-white py-1 text-gray-700 shadow-lg">
              <div className="truncate border-b border-gray-100 px-3 py-2 text-xs text-gray-500">
                {userEmail}
              </div>
              <form action={logout}>
                <button type="submit" className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50">
                  Log out
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
