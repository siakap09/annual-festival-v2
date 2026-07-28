-- Renames the "Registration Area" department display label to "Booth Area"
-- everywhere it's stored as data. This is display-label only: the
-- department's key ('registration_area') and the /registration-area route
-- are untouched.

-- Existing editions already have a departments row with the old label baked
-- in -- fix that data directly.
update departments set name = 'Booth Area' where key = 'registration_area' and name = 'Registration Area';

-- handle_new_user() seeds a brand-new org's departments from a hardcoded
-- list (not from the app's lib/constants.ts), so new orgs would otherwise
-- keep getting the old label. Redefined here with ONLY that one string
-- literal changed -- the claim-invite logic above it is untouched.
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
      ('registration_area', 'Booth Area')
    ) as t(key, name)
  loop
    insert into departments (edition_id, key, name) values (new_edition_id, dept.key, dept.name);
  end loop;

  return new;
end;
$$;
