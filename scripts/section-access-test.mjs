#!/usr/bin/env node
/**
 * Automated DB-level checks for the section_access feature
 * (supabase/migrations/0002_section_access.sql).
 *
 * Covers, programmatically: checklist sections 0, 1 (partial), 2, 3a, 3b.
 * Prints a ready-to-paste SQL block for section 4 (RLS impersonation),
 * which needs a raw Postgres session ("set local role") that a
 * service-role PostgREST client cannot do.
 *
 * This script does NOT drive a browser or the Next.js app itself — see the
 * "STILL NEEDS A BROWSER" list it prints at the end.
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   ALICE_USER_ID=<uuid of an existing full-org owner> \
 *   node scripts/section-access-test.mjs
 *
 * Optional:
 *   CLEANUP=true   -- delete all test users/rows this script created when done
 *                     (omit to leave them in place for manual browser checks)
 */

import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ALICE_USER_ID = process.env.ALICE_USER_ID;
const CLEANUP = process.env.CLEANUP === "true";

if (!URL || !SERVICE_KEY || !ALICE_USER_ID) {
  console.error(
    "Missing required env vars. Need NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ALICE_USER_ID."
  );
  process.exit(1);
}

const admin = createClient(URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const results = [];
function record(section, name, pass, detail) {
  results.push({ section, name, pass, detail });
  const mark = pass ? "PASS" : "FAIL";
  console.log(`[${mark}] (${section}) ${name}${detail ? " — " + detail : ""}`);
}

function randEmail(tag) {
  return `sectest-${tag}-${crypto.randomBytes(4).toString("hex")}@example.com`;
}

async function main() {
  console.log("=== Section 0: pre-flight ===");

  const { error: tableErr } = await admin.from("section_access").select("id").limit(1);
  record("0", "section_access table exists and is queryable", !tableErr, tableErr?.message);

  const { data: aliceMembership, error: aliceErr } = await admin
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", ALICE_USER_ID)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  record(
    "0",
    "ALICE_USER_ID resolves to an existing organization_members row",
    !!aliceMembership && !aliceErr,
    aliceErr?.message ?? JSON.stringify(aliceMembership)
  );
  if (!aliceMembership) {
    console.error("Cannot continue without Alice's org — aborting.");
    printSummary(results);
    process.exit(1);
  }

  const { data: aliceEditions, error: editionErr } = await admin
    .from("editions")
    .select("*")
    .eq("organization_id", aliceMembership.organization_id)
    .order("created_at", { ascending: false });
  record("0", "Alice's org has at least one edition", (aliceEditions ?? []).length > 0, editionErr?.message);

  const edition = aliceEditions[0];

  const { data: depts, error: deptErr } = await admin
    .from("departments")
    .select("*")
    .eq("edition_id", edition.id);
  record("0", "edition has 10 departments", (depts ?? []).length === 10, deptErr?.message);

  const byKey = Object.fromEntries((depts ?? []).map((d) => [d.key, d]));
  const logistics = byKey.logistics;
  const sponsorship = byKey.sponsorship;
  const youthpreneur = byKey.youthpreneur;
  record(
    "0",
    "resolved logistics/sponsorship/youthpreneur department ids",
    !!logistics && !!sponsorship && !!youthpreneur
  );

  console.log("\n=== Section 1: regression (DB-level only — see manual list for UI checks) ===");

  const { data: taskCols, error: taskErr } = await admin.from("tasks").select("id").limit(1);
  record("1", "tasks table reachable via service role (baseline)", !taskErr, taskErr?.message);
  console.log(
    "  (Sidebar/UI regression for Alice must be checked by hand — a DB script can't see rendered HTML.)"
  );

  console.log("\n=== Section 2: trigger path (brand-new invited email) ===");

  const email2 = randEmail("trigger");
  const { data: pending2, error: pendingErr2 } = await admin
    .from("section_access")
    .insert({
      edition_id: edition.id,
      department_id: logistics.id,
      email: email2,
      access_level: "viewer",
    })
    .select()
    .single();
  record("2", "pending section_access row created, unclaimed", !pendingErr2 && pending2?.user_id === null, pendingErr2?.message);

  const { count: orgCountBefore } = await admin.from("organizations").select("*", { count: "exact", head: true });

  const { data: inviteData, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email2);
  record("2", "inviteUserByEmail succeeded (auth.users row created, trigger fired)", !inviteErr, inviteErr?.message);
  const newUserId2 = inviteData?.user?.id;

  const { count: orgCountAfter } = await admin.from("organizations").select("*", { count: "exact", head: true });
  record("2", "no new organization created by the trigger", orgCountAfter === orgCountBefore, `before=${orgCountBefore} after=${orgCountAfter}`);

  const { data: newMembership2 } = await admin.from("organization_members").select("*").eq("user_id", newUserId2 ?? "");
  record("2", "no organization_members row for invited user", (newMembership2 ?? []).length === 0);

  const { data: claimed2 } = await admin.from("section_access").select("user_id").eq("email", email2).maybeSingle();
  record("2", "section_access row claimed by the trigger", claimed2?.user_id === newUserId2, `expected ${newUserId2}, got ${claimed2?.user_id}`);

  console.log("\n=== Section 3a: self-heal path (manufactured no-org fixture) ===");

  const email3a = randEmail("selfheal");
  const password3a = crypto.randomBytes(9).toString("base64url");
  const { data: carolCreate, error: carolErr } = await admin.auth.admin.createUser({
    email: email3a,
    password: password3a,
    email_confirm: true,
  });
  record("3a", "test user created (normal signup simulation)", !carolErr, carolErr?.message);
  const carolId = carolCreate?.user?.id;

  const { data: carolMembershipBefore } = await admin.from("organization_members").select("*").eq("user_id", carolId ?? "");
  record("3a", "trigger gave the new user their own org (pre-fixture)", (carolMembershipBefore ?? []).length === 1);

  await admin.from("organization_members").delete().eq("user_id", carolId ?? "");
  const { data: carolMembershipAfter } = await admin.from("organization_members").select("*").eq("user_id", carolId ?? "");
  record("3a", "fixture: org membership stripped (simulating no-org-anywhere)", (carolMembershipAfter ?? []).length === 0);

  const { data: pending3a, error: pendingErr3a } = await admin
    .from("section_access")
    .insert({
      edition_id: edition.id,
      department_id: youthpreneur.id,
      email: email3a.toLowerCase(),
      access_level: "editor",
    })
    .select()
    .single();
  record("3a", "pending section_access row created for existing (now org-less) user", !pendingErr3a && pending3a?.user_id === null, pendingErr3a?.message);
  console.log(
    `  NOTE: whether the self-heal UPDATE in getWorkspace() actually claims this row under RLS (not just via service role) is verified in the printed SQL block below, not here — service-role writes bypass RLS entirely and would pass even if the policy were wrong.`
  );

  console.log("\n=== Section 3b: known gap (existing full-org user, membership kept) ===");

  const email3b = randEmail("dave");
  const password3b = crypto.randomBytes(9).toString("base64url");
  const { data: daveCreate, error: daveErr } = await admin.auth.admin.createUser({
    email: email3b,
    password: password3b,
    email_confirm: true,
  });
  record("3b", "Dave test user created with normal org (membership kept)", !daveErr, daveErr?.message);
  const daveId = daveCreate?.user?.id;

  const { data: daveMembership } = await admin.from("organization_members").select("*").eq("user_id", daveId ?? "");
  record("3b", "Dave has his own organization_members row (unlike Carol)", (daveMembership ?? []).length === 1);

  const { data: pending3b, error: pendingErr3b } = await admin
    .from("section_access")
    .insert({
      edition_id: edition.id,
      department_id: logistics.id,
      email: email3b.toLowerCase(),
      access_level: "viewer",
    })
    .select()
    .single();
  record("3b", "pending section_access row created for Dave", !pendingErr3b && pending3b?.user_id === null, pendingErr3b?.message);
  console.log(
    "  This confirms the DB state matches the documented gap: Dave has both his own org AND an unclaimed grant. getWorkspace() will never claim it for him (code-level gap, not testable via SQL — see prior write-up)."
  );

  console.log("\n=== Section 4 + remaining 3a/3b proof: paste this into the Supabase SQL editor ===\n");
  console.log(
    buildImpersonationSql({
      scopedUserId: newUserId2,
      scopedEmail: email2,
      carolId,
      carolEmail: email3a.toLowerCase(),
      daveId,
      daveEmail: email3b.toLowerCase(),
      editionId: edition.id,
      logisticsId: logistics.id,
      sponsorshipId: sponsorship.id,
    })
  );

  printSummary(results);

  console.log("\n=== Credentials for manual browser verification ===");
  console.log(`Section 3a test user (Carol):  ${email3a}  /  password: ${password3a}`);
  console.log(`Section 3b test user (Dave):   ${email3b}  /  password: ${password3b}`);
  console.log(
    `Section 2 test user:            ${email2}  (invited via real email — check inbox, no password set yet)`
  );

  console.log("\n=== STILL NEEDS A BROWSER (not exercised by this script) ===");
  for (const item of MANUAL_ITEMS) console.log(" - " + item);

  if (CLEANUP) {
    console.log("\nCLEANUP=true — removing test users and section_access rows...");
    for (const id of [newUserId2, carolId, daveId].filter(Boolean)) {
      await admin.auth.admin.deleteUser(id);
    }
    await admin
      .from("section_access")
      .delete()
      .in("email", [email2, email3a.toLowerCase(), email3b.toLowerCase()]);
    console.log("Cleanup done.");
  } else {
    console.log(
      "\nTest fixtures left in place (pass CLEANUP=true to remove them next run). Log in as Carol/Dave above to check the actual UI."
    );
  }
}

