-- Booth-level access control for Registration Area check-in staff.
--
-- Extends section_access with an optional checkpoint column rather than
-- building a parallel system: checkpoint = null keeps today's whole-
-- department grant behavior; checkpoint = 1..5 scopes a grant to one
-- specific "booth" (Registration Area's existing checkpoint concept --
-- there is no separate booths table, checkpoints have always just been a
-- bare int 1-5 on checkin_events).
--
-- This also closes the participants/checkin_events RLS gap intentionally
-- left open in 0002_section_access.sql: participants get a department-
-- scoped read policy (booth staff must be able to search the whole
-- roster by name), while checkin_events get checkpoint-scoped read/write
-- policies (the actual "can only work Booth 3" boundary).

alter table section_access add column checkpoint int check (checkpoint between 1 and 5);

-- Replace the old whole-column unique constraint with two partial unique
-- indexes so a person can hold either one whole-department grant OR one
-- or more specific-checkpoint grants for the same department, without
-- colliding (Postgres wouldn't otherwise let checkpoint distinguish rows
-- cleanly across nulls in a single composite unique constraint).
alter table section_access drop constraint if exists section_access_department_id_email_key;

create unique index section_access_dept_email_whole_idx
  on section_access (department_id, email)
  where checkpoint is null;

create unique index section_access_dept_email_checkpoint_idx
  on section_access (department_id, email, checkpoint)
  where checkpoint is not null;

-- ============================================================
-- Helper functions
-- ============================================================

create or replace function has_checkpoint_access(dept_id uuid, cp int)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from section_access sa
    where sa.department_id = dept_id
      and sa.user_id = auth.uid()
      and (sa.checkpoint is null or sa.checkpoint = cp)
  );
$$;

create or replace function has_checkpoint_write_access(dept_id uuid, cp int)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from section_access sa
    where sa.department_id = dept_id
      and sa.user_id = auth.uid()
      and sa.access_level = 'editor'
      and (sa.checkpoint is null or sa.checkpoint = cp)
  );
$$;

-- Resolves the Registration Area department for the edition a given
-- participant belongs to (participants has no department_id column at all).
create or replace function registration_area_department_for_participant(p_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select d.id
  from participants p
  join departments d on d.edition_id = p.edition_id and d.key = 'registration_area'
  where p.id = p_id;
$$;

create or replace function registration_area_department_for_edition(ed_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from departments where edition_id = ed_id and key = 'registration_area';
$$;

-- ============================================================
-- participants: department-scoped read (booth staff must be able to
-- search the entire roster by name, regardless of which booth they work).
-- ============================================================

create policy "scoped viewers can read participants" on participants
  for select
  using (has_section_access(registration_area_department_for_edition(edition_id)));

-- ============================================================
-- checkin_events: department-scoped read (needed to compute the order
-- rule across all prior checkpoints), checkpoint-scoped write (the actual
-- "can only check students in at your assigned booth" boundary).
-- ============================================================

create policy "scoped viewers can read checkin events" on checkin_events
  for select
  using (has_section_access(registration_area_department_for_participant(participant_id)));

create policy "scoped editors can write checkin events at their booth" on checkin_events
  for insert
  with check (has_checkpoint_write_access(registration_area_department_for_participant(participant_id), checkpoint));
