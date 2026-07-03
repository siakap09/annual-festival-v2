import type { Department, Task } from "@/lib/types";
import { departmentByKey } from "@/lib/constants";
import { percent } from "@/lib/utils";
import { ProgressBar } from "@/components/ui/ProgressBar";

export function UnitProgress({
  departments,
  tasksByDepartment,
}: {
  departments: Department[];
  tasksByDepartment: Record<string, Task[]>;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-gray-800">
        📊 Unit Progress
      </h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase text-gray-400">
            <th className="pb-2">Unit</th>
            <th className="pb-2">Tasks Done</th>
            <th className="pb-2">Progress</th>
            <th className="pb-2">Overdue</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {departments.map((dept) => {
            const tasks = tasksByDepartment[dept.id] ?? [];
            const done = tasks.filter((t) => t.status === "done").length;
            const config = departmentByKey(dept.key);
            const today = new Date().toISOString().slice(0, 10);
            const overdue = tasks.filter((t) => t.due_date && t.due_date < today && t.status !== "done").length;

            return (
              <tr key={dept.id}>
                <td className="py-2 text-gray-800">{config.name.split(" ").length > 2 ? config.key.toUpperCase() : config.name}</td>
                <td className="py-2 text-gray-600">
                  {done} / {tasks.length}
                </td>
                <td className="py-2">
                  <div className="w-32">
                    <ProgressBar value={percent(done, tasks.length)} />
                  </div>
                </td>
                <td className="py-2 text-green-600">{overdue}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
