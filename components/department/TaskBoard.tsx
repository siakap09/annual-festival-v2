import { TASK_STATUSES } from "@/lib/constants";
import type { Task } from "@/lib/types";
import { addTask, deleteTask, updateTaskStatus } from "@/app/actions/departments";
import { ActionForm } from "@/components/ui/ActionForm";
import { InlineToggle } from "@/components/ui/InlineToggle";
import { Input, Select } from "@/components/ui/fields";
import { Button } from "@/components/ui/Button";

export function TaskBoard({
  departmentId,
  tasks,
  path,
  title,
}: {
  departmentId: string;
  tasks: Task[];
  path: string;
  title: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-gray-800">
        🏛️ {title}
      </h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {TASK_STATUSES.map((col) => {
          const columnTasks = tasks.filter((t) => t.status === col.key);
          return (
            <div key={col.key} className="rounded-md bg-gray-50 p-2">
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {col.label}
                </span>
                <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
                  {columnTasks.length}
                </span>
              </div>
              <div className="flex min-h-[80px] flex-col gap-2">
                {columnTasks.map((task) => (
                  <div key={task.id} className="rounded-md border border-gray-200 bg-white p-2 text-sm shadow-sm">
                    <div className="font-medium text-gray-800">{task.title}</div>
                    <div className="mt-2 flex items-center justify-between gap-1">
                      <ActionForm action={updateTaskStatus}>
                        <input type="hidden" name="task_id" value={task.id} />
                        <input type="hidden" name="path" value={path} />
                        <Select
                          name="status"
                          defaultValue={task.status}
                          className="!py-1 text-xs"
                          onChange={(e) => e.currentTarget.form?.requestSubmit()}
                        >
                          {TASK_STATUSES.map((s) => (
                            <option key={s.key} value={s.key}>
                              {s.label}
                            </option>
                          ))}
                        </Select>
                      </ActionForm>
                      <ActionForm action={deleteTask}>
                        <input type="hidden" name="task_id" value={task.id} />
                        <input type="hidden" name="path" value={path} />
                        <button type="submit" className="text-xs text-gray-400 hover:text-red-500">
                          ✕
                        </button>
                      </ActionForm>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 px-1">
                <InlineToggle label="+ Add Task" variant="ghost" className="!px-1 !py-1 !shadow-none text-xs">
                  {(close) => (
                    <ActionForm action={addTask} onDone={close} className="flex flex-col gap-1.5">
                      <input type="hidden" name="department_id" value={departmentId} />
                      <input type="hidden" name="status" value={col.key} />
                      <input type="hidden" name="path" value={path} />
                      <Input name="title" placeholder="Task title" autoFocus required className="text-xs" />
                      <div className="flex gap-1.5">
                        <Button type="submit" variant="primary" className="!px-2 !py-1 text-xs">
                          Add
                        </Button>
                        <button type="button" onClick={close} className="text-xs text-gray-400">
                          Cancel
                        </button>
                      </div>
                    </ActionForm>
                  )}
                </InlineToggle>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
