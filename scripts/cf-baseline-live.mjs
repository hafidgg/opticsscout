#!/usr/bin/env node
/**
 * cf:baseline:live — save a read-only baseline of the LIVE site before the cutover, for the
 * post-switch comparison (docs/CLOUDFLARE_CUTOVER_PLAN.md §5).
 *
 * Usage: npm run cf:baseline:live [-- --out <dir outside the repo>]
 *   default out: C:\Users\lenovo\opticsscout-backup\live-baseline-<UTC timestamp>
 *
 * Fetches https://opticsscout.com/sitemap.xml, then every <loc> URL, plus /robots.txt and
 * /sitemap.xml themselves: GET only, at most 1 request per second, redirects not followed,
 * never anything under /api/. For each URL it writes <n>.html (body) and <n>.json (URL,
 * status, all response headers, fetch time) and an index.json.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ORIGIN = "https://opticsscout.com";
const repo = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const outIdx = process.argv.indexOf("--out");
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const out = path.resolve(outIdx > 0 ? process.argv[outIdx + 1]
  : path.join(os.homedir(), "opticsscout-backup", `live-baseline-${stamp}`));
if ((out + path.sep).toLowerCase().startsWith((repo + path.sep).toLowerCase())) {
  console.error(`cf:baseline:live: refusing to write inside the repo (${out})`);
  process.exit(2);
}
fs.mkdirSync(out, { recursive: true });

let last = 0;
async function get(url) {
  const u = new URL(url);
  if (u.origin !== ORIGIN) throw new Error(`refusing non-${ORIGIN} URL: ${url}`);
  if (u.pathname.startsWith("/api/") || u.pathname === "/api") throw new Error(`refusing /api URL: ${url}`);
  const wait = 1000 - (Date.now() - last);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  last = Date.now();
  const r = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(30000) });
  const headers = {};
  r.headers.forEach((v, k) => (headers[k] = v));
  return { status: r.status, headers, body: await r.text() };
}

const sitemap = await get(`${ORIGIN}/sitemap.xml`);
const locs = [...sitemap.body.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
const urls = [`${ORIGIN}/robots.txt`, `${ORIGIN}/sitemap.xml`, ...locs];
const index = [];
for (const [i, url] of urls.entries()) {
  const res = url.endsWith("/sitemap.xml") ? sitemap : await get(url);
  const name = String(i).padStart(3, "0");
  fs.writeFileSync(path.join(out, `${name}.html`), res.body);
  fs.writeFileSync(path.join(out, `${name}.json`),
    JSON.stringify({ url, status: res.status, headers: res.headers, fetchedAt: new Date().toISOString() }, null, 2));
  index.push({ file: name, url, status: res.status });
  console.log(`${name} ${res.status} ${url}`);
}
fs.writeFileSync(path.join(out, "index.json"), JSON.stringify({ origin: ORIGIN, createdAt: new Date().toISOString(), count: index.length, entries: index }, null, 2));
console.log(`cf:baseline:live: saved ${index.length} responses to ${out}`);
