-- Per-section (department-level) email-based access control.
-- Adds a scoped-membership path alongside organization_members without
-- changing its semantics: a "scoped" user has section_access rows but no
-- organization_members row, and gets a cut-down workspace (see getWorkspace()).

create table section_access (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references editions(id) on delete cascade,
  department_id uuid not null references departments(id) on delete cascade,
  email text not null,
  user_id uuid references auth.users(id) on delete cascade,
  access_level text not null default 'viewer' check (access_level in ('viewer','editor')),
  created_at timestamptz not null default now(),
  unique (department_id, email)
);

create index section_access_user_id_idx on section_access (user_id);
create index section_access_edition_id_idx on section_access (edition_id);

-- ============================================================
-- Helper functions for scoped-access RLS checks
-- ============================================================

create or replace function has_section_access(dept_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from section_access sa
    where sa.department_id = dept_id and sa.user_id = auth.uid()
  );
$$;

create or replace function has_section_write_access(dept_id uuid)
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
  );
$$;

create or replace function has_edition_access(ed_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from section_access sa
    where sa.edition_id = ed_id and sa.user_id = auth.uid()
  );
$$;

create or replace function has_org_section_access(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from section_access sa
    join editions e on e.id = sa.edition_id
    where e.organization_id = org_id and sa.user_id = auth.uid()
  );
$$;

-- ============================================================
-- RLS on section_access itself
-- ============================================================

alter table section_access enable row level security;

-- Org admins manage access grants for departments in their own org
-- (same convention as tasks/manpower/team_access: is_member(department_org(...))).
create policy "org members manage section access" on section_access
  for all
  using (is_member(department_org(department_id)))
  with check (is_member(department_org(department_id)));

-- A scoped user can see their own (already-claimed) access rows, e.g. to
-- build their workspace and know which editions/departments they can reach.
create policy "scoped user can view own access rows" on section_access
  for select
  using (user_id = auth.uid());

-- A scoped user can claim a pending (unclaimed) invite that matches their
-- own email. This is what makes getWorkspace()'s self-heal UPDATE actually
-- affect a row instead of silently matching zero rows under RLS.
create policy "scoped user can claim their pending invite" on section_access
  for update
  using (user_id is null and lower(email) = lower(auth.email()))
  with check (user_id = auth.uid());

-- ============================================================
-- Additive read policies so a scoped user can resolve their own
-- organization/edition/department context (existing org-member
-- policies on these tables are untouched).
-- ============================================================

create policy "scoped members can view their org" on organizations
  for select
  using (has_org_section_access(id));

create policy "scoped members can view their edition" on editions
  for select
  using (has_edition_access(id));

create policy "scoped members can view their department" on departments
  for select
  using (has_section_access(id));

-- ============================================================
-- Additive read/write policies on department-scoped data tables.
-- Existing "members can manage ..." policies (org-wide) are untouched;
-- these are separate, narrower policies that only ever add access for
-- users holding a matching section_access row, never remove it.
-- ============================================================

create policy "scoped viewers can read tasks" on tasks
  for select using (has_section_access(department_id));
create policy "scoped editors can write tasks" on tasks
  for all using (has_section_write_access(department_id)) with check (has_section_write_access(department_id));

create policy "scoped viewers can read manpower" on manpower
  for select using (has_section_access(department_id));
create policy "scoped editors can write manpower" on manpower
  for all using (has_section_write_access(department_id)) with check (has_section_write_access(department_id));

create policy "scoped viewers can read team access" on team_access
  for select using (has_section_access(department_id));
create policy "scoped editors can write team access" on team_access
  for all using (has_section_write_access(department_id)) with check (has_section_write_access(department_id));

create policy "scoped viewers can read cue blocks" on cue_blocks
  for select using (has_section_access(department_id));
create policy "scoped editors can write cue blocks" on cue_blocks
  for all using (has_section_write_access(department_id)) with check (has_section_write_access(department_id));

create policy "scoped viewers can read department records" on department_records
  for select using (has_section_access(department_id));
create policy "scoped editors can write department records" on department_records
  for all using (has_section_write_access(department_id)) with check (has_section_write_access(department_id));

create policy "scoped viewers can read budget items" on budget_items
  for select using (has_section_access(department_id));
create policy "scoped editors can write budget items" on budget_items
  for all using (has_section_write_access(department_id)) with check (has_section_write_access(department_id));

create policy "scoped viewers can read sponsors" on sponsors
  for select using (has_section_access(department_id));
create policy "scoped editors can write sponsors" on sponsors
  for all using (has_section_write_access(department_id)) with check (has_section_write_access(department_id));

create policy "scoped viewers can read vvip guests" on vvip_guests
  for select using (has_section_access(department_id));
create policy "scoped editors can write vvip guests" on vvip_guests
  for all using (has_section_write_access(department_id)) with check (has_section_write_access(department_id));

create policy "scoped viewers can read sponsor packages" on sponsor_packages
  for select using (has_section_access(department_id));
create policy "scoped editors can write sponsor packages" on sponsor_packages
  for all using (has_section_write_access(department_id)) with check (has_section_write_access(department_id));

-- Note: participants/checkin_events are intentionally NOT covered here —
-- they have no department_id column (edition-wide only), so a
-- "registration_area"-scoped user gets the page shell but not RLS access
-- to check-in data under this migration. Needs its own design pass, same
-- as booth-level access.

-- ============================================================
-- New-user provisioning: claim pending scoped invites before creating
-- a brand-new organization for this user.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
  new_edition_id uuid;
  org_slug text := substr(md5(random()::text || new.id::text), 1, 8);
  dept record;
  matched_count int;
begin
  -- Claim any pending scoped-access invitations for this email.
  update section_access
  set user_id = new.id
  where user_id is null
    and lower(email) = lower(new.email);

  get diagnostics matched_count = row_count;

  if matched_count > 0 then
    -- Invited as a scoped member into someone else's org/department(s).
    -- Do NOT provision a new organization for this user.
    return new;
  end if;

  insert into organizations (name, slug)
  values (org_slug, org_slug || '-' || substr(md5(random()::text), 1, 4))
  returning id into new_org_id;

  insert into organization_members (organization_id, user_id, role)
  values (new_org_id, new.id, 'owner');

  insert into editions (organization_id, name, theme, status, target_participants)
  values (new_org_id, org_slug, org_slug, 'draft', 500)
  returning id into new_edition_id;

  for dept in
    select * from (values
      ('oc', 'Organizing Committee'),
      ('procurement', 'Procurement'),
      ('sponsorship', 'Sponsorship & VVIP'),
      ('media', 'Media & Publicity'),
      ('showcase', 'Showcase & Production'),
      ('logistics', 'Logistics'),
      ('youthpreneur', 'Youthpreneur'),
      ('ceo', 'CEO Unit'),
      ('registration', 'Registration'),
      ('registration_area', 'Registration Area')
    ) as t(key, name)
  loop
    insert into departments (edition_id, key, name) values (new_edition_id, dept.key, dept.name);
  end loop;

  return new;
end;
$$;
