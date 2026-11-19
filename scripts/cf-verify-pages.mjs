#!/usr/bin/env node
/**
 * cf:verify:pages — compare the 5 reference pages + sitemap between two sources and FAIL
 * on any difference. Read-only: plain GETs of HTML/XML (never /api/*, never buy links).
 *
 * Usage: node scripts/cf-verify-pages.mjs <reference> <candidate> [--host opticsscout.com]
 *   a source is either  dir:<path to .next/server/app>   (a Vercel-style `next build`)
 *                   or  url:<base URL>                     (local Worker, workers.dev, live site)
 *
 * Checked per page: the LITERAL Amazon <a> tags (full href string incl. ?tag=..., and rel),
 * which must also match https://www.amazon.com/dp/<ASIN>?tag=<tag> + rel="sponsored nofollow
 * noopener"; title, meta description, canonical, meta robots, visible text, every link
 * (href | rel). Sitemap: identical <loc>/<lastmod> entries (as a set and in order) and every
 * <loc> on the expected host. Order-only differences are reported separately (known
 * unordered-query effect) but still count as a failure.
 */

import fs from "node:fs";
import path from "node:path";

const [refArg, candArg] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const hostIdx = process.argv.indexOf("--host");
const expectHost = hostIdx > 0 ? process.argv[hostIdx + 1] : "opticsscout.com";
const tagIdx = process.argv.indexOf("--tag");
const expectTag = tagIdx > 0 ? process.argv[tagIdx + 1] : "opticsscout06-20";
if (!refArg || !candArg) {
  console.error("usage: cf-verify-pages.mjs <dir:...|url:...> <dir:...|url:...> [--host h] [--tag t]");
  process.exit(2);
}

const PAGES = {
  "/": "index.html",
  "/categories/rangefinders": "categories/rangefinders.html",
  "/best/rangefinders-under-500": "best/rangefinders-under-500.html",
  "/guides/birding-spotting-scope-specs-explained": "guides/birding-spotting-scope-specs-explained.html",
  "/products/vortex-ranger-1300": "products/vortex-ranger-1300.html",
};

async function load(source, route, file) {
  if (source.startsWith("dir:")) return fs.readFileSync(path.join(source.slice(4), file), "utf8");
  const r = await fetch(source.slice(4).replace(/\/$/, "") + route, {
    redirect: "manual",
    signal: AbortSignal.timeout(30000),
  });
  if (r.status !== 200) throw new Error(`${source}${route} -> HTTP ${r.status}`);
  return r.text();
}

const dec = (s) =>
  s.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
function extract(html) {
  const g = (re) => (html.match(re) ?? [])[1] ?? null;
  const tags = html.match(/<a\b[^>]*>/g) ?? [];
  const attr = (a, n) => (a.match(new RegExp(`${n}="([^"]*)"`)) ?? [])[1] ?? "";
  return {
    title: g(/<title>([^<]*)/),
    description: g(/<meta name="description" content="([^"]*)"/),
    canonical: g(/<link rel="canonical" href="([^"]*)"/),
    robots: g(/<meta name="robots" content="([^"]*)"/),
    text: dec(html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " "))
      .replace(/\s+/g, " ")
      .trim(),
    links: tags.map((a) => `${dec(attr(a, "href"))} | ${attr(a, "rel")}`),
    amazon: tags.filter((a) => /amazon\./i.test(attr(a, "href"))).map((a) => `href="${attr(a, "href")}" rel="${attr(a, "rel")}"`),
  };
}

const problems = [];
const amazonRe = new RegExp(`^href="https://www\\.amazon\\.com/dp/[A-Z0-9]{10}\\?tag=${expectTag}" rel="sponsored nofollow noopener"$`);

for (const [route, file] of Object.entries(PAGES)) {
  const a = extract(await load(refArg, route, file));
  const b = extract(await load(candArg, route, file));
  const diffs = [];
  for (const k of ["title", "description", "canonical", "robots", "text", "links", "amazon"]) {
    if (JSON.stringify(a[k]) === JSON.stringify(b[k])) continue;
    const orderOnly = Array.isArray(a[k]) && JSON.stringify([...a[k]].sort()) === JSON.stringify([...b[k]].sort());
    diffs.push(orderOnly ? `${k} (order only)` : k);
  }
  for (const tag of b.amazon) if (!amazonRe.test(tag)) diffs.push(`bad Amazon tag: ${tag}`);
  if (b.canonical && new URL(b.canonical).host !== expectHost) diffs.push(`canonical host ${b.canonical}`);
  console.log(
    `${route.padEnd(50)} ${diffs.length ? "DIFF: " + diffs.join(", ") : "identical"} | amazon ${a.amazon.length}/${b.amazon.length} | canonical ${b.canonical}`,
  );
  for (const t of b.amazon) console.log(`    ${t}`);
  if (diffs.length) problems.push(`${route}: ${diffs.join(", ")}`);
}

const sm = (xml) => [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => m[1].replace(/\s+/g, " ").trim());
const sa = sm(await load(refArg, "/sitemap.xml", "sitemap.xml.body"));
const sb = sm(await load(candArg, "/sitemap.xml", "sitemap.xml.body"));
const locs = sb.map((u) => (u.match(/<loc>([^<]*)<\/loc>/) ?? [])[1]);
const badHost = locs.filter((l) => !l || new URL(l).host !== expectHost);
const sameOrder = JSON.stringify(sa) === JSON.stringify(sb);
const sameSet = JSON.stringify([...sa].sort()) === JSON.stringify([...sb].sort());
console.log(`sitemap: ${sa.length}/${sb.length} entries | same set: ${sameSet} | same order: ${sameOrder} | hosts not ${expectHost}: ${badHost.length}`);
if (!sameSet || !sameOrder || badHost.length || sb.length === 0) problems.push("sitemap differs");

if (problems.length) {
  console.error(`cf:verify:pages: FAIL (${problems.length}): ${problems.join("; ")}`);
  process.exit(1);
}
console.log("cf:verify:pages: PASSED");
