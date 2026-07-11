-- Collapses the role model to two tiers: owner (superadmin) and admin.
-- "member" is removed as a *selectable* role going forward (see the
-- tightened invite-insert policy below), but this migration does NOT touch
-- the role check constraint or any existing rows -- if legacy "member" rows
-- exist, that's a data decision for the app owner to make separately, not
-- something this migration assumes or forces.
--
-- Admin is upgraded from read-only to full read/write on every
-- department-content table, org-wide, with no section_access gating --
-- exactly like owner, except admin still cannot create/archive editions or
-- rename departments (editions/departments policies are untouched below,
-- on purpose: they stay owner-only write, admin read-only, same as 0006).
--
-- section_access and its scoped read/write policies (0002/0004) are
-- untouched -- that's a separate, orthogonal mechanism for granting access
-- to users who may not even hold an organization_members row at all (e.g.
-- booth-scoped registration_area staff), not part of the org role model.
--
-- handle_new_user() is NOT touched by this migration.

drop policy if exists "admins can view tasks" on tasks;
create policy "admins can manage tasks" on tasks
  for all
  using (is_admin_or_owner(department_org(department_id)))
  with check (is_admin_or_owner(department_org(department_id)));

drop policy if exists "admins can view manpower" on manpower;
create policy "admins can manage manpower" on manpower
  for all
  using (is_admin_or_owner(department_org(department_id)))
  with check (is_admin_or_owner(department_org(department_id)));

drop policy if exists "admins can view team access" on team_access;
create policy "admins can manage team access" on team_access
  for all
  using (is_admin_or_owner(department_org(department_id)))
  with check (is_admin_or_owner(department_org(department_id)));

drop policy if exists "admins can view cue blocks" on cue_blocks;
create policy "admins can manage cue blocks" on cue_blocks
  for all
  using (is_admin_or_owner(department_org(department_id)))
  with check (is_admin_or_owner(department_org(department_id)));

drop policy if exists "admins can view department records" on department_records;
create policy "admins can manage department records" on department_records
  for all
  using (is_admin_or_owner(department_org(department_id)))
  with check (is_admin_or_owner(department_org(department_id)));

drop policy if exists "admins can view budget items" on budget_items;
create policy "admins can manage budget items" on budget_items
  for all
  using (is_admin_or_owner(department_org(department_id)))
  with check (is_admin_or_owner(department_org(department_id)));

drop policy if exists "admins can view sponsors" on sponsors;
create policy "admins can manage sponsors" on sponsors
  for all
  using (is_admin_or_owner(department_org(department_id)))
  with check (is_admin_or_owner(department_org(department_id)));

drop policy if exists "admins can view vvip guests" on vvip_guests;
create policy "admins can manage vvip guests" on vvip_guests
  for all
  using (is_admin_or_owner(department_org(department_id)))
  with check (is_admin_or_owner(department_org(department_id)));

drop policy if exists "admins can view sponsor packages" on sponsor_packages;
create policy "admins can manage sponsor packages" on sponsor_packages
  for all
  using (is_admin_or_owner(department_org(department_id)))
  with check (is_admin_or_owner(department_org(department_id)));

drop policy if exists "admins can view participants" on participants;
create policy "admins can manage participants" on participants
  for all
  using (is_admin_or_owner(edition_org(edition_id)))
  with check (is_admin_or_owner(edition_org(edition_id)));

drop policy if exists "admins can view checkins" on checkin_events;
create policy "admins can manage checkins" on checkin_events
  for all
  using (is_admin_or_owner(participant_org(participant_id)))
  with check (is_admin_or_owner(participant_org(participant_id)));

drop policy if exists "admins can view announcements" on announcements;
create policy "admins can manage announcements" on announcements
  for all
  using (is_admin_or_owner(edition_org(edition_id)))
  with check (is_admin_or_owner(edition_org(edition_id)));

-- ============================================================
-- Stop allowing new "member" rows at the DB level too, not just in the app
-- layer -- matches the UI no longer offering it, without touching the
-- check constraint or any existing rows.
-- ============================================================

drop policy if exists "owners and admins can invite members" on organization_members;
create policy "owners and admins can invite members" on organization_members
  for insert
  with check (
    is_admin_or_owner(organization_id)
    and role = 'admin'
  );
