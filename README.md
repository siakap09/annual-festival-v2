# Annual Showcase

An event management portal for running an annual student showcase: editions,
departments (Organizing Committee, Procurement, Sponsorship & VVIP, Media &
Publicity, Showcase & Production, Logistics, Youthpreneur, CEO Unit,
Registration, Registration Area), task boards, budgets, sponsor pipeline, and
a check-in kiosk.

Built with Next.js (App Router, Server Actions) and Supabase (Postgres, Auth).

## Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com).

2. **Run the schema migration.** In the Supabase SQL editor, run the contents
   of `supabase/migrations/0001_init.sql`. This creates all tables, row-level
   security policies, and a trigger that automatically provisions a new
   organization + draft edition + the 10 departments whenever someone signs
   up.

3. **(Optional) Disable email confirmation** for faster local testing: in
   Supabase → Authentication → Providers → Email, turn off "Confirm email".
   Otherwise new accounts must click the confirmation link sent to their
   inbox before they can sign in.

4. **Copy the env file** and fill in your project's API credentials (Project
   Settings → API):

   ```bash
   cp .env.local.example .env.local
   ```

5. **Install dependencies and run the dev server:**

   ```bash
   npm install
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000), sign up with an email
   + password. A new organization and a draft edition are created for you
   automatically.

## Notes

- The **Media & Publicity** department page was built without a reference
  screenshot — it follows the same visual pattern as the other departments
  (stat cards + tabs) but should be treated as a placeholder pending the real
  design.
- Many of the simpler list-style tabs (Inventory, Payment Requests, Waitlist,
  Venue & Site, Loading Bay, Pack Checklist, To-Do List, Long Lead Items,
  Daily Tasks, Accommodation, Registration Flow, Meals & Refreshment,
  Products, Booth Assignment, Content Calendar, Press Coverage, Assets,
  Cross-unit Report, Post-Mortem, Participant Schedule, Scoring, Stage
  Checklist) share one generic `department_records` table and UI component
  rather than a bespoke table each.
- The Registration Area "Scan QR" mode shows a camera preview only; the
  functional check-in path is "Search Name" (order-rule enforced: CP1 → CP5
  sequentially, skipping blocked).
