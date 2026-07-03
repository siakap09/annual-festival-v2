import type { DepartmentKey } from "@/lib/constants";

export type EditionStatus = "draft" | "active" | "archived";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Edition {
  id: string;
  organization_id: string;
  name: string;
  theme: string | null;
  status: EditionStatus;
  start_date: string | null;
  end_date: string | null;
  venue: string | null;
  venue_address: string | null;
  target_participants: number;
  profitability_target_percent: number;
  registration_deadline: string | null;
  test_run_date: string | null;
  enable_waitlist: boolean;
  created_at: string;
}

export interface Department {
  id: string;
  edition_id: string;
  key: DepartmentKey;
  name: string;
  lead_name: string | null;
}

export type TaskStatusValue = "todo" | "in_progress" | "in_review" | "done";

export interface Task {
  id: string;
  department_id: string;
  title: string;
  status: TaskStatusValue;
  assignee: string | null;
  due_date: string | null;
  position: number;
  created_at: string;
}

export type ManpowerType = "internal" | "external";

export interface Manpower {
  id: string;
  department_id: string;
  type: ManpowerType;
  name: string;
  role: string | null;
  contact: string | null;
  created_at: string;
}

export type AccessLevel = "viewer" | "editor" | "lead";

export interface TeamAccess {
  id: string;
  department_id: string;
  email: string;
  access_level: AccessLevel;
  created_at: string;
}

export interface Announcement {
  id: string;
  edition_id: string;
  department_id: string | null;
  title: string;
  body: string | null;
  created_at: string;
}

export interface Participant {
  id: string;
  edition_id: string;
  student_name: string;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  confirmed: boolean;
  email_sent: boolean;
  qr_token: string;
  waitlisted: boolean;
  created_at: string;
}

export interface CheckinEvent {
  id: string;
  participant_id: string;
  checkpoint: number;
  checked_in_at: string;
}

export type BudgetItemType = "revenue" | "expense";
export type BudgetItemStatus = "pending" | "paid";

export interface BudgetItem {
  id: string;
  department_id: string;
  edition_id: string;
  type: BudgetItemType;
  category: string | null;
  description: string;
  amount: number;
  status: BudgetItemStatus;
  created_at: string;
}

export interface Sponsor {
  id: string;
  department_id: string;
  edition_id: string;
  name: string;
  contact_name: string | null;
  contact_email: string | null;
  stage: string;
  amount: number;
  is_vvip: boolean;
  notes: string | null;
  created_at: string;
}

export interface VvipGuest {
  id: string;
  department_id: string;
  edition_id: string;
  name: string;
  title: string | null;
  organization: string | null;
  flagged: boolean;
  created_at: string;
}

export interface SponsorPackage {
  id: string;
  department_id: string;
  edition_id: string;
  name: string;
  price: number;
  benefits: string | null;
  max_slots: number | null;
  created_at: string;
}

export interface DepartmentRecord {
  id: string;
  department_id: string;
  kind: string;
  title: string;
  subtitle: string | null;
  amount: number | null;
  status: string | null;
  due_date: string | null;
  notes: string | null;
  extra: Record<string, unknown>;
  position: number;
  created_at: string;
}

export interface CueBlock {
  id: string;
  department_id: string;
  day: number;
  start_time: string | null;
  end_time: string | null;
  title: string;
  performer: string | null;
  notes: string | null;
  position: number;
  created_at: string;
}
