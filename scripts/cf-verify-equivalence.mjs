#!/usr/bin/env node
/**
 * cf:verify:equivalence — prove the Worker's raw-SQL path (OPTICSSCOUT_DB_DRIVER=neon-sql)
 * gives the same results as the Prisma path, on the COPY database only.
 *
 * Usage (bash):
 *   CF_EQUIV_DATABASE_URL="$COPY_POOLED_URL" npm run cf:verify:equivalence -- --worktree <dir>
 *   <dir> = a `cf:build:clean --keep` worktree after `opennextjs-cloudflare populateCache`.
 *
 * Safety:
 *   - Refuses to run unless the database host's endpoint id is in ALLOWED_ENDPOINTS (the
 *     opticsscout-copy project). Production and the old database are refused.
 *   - Starts two LOCAL Workers (wrangler dev on 127.0.0.1:8787 = Prisma via neon-http,
 *     127.0.0.1:8788 = neon-sql); never sends a request to any other host.
 *   - Writes exactly 4 ClickEvent rows into the COPY (2 per path, placement prefix
 *     "equiv-<runId>"), reads them back read-only, and stops both Workers.
 *   - The connection string is passed to wrangler as a --var and never printed.
 *
 * Checks: 23 /search queries (empty, spaces, case, %, _, quotes, SQL-looking, HTML, unicode,
 * plurals, no-match) must render identical <main> HTML; GET /api/click for the MidwayUSA
 * offer must give the same 302 Location; unknown/non-existent offers the same 404 + body;
 * POST /api/click-event the same status for valid / unknown / malformed bodies; the
 * inserted ClickEvent rows must match on productId, merchantId, page, placement-suffix,
 * sessionId, with cuid-format ids. Exit 1 on any difference.
 */

import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const ALLOWED_ENDPOINTS = ["ep-patient-shadow-bc0aigjb"]; // opticsscout-copy only

const wtIdx = process.argv.indexOf("--worktree");
const worktree = wtIdx > 0 ? process.argv[wtIdx + 1] : null;
const dbUrl = process.env.CF_EQUIV_DATABASE_URL;
const die = (m) => { console.error("cf:verify:equivalence: " + m); process.exit(2); };
if (!worktree || !fs.existsSync(path.join(worktree, ".open-next", "worker.js"))) die("--worktree <built worktree> required");
if (!dbUrl) die("CF_EQUIV_DATABASE_URL is not set");
let host;
try { host = new URL(dbUrl).hostname; } catch { die("CF_EQUIV_DATABASE_URL is not a URL"); }
const endpoint = host.split(".")[0].replace(/-pooler$/, "");
if (!ALLOWED_ENDPOINTS.includes(endpoint)) die(`refusing: database endpoint "${endpoint}" is not an allowlisted COPY database`);

const require = createRequire(import.meta.url);
const { Client } = require("pg");
const A = "http://127.0.0.1:8787", B = "http://127.0.0.1:8788";
const runId = Date.now().toString(36);
const procs = [];

function startWorker(port, inspector, driver) {
  const args = ["wrangler", "dev", "--port", String(port), "--inspector-port", String(inspector), "--ip", "127.0.0.1",
    "--persist-to", path.join(worktree, `.wrangler-equiv-${port}`), "--var", `DATABASE_URL:${dbUrl}`,
    "--var", `OPTICSSCOUT_DB_DRIVER:${driver}`];
  const p = spawn("npx", args, { cwd: worktree, shell: process.platform === "win32",
    env: { ...process.env, WRANGLER_SEND_METRICS: "false", CI: "1" }, stdio: ["ignore", "pipe", "pipe"] });
  procs.push(p);
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`worker :${port} not ready after 180s`)), 180000);
    const onData = (d) => { if (/Ready on/.test(String(d))) { clearTimeout(t); resolve(); } };
    p.stdout.on("data", onData); p.stderr.on("data", onData);
    p.on("exit", (c) => { clearTimeout(t); reject(new Error(`worker :${port} exited (${c})`)); });
  });
}
// Synchronous: the process exits right after this, so the kill must complete first.
// /T kills the whole tree (npx -> wrangler -> workerd).
function stopWorkers() {
  for (const p of procs) {
    if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(p.pid), "/T", "/F"], { stdio: "ignore" });
    else p.kill("SIGTERM");
  }
}

async function portsClosed() {
  for (const base of [A, B]) {
    try {
      await fetch(base + "/robots.txt", { signal: AbortSignal.timeout(2000) });
      return false;
    } catch {
      // connection refused = closed
    }
  }
  return true;
}

const QUERIES = ["binoculars", "", "   ", "vortex", "VORTEX", "8x42", "rangefinders", "scopes",
  "spotting scope", "Nikon Monarch", "%", "_", "'", "\"", "'; DROP TABLE \"Product\"; --",
  "a&b<c>", "ünïcödé", "x", "best", "vs", "zzzz-no-match", "20-60x", "€$\\"];
