import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentEditionIdCookie } from "@/lib/edition-context";
import type { Department, Edition, Organization, OrgRole } from "@/lib/types";
import type { DepartmentKey } from "@/lib/constants";

export interface Workspace {
  userEmail: string;
  organization: Organization;
  editions: Edition[];
  currentEdition: Edition;
  departments: Department[];
  /**
   * "restricted" = access comes entirely from section_access grants, not
   * org-wide role. Applies to users with no organization_members row at all,
   * and to "member"-role users (who have a row but no default org access).
   */
  scope: "full" | "restricted";
  /** The viewer's org-level role. null only when there's no organization_members row at all. */
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
  scoped: ScopedAccessRow[],
  role: OrgRole | null = null
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
    role,
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

  // A plain "member" has no org-wide access by default -- their workspace is
  // built entirely from section_access grants, exactly like someone with no
  // organization_members row at all (their role is just carried through for
  // display/UI gating instead of null). Only "owner"/"admin" get full scope.
  if (!membership || membership.role === "member") {
    // Self-heal: claim any pending section_access rows left unclaimed
    // because handle_new_user() never fired for this email (e.g. they
    // already had an account before being invited).
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
      return buildScopedWorkspace(
        supabase,
        user,
        scoped as ScopedAccessRow[],
        membership?.role === "member" ? "member" : null
      );
    }

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

export function findDepartment(departments: Department[], key: DepartmentKey): Department {
  const dept = departments.find((d) => d.key === key);
  if (!dept) {
    throw new Error(`Department "${key}" not found for this edition`);
  }
  return dept;
}
