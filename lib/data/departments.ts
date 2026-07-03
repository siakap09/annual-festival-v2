import { createClient } from "@/lib/supabase/server";
import { isDemo } from "@/lib/demo";
import type {
  Announcement,
  Department,
  Manpower,
  Task,
  TeamAccess,
} from "@/lib/types";

export async function getTasks(departmentId: string): Promise<Task[]> {
  if (isDemo()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("tasks")
    .select("*")
    .eq("department_id", departmentId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  return (data ?? []) as Task[];
}

export async function getAllTasksForEdition(
  departments: Department[]
): Promise<Record<string, Task[]>> {
  if (isDemo()) return {};
  const supabase = await createClient();
  const departmentIds = departments.map((d) => d.id);
  if (departmentIds.length === 0) return {};

  const { data } = await supabase
    .from("tasks")
    .select("*")
    .in("department_id", departmentIds);

  const byDept: Record<string, Task[]> = {};
  for (const task of (data ?? []) as Task[]) {
    byDept[task.department_id] = byDept[task.department_id] ?? [];
    byDept[task.department_id].push(task);
  }
  return byDept;
}

export async function getManpower(departmentId: string): Promise<Manpower[]> {
  if (isDemo()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("manpower")
    .select("*")
    .eq("department_id", departmentId)
    .order("created_at", { ascending: true });
  return (data ?? []) as Manpower[];
}

export async function getManpowerCountsForEdition(
  departments: Department[]
): Promise<{ internal: number; external: number }> {
  if (isDemo()) return { internal: 0, external: 0 };
  const supabase = await createClient();
  const departmentIds = departments.map((d) => d.id);
  if (departmentIds.length === 0) return { internal: 0, external: 0 };

  const { data } = await supabase
    .from("manpower")
    .select("type")
    .in("department_id", departmentIds);

  const internal = (data ?? []).filter((m) => m.type === "internal").length;
  const external = (data ?? []).filter((m) => m.type === "external").length;
  return { internal, external };
}

export async function getTeamAccess(departmentId: string): Promise<TeamAccess[]> {
  if (isDemo()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("team_access")
    .select("*")
    .eq("department_id", departmentId)
    .order("created_at", { ascending: true });
  return (data ?? []) as TeamAccess[];
}

export async function getAnnouncements(editionId: string): Promise<Announcement[]> {
  if (isDemo()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("announcements")
    .select("*")
    .eq("edition_id", editionId)
    .order("created_at", { ascending: false });
  return (data ?? []) as Announcement[];
}
