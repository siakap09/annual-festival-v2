"use client";

import { useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { setCurrentEditionAndGo } from "@/app/actions/editions";
import { logout } from "@/app/actions/auth";
import { percent } from "@/lib/utils";
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

  return (
    <header className="flex h-14 shrink-0 items-center justify-between bg-orange-600 px-5 text-white">
      <div className="flex items-center gap-3">
        <span className="text-xl">🎪</span>
        <span className="text-lg font-bold">Annual Showcase</span>
        <span className="ml-2 text-sm text-orange-100">{orgName},</span>
        <Badge tone={currentEdition.status}>{currentEdition.status}</Badge>
        <span className="text-sm text-orange-100">{currentEdition.name},</span>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">
          {participantCount} / {currentEdition.target_participants} ·{" "}
          {percent(participantCount, target)}% of target
        </span>

        <form ref={formRef} action={setCurrentEditionAndGo}>
          <input type="hidden" name="destination" value={pathname} />
          <select
            name="edition_id"
            defaultValue={currentEdition.id}
            onChange={() => formRef.current?.requestSubmit()}
            className="rounded-md border border-orange-400 bg-orange-500 px-2 py-1 text-xs font-medium text-white focus:outline-none"
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
