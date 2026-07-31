#!/usr/bin/env node
/**
 * HTTP-level smoke test: hits the app's key routes and checks they respond
 * sanely (no 500s, expected redirect/content) rather than exercising any
 * specific feature's business logic. Meant to run against a live server --
 * `npm run dev`, `npm run preview` (wrangler pages dev), or a deployed URL.
 *
 * Usage:
 *   BASE_URL=http://localhost:3000 node scripts/smoke-test.mjs
 *   BASE_URL=http://localhost:3000 DEMO_MODE=true node scripts/smoke-test.mjs
 *
 * DEMO_MODE controls what's expected from the protected dashboard routes:
 *   - true  (matches NEXT_PUBLIC_DEMO_MODE=true) -> expect 200 with demo content
 *   - false (default)                            -> expect a redirect to /login
 */

const BASE_URL = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const DEMO_MODE = process.env.DEMO_MODE === "true";

const PUBLIC_ROUTES = ["/", "/login"];

const PROTECTED_ROUTES = [
  "/editions",
  "/oc",
  "/procurement",
  "/sponsorship",
  "/media",
  "/showcase",
  "/logistics",
  "/youthpreneur",
  "/ceo",
  "/registration",
  "/registration-area",
  "/role-management",
];

const results = [];
function record(name, pass, detail) {
  results.push({ name, pass, detail });
  console.log(`[${pass ? "PASS" : "FAIL"}] ${name}${detail ? " — " + detail : ""}`);
}

async function fetchNoRedirect(path) {
  return fetch(`${BASE_URL}${path}`, { redirect: "manual" });
}

async function checkPublicRoute(path) {
  try {
    const res = await fetch(`${BASE_URL}${path}`);
    record(`GET ${path}`, res.status === 200, `status ${res.status}`);
  } catch (err) {
    record(`GET ${path}`, false, err instanceof Error ? err.message : String(err));
  }
}

async function checkProtectedRoute(path) {
  try {
    const res = await fetchNoRedirect(path);
    if (DEMO_MODE) {
      record(`GET ${path} (demo mode)`, res.status === 200, `status ${res.status}`);
      return;
    }
    const isRedirectToLogin =
      res.status >= 300 && res.status < 400 && (res.headers.get("location") ?? "").includes("/login");
    record(`GET ${path} (unauthenticated -> /login)`, isRedirectToLogin, `status ${res.status}, location=${res.headers.get("location")}`);
  } catch (err) {
    record(`GET ${path}`, false, err instanceof Error ? err.message : String(err));
  }
}

async function main() {
  console.log(`Smoke testing ${BASE_URL} (DEMO_MODE=${DEMO_MODE})\n`);

  for (const path of PUBLIC_ROUTES) await checkPublicRoute(path);
  for (const path of PROTECTED_ROUTES) await checkProtectedRoute(path);

  const passed = results.filter((r) => r.pass).length;
  console.log(`\n${passed}/${results.length} checks passed`);

  if (passed < results.length) {
    console.log("Failures:");
    for (const r of results.filter((r) => !r.pass)) {
      console.log(`  - ${r.name}: ${r.detail}`);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Smoke test crashed:", err);
  process.exit(1);
});
