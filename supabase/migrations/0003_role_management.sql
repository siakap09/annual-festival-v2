-- Org-level role management: let owners change any member's role (including
-- granting/revoking owner status), and let admins manage non-owner members
-- between admin and member -- admins can never touch or create an owner row.
--
-- Last-owner protection (an org must always keep at least one owner) is
-- enforced in the application layer (app/actions/roleManagement.ts), not
-- here -- it's a business-rule aggregate check across sibling rows, not a
-- per-row authorization boundary, so it belongs with the other app-level
-- guards (same split used for section_access's edition/department checks).

create or replace function is_owner(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from organization_members m
    where m.organization_id = org_id and m.user_id = auth.uid() and m.role = 'owner'
  );
$$;

create or replace function is_admin_or_owner(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from organization_members m
    where m.organization_id = org_id and m.user_id = auth.uid() and m.role in ('admin','owner')
  );
$$;

-- Owners: full control over any membership row in their org, including
-- setting/removing owner status.
create policy "owners can update any membership role" on organization_members
  for update
  using (is_owner(organization_id))
  with check (is_owner(organization_id));

create policy "owners can remove members" on organization_members
  for delete
  using (is_owner(organization_id));

-- Admins: can update/remove members, but never a row that is currently an
-- owner (using clause), and can never set a role to owner (with check
-- clause references the proposed new row).
create policy "admins can update non-owner membership roles" on organization_members
  for update
  using (is_admin_or_owner(organization_id) and role <> 'owner')
  with check (is_admin_or_owner(organization_id) and role <> 'owner');

create policy "admins can remove non-owner members" on organization_members
  for delete
  using (is_admin_or_owner(organization_id) and role <> 'owner');
