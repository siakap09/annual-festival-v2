import { DEPARTMENTS } from "@/lib/constants";
import type { Department, Edition, Organization } from "@/lib/types";
import type { Workspace } from "@/lib/data/workspace";

export function isDemo(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}

export function assertNotDemo(): void {
  if (isDemo()) {
    throw new Error("This is a read-only demo preview — changes aren't saved.");
  }
}

const DEMO_EDITION_ID = "demo-edition-0001";
const DEMO_ORG_ID = "demo-org-0001";

export const demoOrganization: Organization = {
  id: DEMO_ORG_ID,
  name: "Ebright",
  slug: "ebright-demo",
  created_at: new Date().toISOString(),
};

export const demoEdition: Edition = {
  id: DEMO_EDITION_ID,
  organization_id: DEMO_ORG_ID,
  name: "Annual Showcase 2026",
  theme: "Rise & Shine",
  status: "draft",
  start_date: "2026-06-23",
  end_date: "2026-06-30",
  venue: "KL Convention Centre",
  venue_address: "Jalan Pinang, Kuala Lumpur",
  target_participants: 500,
  profitability_target_percent: 30,
  registration_deadline: "2026-06-23",
  test_run_date: "2026-06-30",
  enable_waitlist: false,
  created_at: new Date().toISOString(),
};

export const demoDepartments: Department[] = DEPARTMENTS.map((d) => ({
  id: `demo-dept-${d.key}`,
  edition_id: DEMO_EDITION_ID,
  key: d.key,
  name: d.name,
  lead_name: null,
}));

export const demoWorkspace: Workspace = {
  userEmail: "demo@ebright.my",
  organization: demoOrganization,
  editions: [demoEdition],
  currentEdition: demoEdition,
  departments: demoDepartments,
  scope: "full",
  role: "owner",
  checkpointsByDepartment: {},
};