function buildImpersonationSql({
  scopedUserId,
  scopedEmail,
  carolId,
  carolEmail,
  daveId,
  daveEmail,
  editionId,
  logisticsId,
  sponsorshipId,
}) {
  return `
-- ============================================================
-- 3a: does RLS actually let Carol claim her own pending row?
-- (Run this BEFORE section 2's later checks reuse the connection —
-- each block is self-contained and rolls back, so order doesn't matter.)
-- ============================================================
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"${carolId}","email":"${carolEmail}"}';

do $$
declare
  affected int;
begin
  update section_access
  set user_id = '${carolId}'
  where user_id is null and lower(email) = lower('${carolEmail}');
  get diagnostics affected = row_count;
  if affected = 1 then
    raise notice 'PASS (3a): scoped user claimed their own pending row under RLS';
  else
    raise notice 'FAIL (3a): expected 1 row claimed, got %', affected;
  end if;
end $$;
rollback; -- undo the claim so it doesn't interfere with anything else you run later

-- ============================================================
-- 3b: RLS *would* allow the same claim for Dave -- proving the gap is in
-- app code (getWorkspace() never issues this UPDATE for him), not RLS.
-- ============================================================
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"${daveId}","email":"${daveEmail}"}';

do $$
declare
  affected int;
begin
  update section_access
  set user_id = '${daveId}'
  where user_id is null and lower(email) = lower('${daveEmail}');
  get diagnostics affected = row_count;
  if affected = 1 then
    raise notice 'INFO (3b): RLS allows this claim fine -- the gap is purely that getWorkspace() never runs this UPDATE for a user who already has organization_members';
  else
    raise notice 'UNEXPECTED (3b): expected 1 row claimable, got %. RLS may be more/less permissive than assumed -- investigate.', affected;
  end if;
end $$;
rollback;

-- ============================================================
-- Section 4: cross-department / cross-permission RLS checks, using the
-- section-2 scoped user (granted Logistics, viewer level, in this edition).
-- ============================================================
set local role authenticated;
set local request.jwt.claims = '{"sub":"${scopedUserId}","email":"${scopedEmail}"}';

do $$
declare
  own_dept_count int;
  other_dept_count int;
  other_dept_meta_count int;
  edition_count int;
begin
  select count(*) into own_dept_count from tasks where department_id = '${logisticsId}';
  select count(*) into other_dept_count from tasks where department_id = '${sponsorshipId}';
  select count(*) into other_dept_meta_count from departments where id = '${sponsorshipId}';
  select count(*) into edition_count from editions where id = '${editionId}';

  raise notice 'INFO (4): own department (logistics) tasks visible: % rows (any count is fine, just no error)', own_dept_count;

  if other_dept_count = 0 then
    raise notice 'PASS (4): other department (sponsorship) tasks correctly hidden';
  else
    raise notice 'FAIL (4): expected 0 rows from sponsorship tasks, got %', other_dept_count;
  end if;

  if other_dept_meta_count = 0 then
    raise notice 'PASS (4): other department (sponsorship) metadata correctly hidden';
  else
    raise notice 'FAIL (4): expected 0 rows from sponsorship department metadata, got %', other_dept_meta_count;
  end if;

  if edition_count = 1 then
    raise notice 'PASS (4): own edition readable (has_edition_access works)';
  else
    raise notice 'FAIL (4): expected 1 edition row, got %', edition_count;
  end if;
end $$;

-- write check: this scoped user is 'viewer' level -- the insert must fail.
-- Run this as its own statement (not inside do $$) so the SQL editor shows
-- the actual permission-denied error rather than swallowing it.
insert into department_records (department_id, kind, title)
values ('${logisticsId}', 'venue_site', 'RLS automated test - viewer should NOT be able to insert this');
-- EXPECT: this statement errors out (new row violates row-level security policy).
-- If it succeeds instead, that is a FAIL -- a viewer-level grant should never write.
`.trim();
}

