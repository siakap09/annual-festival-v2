import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentEditionIdCookie } from "@/lib/edition-context";
import { departmentByKey } from "@/lib/constants";
import type { Department, Edition, Organization, OrgRole } from "@/lib/types";
import type { DepartmentKey } from "@/lib/constants";

export interface Workspace {
  userEmail: string;
  organization: Organization;
  editions: Edition[];
  currentEdition: Edition;
  departments: Department[];
  /** "restricted" = user only holds section_access grants, not an organization_members row. */
  scope: "full" | "restricted";
  /** The viewer's org-level role. null for restricted (scoped) users, who have no organization_members row. */
  role: OrgRole | null;
  /**
   * Restricted users only: department_id -> allowed checkpoints ("booths").
   * null = whole-department grant (unrestricted). Absent key = no access at
   * all (shouldn't happen for a department already in `departments`). Empty
   * for full-scope users, who are never checkpoint-restricted.
   */
  checkpointsByDepartment: Record<string, number[] | null>;
}

type ScopedAccessRow = {
  edition_id: string;
  department_id: string;
  access_level: string;
  checkpoint: number | null;
};

async function buildScopedWorkspace(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: { id: string; email?: string },
  scoped: ScopedAccessRow[]
): Promise<Workspace> {
  const editionIds = Array.from(new Set(scoped.map((s) => s.edition_id)));

  const { data: editions } = await supabase
    .from("editions")
    .select("*")
    .in("id", editionIds)
    .order("created_at", { ascending: false });

  const editionList = (editions ?? []) as Edition[];
  if (editionList.length === 0) redirect("/login");

  const cookieEditionId = await getCurrentEditionIdCookie();
  const currentEdition =
    editionList.find((e) => e.id === cookieEditionId) ?? editionList[0];

  const scopedForCurrent = scoped.filter((s) => s.edition_id === currentEdition.id);
  const allowedDeptIdsForCurrent = scopedForCurrent.map((s) => s.department_id);

  const checkpointsByDepartment: Record<string, number[] | null> = {};
  for (const s of scopedForCurrent) {
    if (checkpointsByDepartment[s.department_id] === null) continue; // already unrestricted
    if (s.checkpoint === null) {
      checkpointsByDepartment[s.department_id] = null;
    } else {
      checkpointsByDepartment[s.department_id] = [
        ...(checkpointsByDepartment[s.department_id] ?? []),
        s.checkpoint,
      ];
    }
  }

  const { data: departments } = await supabase
    .from("departments")
    .select("*")
    .in("id", allowedDeptIdsForCurrent);

  const { data: organization } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", currentEdition.organization_id)
    .maybeSingle();

  return {
    userEmail: user.email ?? "",
    organization: (organization as Organization) ?? {
      id: currentEdition.organization_id,
      name: "",
      slug: "",
      created_at: "",
    },
    editions: editionList,
    currentEdition,
    departments: (departments ?? []) as Department[],
    scope: "restricted",
    role: null,
    checkpointsByDepartment,
  };
}

export const getWorkspace = cache(async (): Promise<Workspace> => {
  const { isDemo, demoWorkspace } = await import("@/lib/demo");
  if (isDemo()) return demoWorkspace;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Check section_access FIRST, before organization_members. A scoped grant
  // is a deliberate, specific restriction an admin set up for this person --
  // it must win even if this account separately has its own (likely unused)
  // organization_members row, e.g. from the solo org handle_new_user() auto-
  // creates for every brand-new signup. Without this ordering, anyone who'd
  // ever logged in before being granted section_access keeps seeing their
  // own full workspace (Edition Management included) instead of being
  // restricted to what they were actually granted.
  await supabase
    .from("section_access")
    .update({ user_id: user.id })
    .is("user_id", null)
    .eq("email", (user.email ?? "").toLowerCase());

  const { data: scoped } = await supabase
    .from("section_access")
    .select("edition_id, department_id, access_level, checkpoint")
    .eq("user_id", user.id);

  if (scoped && scoped.length > 0) {
    return buildScopedWorkspace(supabase, user, scoped as ScopedAccessRow[]);
  }

  let { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!membership) {
    // Self-heal: claim any pending organization_members invite left
    // unclaimed because handle_new_user() never fired for this email
    // (e.g. they already had an account before being invited).
    await supabase
      .from("organization_members")
      .update({ user_id: user.id })
      .is("user_id", null)
      .eq("email", (user.email ?? "").toLowerCase());

    ({ data: membership } = await supabase
      .from("organization_members")
      .select("organization_id, role")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle());
  }

  if (!membership) {
    redirect("/login");
  }

  const { data: organization } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", membership.organization_id)
    .single();

  if (!organization) redirect("/login");

  const { data: editions } = await supabase
    .from("editions")
    .select("*")
    .eq("organization_id", organization.id)
    .order("created_at", { ascending: false });

  const editionList = (editions ?? []) as Edition[];

  if (editionList.length === 0) redirect("/login");

  const cookieEditionId = await getCurrentEditionIdCookie();
  const currentEdition =
    editionList.find((e) => e.id === cookieEditionId) ??
    editionList.find((e) => e.status !== "archived") ??
    editionList[0];

  const { data: departments } = await supabase
    .from("departments")
    .select("*")
    .eq("edition_id", currentEdition.id);

  return {
    userEmail: user.email ?? "",
    organization: organization as Organization,
    editions: editionList,
    currentEdition,
    departments: (departments ?? []) as Department[],
    scope: "full",
    role: (membership.role as OrgRole) ?? null,
    checkpointsByDepartment: {},
  };
});

/**
 * Where a just-authenticated user should land, instead of always dropping
 * everyone on /editions. A booth-scoped staff member assigned to exactly one
 * checkpoint goes straight to that booth's own check-in page -- no need to
 * find their way there manually every time they sign in.
 */
export function resolveLandingPath(workspace: Workspace): string {
  if (workspace.scope === "full") return "/editions";

  const dept = workspace.departments[0];
  if (!dept) return "/editions"; // shouldn't happen -- getWorkspace() redirects to /login first if truly nothing

  if (dept.key === "registration_area") {
    const checkpoints = workspace.checkpointsByDepartment[dept.id];
    if (checkpoints && checkpoints.length === 1) {
      return `/registration-area/${checkpoints[0]}`;
    }
    return "/registration-area";
  }

  return departmentByKey(dept.key).path;
}

export function findDepartment(departments: Department[], key: DepartmentKey): Department {
  const dept = departments.find((d) => d.key === key);
  if (!dept) {
    throw new Error(`Department "${key}" not found for this edition`);
  }
  return dept;
}
