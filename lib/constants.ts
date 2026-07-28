export type DepartmentKey =
  | "oc"
  | "procurement"
  | "sponsorship"
  | "media"
  | "showcase"
  | "logistics"
  | "youthpreneur"
  | "ceo"
  | "registration"
  | "registration_area";

export interface DepartmentConfig {
  key: DepartmentKey;
  name: string;
  icon: string;
  path: string;
}

export const DEPARTMENTS: DepartmentConfig[] = [
  { key: "oc", name: "Organizing Committee", icon: "🏛️", path: "/oc" },
  { key: "procurement", name: "Procurement", icon: "🖥️", path: "/procurement" },
  { key: "sponsorship", name: "Sponsorship & VVIP", icon: "🏅", path: "/sponsorship" },
  { key: "media", name: "Media & Publicity", icon: "📣", path: "/media" },
  { key: "showcase", name: "Showcase & Production", icon: "🔧", path: "/showcase" },
  { key: "logistics", name: "Logistics", icon: "🚚", path: "/logistics" },
  { key: "youthpreneur", name: "Youthpreneur", icon: "💡", path: "/youthpreneur" },
  { key: "ceo", name: "CEO Unit", icon: "🏢", path: "/ceo" },
  { key: "registration", name: "Registration", icon: "📋", path: "/registration" },
  { key: "registration_area", name: "Booth Area", icon: "🎫", path: "/registration-area" },
];

export function departmentByKey(key: DepartmentKey): DepartmentConfig {
  const dept = DEPARTMENTS.find((d) => d.key === key);
  if (!dept) throw new Error(`Unknown department key: ${key}`);
  return dept;
}

export const TASK_STATUSES = [
  { key: "todo", label: "To Do" },
  { key: "in_progress", label: "In Progress" },
  { key: "in_review", label: "In Review" },
  { key: "done", label: "Done" },
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number]["key"];

export const SPONSOR_STAGES = [
  { key: "lead", label: "Lead" },
  { key: "contacted", label: "Contacted" },
  { key: "meeting", label: "Meeting" },
  { key: "mou_signed", label: "MOU Signed" },
  { key: "confirmed", label: "Confirmed" },
  { key: "fulfilled", label: "Fulfilled" },
] as const;

export type SponsorStage = (typeof SPONSOR_STAGES)[number]["key"];

export const CURRENT_EDITION_COOKIE = "af_current_edition";