function printSummary(results) {
  console.log("\n=== Summary ===");
  const bySection = {};
  for (const r of results) {
    bySection[r.section] = bySection[r.section] ?? [];
    bySection[r.section].push(r);
  }
  let totalPass = 0;
  let totalFail = 0;
  for (const [section, rs] of Object.entries(bySection)) {
    const pass = rs.filter((r) => r.pass).length;
    const fail = rs.length - pass;
    totalPass += pass;
    totalFail += fail;
    console.log(`Section ${section}: ${pass}/${rs.length} passed`);
  }
  console.log(`TOTAL: ${totalPass}/${totalPass + totalFail} programmatic checks passed`);
  if (totalFail > 0) {
    console.log("Failures:");
    for (const r of results.filter((r) => !r.pass)) {
      console.log(`  - (${r.section}) ${r.name}${r.detail ? ": " + r.detail : ""}`);
    }
  }
}

const MANUAL_ITEMS = [
  "Section 1 regression: sidebar visually shows all 10 departments + Edition Management for Alice; the 🔐 Access button renders and its modal works; adding a task/budget item actually persists through the UI.",
  "Section 2: the invite email actually arrives in the inbox for the section-2 test address, and clicking its link completes sign-in and lands on /logistics with the sidebar showing only Logistics.",
  "Section 3a/3b: log into the app as Carol and Dave using the printed test credentials — confirm Carol's sidebar shows only Youthpreneur, and confirm Dave still sees his own full org (the gap) rather than anything Logistics-related.",
  "Header edition switcher: confirm it lists only the edition(s) a scoped user has access to, and that the dropdown UI itself renders correctly.",
  "Multi-edition switcher: grant a second edition to the same scoped user, confirm switching editions in the UI correctly re-filters the sidebar.",
  "Revoke: click Remove on a section_access row for a currently logged-in scoped user, reload their page, confirm they're redirected to /login.",
  "participants/checkin_events gap: as a registration_area-scoped user, confirm the check-in UI fails cleanly (not a 500) rather than just checking it in SQL.",
];

main().catch((err) => {
  console.error("Script crashed:", err);
  process.exit(1);
});
