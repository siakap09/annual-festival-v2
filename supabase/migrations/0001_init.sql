-- Annual Showcase portal schema
create extension if not exists pgcrypto;

-- ============================================================
-- Core: organizations, membership, editions, departments
-- ============================================================

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  created_at timestamptz not null default now()
);

create table organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member')),
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table editions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  theme text,
  status text not null default 'draft' check (status in ('draft','active','archived')),
  start_date date,
  end_date date,
  venue text,
  venue_address text,
  target_participants int not null default 500,
  profitability_target_percent numeric not null default 30,
  registration_deadline date,
  test_run_date date,
  enable_waitlist boolean not null default false,
  created_at timestamptz not null default now()
);

create table departments (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references editions(id) on delete cascade,
  key text not null check (key in (
    'oc','procurement','sponsorship','media','showcase',
    'logistics','youthpreneur','ceo','registration','registration_area'
  )),
  name text not null,
  lead_name text,
  created_at timestamptz not null default now(),
  unique (edition_id, key)
);

-- ============================================================
-- OC: tasks, manpower, team access, announcements
-- ============================================================

create table tasks (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references departments(id) on delete cascade,
  title text not null,
  status text not null default 'todo' check (status in ('todo','in_progress','in_review','done')),
  assignee text,
  due_date date,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table manpower (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references departments(id) on delete cascade,
  type text not null default 'internal' check (type in ('internal','external')),
  name text not null,
  role text,
  contact text,
  created_at timestamptz not null default now()
);

create table team_access (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references departments(id) on delete cascade,
  email text not null,
  access_level text not null default 'viewer' check (access_level in ('viewer','editor','lead')),
  created_at timestamptz not null default now()
);

create table announcements (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references editions(id) on delete cascade,
  department_id uuid references departments(id) on delete cascade,
  title text not null,
  body text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Registration: participants + checkpoint check-ins
-- ============================================================

create table participants (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references editions(id) on delete cascade,
  student_name text not null,
  parent_name text not null,
  parent_email text not null,
  parent_phone text not null,
  confirmed boolean not null default false,
  email_sent boolean not null default false,
  qr_token text unique not null default encode(gen_random_bytes(12), 'hex'),
  waitlisted boolean not null default false,
  created_at timestamptz not null default now()
);

create table checkin_events (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id) on delete cascade,
  checkpoint int not null check (checkpoint between 1 and 5),
  checked_in_at timestamptz not null default now(),
  unique (participant_id, checkpoint)
);

-- ============================================================
-- Procurement: budget / revenue / expenses
-- ============================================================

create table budget_items (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references departments(id) on delete cascade,
  edition_id uuid not null references editions(id) on delete cascade,
  type text not null check (type in ('revenue','expense')),
  category text,
  description text not null,
  amount numeric not null default 0,
  status text not null default 'pending' check (status in ('pending','paid')),
  created_at timestamptz not null default now()
);

-- ============================================================
-- Sponsorship & VVIP
-- ============================================================

create table sponsors (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references departments(id) on delete cascade,
  edition_id uuid not null references editions(id) on delete cascade,
  name text not null,
  contact_name text,
  contact_email text,
  stage text not null default 'lead' check (stage in ('lead','contacted','meeting','mou_signed','confirmed','fulfilled')),
  amount numeric not null default 0,
  is_vvip boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

create table vvip_guests (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references departments(id) on delete cascade,
  edition_id uuid not null references editions(id) on delete cascade,
  name text not null,
  title text,
  organization text,
  flagged boolean not null default true,
  created_at timestamptz not null default now()
);

create table sponsor_packages (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references departments(id) on delete cascade,
  edition_id uuid not null references editions(id) on delete cascade,
  name text not null,
  price numeric not null default 0,
  benefits text,
  max_slots int,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Showcase & Production: cue sheet
-- ============================================================

create table cue_blocks (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references departments(id) on delete cascade,
  day int not null default 1,
  start_time text,
  end_time text,
  title text not null,
  performer text,
  notes text,
  position int not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Generic list records used by many simple department tabs
-- (Inventory, Payment Requests, Waitlist, Venue & Site, Loading Bay,
--  Pack Checklist, To-Do List, Long Lead Items, Daily Tasks,
--  Accommodation, Registration Flow, Meals & Refreshment, Products,
--  Booth Assignment, Content Calendar, Press Coverage, Assets,
--  Cross-unit Report notes, Post-Mortem notes, Participant Schedule,
--  Scoring, Stage Checklist, Participant Payments, Categories)
-- ============================================================

create table department_records (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references departments(id) on delete cascade,
  kind text not null,
  title text not null,
  subtitle text,
  amount numeric,
  status text,
  due_date date,
  notes text,
  extra jsonb not null default '{}'::jsonb,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create index department_records_kind_idx on department_records (department_id, kind);

-- ============================================================
-- RLS helper functions
-- ============================================================

create or replace function is_member(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from organization_members m
    where m.organization_id = org_id and m.user_id = auth.uid()
  );
$$;

create or replace function edition_org(ed_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from editions where id = ed_id;
$$;

create or replace function department_org(dept_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select e.organization_id
  from departments d join editions e on e.id = d.edition_id
  where d.id = dept_id;
$$;

create or replace function participant_org(p_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select e.organization_id
  from participants pa join editions e on e.id = pa.edition_id
  where pa.id = p_id;
$$;

-- ============================================================
-- RLS policies
-- ============================================================

alter table organizations enable row level security;
alter table organization_members enable row level security;
alter table editions enable row level security;
alter table departments enable row level security;
alter table tasks enable row level security;
alter table manpower enable row level security;
alter table team_access enable row level security;
alter table announcements enable row level security;
alter table participants enable row level security;
alter table checkin_events enable row level security;
alter table budget_items enable row level security;
alter table sponsors enable row level security;
alter table vvip_guests enable row level security;
alter table sponsor_packages enable row level security;
alter table cue_blocks enable row level security;
alter table department_records enable row level security;

create policy "members can view their org" on organizations
  for select using (is_member(id));

create policy "members can view membership rows" on organization_members
  for select using (is_member(organization_id));

create policy "members can manage editions" on editions
  for all using (is_member(organization_id)) with check (is_member(organization_id));

create policy "members can manage departments" on departments
  for all using (is_member(edition_org(edition_id))) with check (is_member(edition_org(edition_id)));

create policy "members can manage tasks" on tasks
  for all using (is_member(department_org(department_id))) with check (is_member(department_org(department_id)));

create policy "members can manage manpower" on manpower
  for all using (is_member(department_org(department_id))) with check (is_member(department_org(department_id)));

create policy "members can manage team access" on team_access
  for all using (is_member(department_org(department_id))) with check (is_member(department_org(department_id)));

create policy "members can manage announcements" on announcements
  for all using (is_member(edition_org(edition_id))) with check (is_member(edition_org(edition_id)));

create policy "members can manage participants" on participants
  for all using (is_member(edition_org(edition_id))) with check (is_member(edition_org(edition_id)));

create policy "members can manage checkins" on checkin_events
  for all using (is_member(participant_org(participant_id))) with check (is_member(participant_org(participant_id)));

create policy "members can manage budget items" on budget_items
  for all using (is_member(edition_org(edition_id))) with check (is_member(edition_org(edition_id)));

create policy "members can manage sponsors" on sponsors
  for all using (is_member(edition_org(edition_id))) with check (is_member(edition_org(edition_id)));

create policy "members can manage vvip guests" on vvip_guests
  for all using (is_member(edition_org(edition_id))) with check (is_member(edition_org(edition_id)));

create policy "members can manage sponsor packages" on sponsor_packages
  for all using (is_member(edition_org(edition_id))) with check (is_member(edition_org(edition_id)));

create policy "members can manage cue blocks" on cue_blocks
  for all using (is_member(department_org(department_id))) with check (is_member(department_org(department_id)));

create policy "members can manage department records" on department_records
  for all using (is_member(department_org(department_id))) with check (is_member(department_org(department_id)));

-- ============================================================
-- New user provisioning: organization + draft edition + departments
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
begin
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
