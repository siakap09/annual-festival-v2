import { createClient } from "@/lib/supabase/server";
import { isDemo } from "@/lib/demo";
import type { Edition } from "@/lib/types";

export interface EditionStats {
  edition: Edition;
  participantCount: number;
  tasksDone: number;
  tasksTotal: number;
}

export async function getEditionsWithStats(editions: Edition[]): Promise<EditionStats[]> {
  if (isDemo()) {
    return editions.map((edition) => ({
      edition,
      participantCount: 0,
      tasksDone: 0,
      tasksTotal: 0,
    }));
  }
  const supabase = await createClient();

  return Promise.all(
    editions.map(async (edition) => {
      const [{ count: participantCount }, { data: departments }] = await Promise.all([
        supabase
          .from("participants")
          .select("id", { count: "exact", head: true })
          .eq("edition_id", edition.id),
        supabase.from("departments").select("id").eq("edition_id", edition.id),
      ]);

      const departmentIds = (departments ?? []).map((d) => d.id);
      let tasksDone = 0;
      let tasksTotal = 0;

      if (departmentIds.length > 0) {
        const { data: tasks } = await supabase
          .from("tasks")
          .select("status")
          .in("department_id", departmentIds);
        tasksTotal = tasks?.length ?? 0;
        tasksDone = tasks?.filter((t) => t.status === "done").length ?? 0;
      }

      return {
        edition,
        participantCount: participantCount ?? 0,
        tasksDone,
        tasksTotal,
      };
    })
  );
}
