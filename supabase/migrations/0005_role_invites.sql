-- Let owners/admins invite a brand-new email into organization_members
-- directly (as admin or member -- never owner at creation time), reusing
-- the exact same invite-and-claim pattern section_access already uses for
-- department-scoped access: a pending row has user_id = null until the
-- invited email signs up, at which point handle_new_user() (or getWorkspace()'s
-- self-heal, if they already had an account) claims it by email.

alter table organization_members alter column user_id drop not null;

alter table organization_members add column email text;

update organization_members om
set email = u.email
from auth.users u
where u.id = om.user_id;

alter table organization_members alter column email set not null;

-- Prevent double-inviting the same email into the same org while a pending
-- invite is still unclaimed. Once claimed (user_id set), the existing
-- unique(organization_id, user_id) constraint is the relevant guard.
create unique index organization_members_org_email_pending_idx
  on organization_members (organization_id, lower(email))
  where user_id is null;

-- ============================================================
-- RLS: allow owners/admins to create pending invites, and let an invited
-- user claim their own pending row once they have an account.
-- ============================================================

create policy "owners and admins can invite members" on organization_members
  for insert
  with check (
    is_admin_or_owner(organization_id)
    and role in ('admin', 'member')
  );

create policy "invited user can claim their pending membership" on organization_members
  for update
  using (user_id is null and lower(email) = lower(auth.email()))
  with check (user_id = auth.uid());

-- ============================================================
-- New-user provisioning: also claim a pending organization_members
-- invitation before creating a brand-new organization for this user
-- (mirrors the existing section_access claim below).
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
  matched_members int;
  matched_sections int;
begin
  -- Claim any pending organization_members invitation for this email.
  update organization_members
  set user_id = new.id
  where user_id is null
    and lower(email) = lower(new.email);

  get diagnostics matched_members = row_count;

  -- Claim any pending scoped-access invitations for this email.
  update section_access
  set user_id = new.id
  where user_id is null
    and lower(email) = lower(new.email);

  get diagnostics matched_sections = row_count;

  if matched_members > 0 or matched_sections > 0 then
    -- Invited into an existing org (as a full member and/or scoped user).
    -- Do NOT provision a new organization for this user.
    return new;
  end if;

  insert into organizations (name, slug)
  values (org_slug, org_slug || '-' || substr(md5(random()::text), 1, 4))
  returning id into new_org_id;

  insert into organization_members (organization_id, user_id, role, email)
  values (new_org_id, new.id, 'owner', new.email);

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
