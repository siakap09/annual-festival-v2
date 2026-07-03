import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentEditionIdCookie } from "@/lib/edition-context";
import type { Department, Edition, Organization } from "@/lib/types";
import type { DepartmentKey } from "@/lib/constants";

export interface Workspace {
  userEmail: string;
  organization: Organization;
  editions: Edition[];
  currentEdition: Edition;
  departments: Department[];
}

export const getWorkspace = cache(async (): Promise<Workspace> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership) redirect("/login");

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
  };
});

export function findDepartment(departments: Department[], key: DepartmentKey): Department {
  const dept = departments.find((d) => d.key === key);
  if (!dept) {
    throw new Error(`Department "${key}" not found for this edition`);
  }
  return dept;
}
