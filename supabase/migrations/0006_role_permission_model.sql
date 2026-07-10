-- Replaces the "any organization_members row = full read/write everywhere"
-- model with a real role hierarchy:
--
--   owner (superadmin) -- full read/write on every table, every edition.
--   admin               -- read-only everywhere; writes are gated by
--                          section_access exactly like a plain member.
--   member              -- no org-wide access by default; access comes
--                          entirely from section_access grants.
--
-- Today, is_member(org_id) (0001) doesn't check role at all, so it's used
-- as a blanket "for all" policy that gives owner/admin/member identical
-- unrestricted access. This migration drops those blanket policies and
-- replaces them with an owner-only "for all" policy plus an admin-only
-- "for select" policy, on every org-wide data table. The existing
-- section_access-based scoped read/write policies (0002/0004) are left
-- completely untouched -- they're additive and already correct for both
-- admin's and member's department-level grants.
--
-- organization_members' own policies (0003/0005) and handle_new_user()
-- (0001/0002/0005) are NOT touched by this migration.

-- ============================================================
-- editions
-- ============================================================

drop policy if exists "members can manage editions" on editions;

create policy "owners manage editions" on editions
  for all
  using (is_owner(organization_id))
  with check (is_owner(organization_id));

create policy "admins can view editions" on editions
  for select
  using (is_admin_or_owner(organization_id));

-- ============================================================
-- departments (the row itself -- name/lead_name. Department *content*
-- tables below have their own, separate policies.)
-- ============================================================

drop policy if exists "members can manage departments" on departments;

create policy "owners manage departments" on departments
  for all
  using (is_owner(department_org(id)))
  with check (is_owner(department_org(id)));

create policy "admins can view departments" on departments
  for select
  using (is_admin_or_owner(department_org(id)));

-- ============================================================
-- Department-content tables: tasks, manpower, team_access, cue_blocks,
-- department_records, budget_items, sponsors, vvip_guests, sponsor_packages
-- ============================================================

drop policy if exists "members can manage tasks" on tasks;
create policy "owners manage tasks" on tasks
  for all
  using (is_owner(department_org(department_id)))
  with check (is_owner(department_org(department_id)));
create policy "admins can view tasks" on tasks
  for select
  using (is_admin_or_owner(department_org(department_id)));

drop policy if exists "members can manage manpower" on manpower;
create policy "owners manage manpower" on manpower
  for all
  using (is_owner(department_org(department_id)))
  with check (is_owner(department_org(department_id)));
create policy "admins can view manpower" on manpower
  for select
  using (is_admin_or_owner(department_org(department_id)));

drop policy if exists "members can manage team access" on team_access;
create policy "owners manage team access" on team_access
  for all
  using (is_owner(department_org(department_id)))
  with check (is_owner(department_org(department_id)));
create policy "admins can view team access" on team_access
  for select
  using (is_admin_or_owner(department_org(department_id)));

drop policy if exists "members can manage cue blocks" on cue_blocks;
create policy "owners manage cue blocks" on cue_blocks
  for all
  using (is_owner(department_org(department_id)))
  with check (is_owner(department_org(department_id)));
create policy "admins can view cue blocks" on cue_blocks
  for select
  using (is_admin_or_owner(department_org(department_id)));

drop policy if exists "members can manage department records" on department_records;
create policy "owners manage department records" on department_records
  for all
  using (is_owner(department_org(department_id)))
  with check (is_owner(department_org(department_id)));
create policy "admins can view department records" on department_records
  for select
  using (is_admin_or_owner(department_org(department_id)));

drop policy if exists "members can manage budget items" on budget_items;
create policy "owners manage budget items" on budget_items
  for all
  using (is_owner(department_org(department_id)))
  with check (is_owner(department_org(department_id)));
create policy "admins can view budget items" on budget_items
  for select
  using (is_admin_or_owner(department_org(department_id)));

drop policy if exists "members can manage sponsors" on sponsors;
create policy "owners manage sponsors" on sponsors
  for all
  using (is_owner(department_org(department_id)))
  with check (is_owner(department_org(department_id)));
create policy "admins can view sponsors" on sponsors
  for select
  using (is_admin_or_owner(department_org(department_id)));

drop policy if exists "members can manage vvip guests" on vvip_guests;
create policy "owners manage vvip guests" on vvip_guests
  for all
  using (is_owner(department_org(department_id)))
  with check (is_owner(department_org(department_id)));
create policy "admins can view vvip guests" on vvip_guests
  for select
  using (is_admin_or_owner(department_org(department_id)));

drop policy if exists "members can manage sponsor packages" on sponsor_packages;
create policy "owners manage sponsor packages" on sponsor_packages
  for all
  using (is_owner(department_org(department_id)))
  with check (is_owner(department_org(department_id)));
create policy "admins can view sponsor packages" on sponsor_packages
  for select
  using (is_admin_or_owner(department_org(department_id)));

-- ============================================================
-- participants / checkin_events (edition-wide, no department_id column --
-- section_access-scoped policies from 0004 are untouched and still apply
-- for registration_area booth-scoped users regardless of org role)
-- ============================================================

drop policy if exists "members can manage participants" on participants;
create policy "owners manage participants" on participants
  for all
  using (is_owner(edition_org(edition_id)))
  with check (is_owner(edition_org(edition_id)));
create policy "admins can view participants" on participants
  for select
  using (is_admin_or_owner(edition_org(edition_id)));

drop policy if exists "members can manage checkins" on checkin_events;
create policy "owners manage checkins" on checkin_events
  for all
  using (is_owner(participant_org(participant_id)))
  with check (is_owner(participant_org(participant_id)));
create policy "admins can view checkins" on checkin_events
  for select
  using (is_admin_or_owner(participant_org(participant_id)));

-- ============================================================
-- announcements: edition-wide with an optional department_id. 0002 never
-- covered this table (no section_access policies existed for it at all),
-- so on top of the owner/admin split below, add the same scoped read/write
-- pattern the other department tables already have -- readable org-wide
-- when department_id is null (and the viewer has any section_access into
-- that edition), otherwise gated per-department like everything else.
-- ============================================================

drop policy if exists "members can manage announcements" on announcements;
create policy "owners manage announcements" on announcements
  for all
  using (is_owner(edition_org(edition_id)))
  with check (is_owner(edition_org(edition_id)));
create policy "admins can view announcements" on announcements
  for select
  using (is_admin_or_owner(edition_org(edition_id)));

create policy "scoped viewers can read announcements" on announcements
  for select
  using (
    (department_id is null and has_edition_access(edition_id))
    or has_section_access(department_id)
  );

create policy "scoped editors can write announcements" on announcements
  for all
  using (has_section_write_access(department_id))
  with check (has_section_write_access(department_id));