const mainOf = (h) => (h.match(/<main[\s\S]*?<\/main>/) || ["NO MAIN"])[0];

let failures = 0;
const check = (ok, msg) => { if (!ok) failures++; console.log(`${ok ? "SAME" : "DIFF"} ${msg}`); };

try {
  console.log(`cf:verify:equivalence: endpoint ${endpoint} allowed; run ${runId}; starting local Workers…`);
  await Promise.all([startWorker(8787, 9230, "neon-http"), startWorker(8788, 9231, "neon-sql")]);

  for (const q of QUERIES) {
    const u = "/search?q=" + encodeURIComponent(q);
    const [ra, rb] = await Promise.all([fetch(A + u), fetch(B + u)]);
    const [ha, hb] = await Promise.all([ra.text(), rb.text()]);
    check(ra.status === rb.status && mainOf(ha) === mainOf(hb),
      `search ${JSON.stringify(q)} ${ra.status}/${rb.status} results=${(mainOf(ha).match(/<li/g) || []).length}`);
  }

  const cookie = { cookie: `anon_session_id=equiv-${runId}` };
  for (const [label, p, suffix] of [
    ["MidwayUSA redirect", "/api/click/product_vortex_ranger_1300/merchant_midwayusa?page=%2Fequiv&placement=equiv-" + runId + "-click-", true],
    ["unknown offer", "/api/click/no_such_product/merchant_midwayusa?page=%2Fx&placement=y", false],
    ["non-existent pair", "/api/click/product_vortex_ranger_1300/merchant_ebay?page=%2Fx&placement=y", false],
  ]) {
    const [ra, rb] = await Promise.all([
      fetch(A + p + (suffix ? "prisma" : ""), { redirect: "manual", headers: cookie }),
      fetch(B + p + (suffix ? "sql" : ""), { redirect: "manual", headers: cookie }),
    ]);
    const [ba, bb] = await Promise.all([ra.text(), rb.text()]);
    check(ra.status === rb.status && ra.headers.get("location") === rb.headers.get("location") && ba === bb,
      `click ${label}: ${ra.status}/${rb.status} location=${ra.headers.get("location")}`);
  }

  for (const [label, body] of [
    ["valid", (s) => JSON.stringify({ productId: "product_vortex_ranger_1300", merchantId: "merchant_midwayusa", page: "/equiv-" + s, placement: `equiv-${runId}-event-${s}` })],
    ["unknown offer", () => JSON.stringify({ productId: "nope", merchantId: "merchant_midwayusa", page: "/x", placement: "y" })],
    ["malformed", () => "{not json"],
  ]) {
    const init = (s) => ({ method: "POST", headers: { "content-type": "application/json", ...cookie }, body: body(s) });
    const [ra, rb] = await Promise.all([fetch(A + "/api/click-event", init("prisma")), fetch(B + "/api/click-event", init("sql"))]);
    check(ra.status === rb.status, `click-event ${label}: ${ra.status}/${rb.status}`);
  }

  // Inserted rows (read-only session)
  const db = new Client({ connectionString: dbUrl });
  await db.connect();
  await db.query("BEGIN READ ONLY");
  const { rows } = await db.query(
    `SELECT id, "productId", "merchantId", page, placement, "sessionId" FROM "ClickEvent" WHERE placement LIKE $1 ORDER BY placement`,
    [`equiv-${runId}-%`]);
  await db.query("ROLLBACK");
  await db.end();
  const norm = (r) => ({ productId: r.productId, merchantId: r.merchantId, sessionId: r.sessionId,
    page: r.page.replace(/-(prisma|sql)$/, ""), placement: r.placement.replace(/-(prisma|sql)$/, "") });
  const byKind = (k) => rows.filter((r) => r.placement.includes(`-${k}-`));
  check(rows.length === 4, `ClickEvent rows written: ${rows.length} (expected 4)`);
  for (const kind of ["click", "event"]) {
    const [p, s] = [byKind(kind).find((r) => r.placement.endsWith("prisma")), byKind(kind).find((r) => r.placement.endsWith("sql"))];
    check(Boolean(p && s) && JSON.stringify(norm(p)) === JSON.stringify(norm(s)), `ClickEvent ${kind} columns equal`);
    check(Boolean(p && s) && /^c[a-z0-9]{24}$/.test(p.id) && /^c[a-z0-9]{24}$/.test(s.id), `ClickEvent ${kind} ids cuid-format`);
  }
} catch (error) {
  failures++;
  console.error("cf:verify:equivalence: " + (error instanceof Error ? error.message : error));
} finally {
  stopWorkers();
  await new Promise((r) => setTimeout(r, 1500));
  if (!(await portsClosed())) {
    failures++;
    console.error("cf:verify:equivalence: local Workers still listening on 8787/8788 — stop them manually");
  } else {
    console.log("cf:verify:equivalence: local Workers stopped");
  }
}
console.log(failures ? `cf:verify:equivalence: FAIL (${failures})` : "cf:verify:equivalence: PASSED");
process.exit(failures ? 1 : 0);
