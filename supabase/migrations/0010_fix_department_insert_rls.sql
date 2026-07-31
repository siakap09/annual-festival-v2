-- Bug: "owners manage departments" checked is_owner(department_org(id)),
-- and department_org(dept_id) looks up the organization by querying the
-- departments table for that row's own id. During an INSERT, the row
-- doesn't exist yet at check-time, so the lookup returns null and
-- is_owner(null) is false -- Postgres silently rejects every department
-- insert an owner makes (createEdition, copyEdition), regardless of who
-- they are. Only the very first edition per organization (seeded by
-- handle_new_user(), which runs as security definer and bypasses RLS
-- entirely) was ever unaffected.
--
-- Fix: check ownership via edition_org(edition_id) instead -- edition_id
-- is a plain column on the row being inserted, so this doesn't depend on
-- the row already existing. This is the same pattern already used by
-- every other department-content table's policies (tasks, manpower, etc).
drop policy if exists "owners manage departments" on departments;

create policy "owners manage departments" on departments
  for all
  using (is_owner(edition_org(edition_id)))
  with check (is_owner(edition_org(edition_id)));

-- Data repair: any edition created via createEdition()/copyEdition() before
-- this fix silently ended up with zero department rows (the insert was
-- rejected by the buggy policy above, and the app code didn't check the
-- error). Backfill the standard 10 departments for any edition missing
-- them -- safe to run multiple times, only inserts what's not already there.
insert into departments (edition_id, key, name)
select e.id, d.key, d.name
from editions e
cross join (
  values
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
) as d(key, name)
where not exists (
  select 1 from departments dep where dep.edition_id = e.id and dep.key = d.key
);
