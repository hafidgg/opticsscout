#!/usr/bin/env node
/**
 * cf:build:clean — build the Cloudflare Workers bundle in a temporary, clean git worktree.
 *
 * Why: `opennextjs-cloudflare build` copies the values of .env / .env.local / .env.* into
 * .open-next/cloudflare/next-env.mjs, i.e. into the Worker bundle. Building in the normal
 * checkout would embed local secrets (including production connection strings). A fresh
 * worktree of the committed HEAD has no .env files (they are git-ignored), so nothing leaks.
 *
 * Usage (bash):
 *   CF_BUILD_DATABASE_URL="$URL" AMAZON_ASSOCIATE_TAG=opticsscout06-20 \
 *   NEXT_PUBLIC_SITE_URL=https://opticsscout.com npm run cf:build:clean [-- --keep]
 *
 * Build-time variables (the clean worktree has no .env files, so every value the
 * prerendered pages depend on must come from the shell):
 *   CF_BUILD_DATABASE_URL  REQUIRED (secret). Database read for prerendering. Never printed.
 *   NEXT_PUBLIC_SITE_URL   REQUIRED. Inlined by Next: canonicals, JSON-LD, sitemap, robots.
 *                          Must be https://opticsscout.com for a production-identical build.
 *   AMAZON_ASSOCIATE_TAG   REQUIRED. Baked into every Amazon buy link (?tag=...).
 *   EBAY_CAMPAIGN_ID, ETSY_AFFILIATE_ID, AWIN_PUBLISHER_ID
 *                          OPTIONAL, passed through if set. Read only by the /api/click
 *                          adapters at RUNTIME, not by prerendered pages; no current offer
 *                          uses these networks.
 *   --keep                 keep the worktree (to run `wrangler dev` / deploy from it);
 *                          otherwise it is deleted after the checks.
 *
 * After the build the prerendered pages (.open-next/cache) are checked and the build FAILS
 * if any Amazon link lacks ?tag=<AMAZON_ASSOCIATE_TAG> or its exact rel, or if any
 * canonical / sitemap URL uses a host other than NEXT_PUBLIC_SITE_URL's (e.g. localhost).
 *
 * Builds the committed HEAD only: uncommitted changes are NOT included (a warning is shown).
 * After the build, every file under .open-next is scanned; the script exits non-zero if any
 * file contains a connection-string pattern (postgres:// or postgresql:// URLs other than
 * known library placeholders, a neon.tech host, a Neon endpoint id "ep-…", or the literal
 * value / host of CF_BUILD_DATABASE_URL).
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const keep = process.argv.includes("--keep");
const dbUrl = process.env.CF_BUILD_DATABASE_URL;
if (!dbUrl) {
  console.error("cf:build:clean: CF_BUILD_DATABASE_URL is not set (pass it as a shell variable).");
  process.exit(2);
}
let dbHost = "";
try {
  dbHost = new URL(dbUrl).hostname;
} catch {
  console.error("cf:build:clean: CF_BUILD_DATABASE_URL is not a valid URL.");
  process.exit(2);
}

// Non-secret build-time values: required ones must be set and non-empty.
const REQUIRED = ["NEXT_PUBLIC_SITE_URL", "AMAZON_ASSOCIATE_TAG"];
const OPTIONAL = ["EBAY_CAMPAIGN_ID", "ETSY_AFFILIATE_ID", "AWIN_PUBLISHER_ID"];
const missing = REQUIRED.filter((k) => !process.env[k]?.trim());
if (missing.length) {
  console.error(`cf:build:clean: required build variable(s) empty or unset: ${missing.join(", ")}`);
  process.exit(2);
}
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL.trim().replace(/\/$/, "");
const amazonTag = process.env.AMAZON_ASSOCIATE_TAG.trim();
let siteHost;
try {
  siteHost = new URL(siteUrl).host;
} catch {
  console.error("cf:build:clean: NEXT_PUBLIC_SITE_URL is not a valid URL.");
  process.exit(2);
}
console.log(`cf:build:clean: NEXT_PUBLIC_SITE_URL=${siteUrl} AMAZON_ASSOCIATE_TAG=${amazonTag}`);
for (const k of OPTIONAL) {
  console.log(`cf:build:clean: ${k} ${process.env[k] ? "set (passed through)" : "not set (runtime-only; unused by current offers)"}`);
}

const run = (cmd, args, opts = {}) => {
  const r = spawnSync(cmd, args, { stdio: "inherit", shell: process.platform === "win32", ...opts });
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(" ")} failed (exit ${r.status})`);
};
const git = (args, cwd) => spawnSync("git", args, { cwd, encoding: "utf8" });

const repo = git(["rev-parse", "--show-toplevel"]).stdout.trim();
const head = git(["rev-parse", "--short", "HEAD"], repo).stdout.trim();
if (git(["status", "--porcelain", "--untracked-files=no"], repo).stdout.trim()) {
  console.warn("cf:build:clean: WARNING: uncommitted changes are not part of this build (HEAD only).");
}

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "os-cf-"));
let failed = false;
try {
  run("git", ["worktree", "add", "--detach", dir, "HEAD"], { cwd: repo });
  const envFiles = fs.readdirSync(dir).filter((f) => f.startsWith(".env") || f.startsWith(".dev.vars"));
  if (envFiles.length) throw new Error(`clean worktree unexpectedly contains: ${envFiles.join(", ")}`);
  console.log(`cf:build:clean: building ${head} in ${dir}`);

  const env = {
    ...process.env,
    DATABASE_URL: dbUrl,
    NEXT_PUBLIC_SITE_URL: siteUrl,
    AMAZON_ASSOCIATE_TAG: amazonTag,
    NEXT_TELEMETRY_DISABLED: "1",
  };
  delete env.CF_BUILD_DATABASE_URL;
  const t0 = Date.now();
  run("npm", ["ci", "--no-audit", "--no-fund"], { cwd: dir, env });
  run("npx", ["prisma", "generate"], { cwd: dir, env });
  run("npx", ["opennextjs-cloudflare", "build"], { cwd: dir, env });
  console.log(`cf:build:clean: build finished in ${Math.round((Date.now() - t0) / 1000)}s`);

  // Static-asset headers for the production hosts (Workers static assets `_headers`; does
  // not apply to Worker-generated responses, which cloudflare/worker.js handles). Written
  // into the build output, never into public/ (Vercel would serve public/_headers as a file).
  // Parity with Vercel (2026-11-19): /_next/static immutable for a year, HSTS 2 years.
  const headersFile = [
    "# Generated by scripts/cf-build-clean.mjs. Production hosts only; workers.dev unchanged.",
    ...["https://opticsscout.com", "https://www.opticsscout.com"].flatMap((origin) => [
      `${origin}/_next/static/*`,
      "  Cache-Control: public,max-age=31536000,immutable",
      `${origin}/*`,
      "  Strict-Transport-Security: max-age=63072000",
    ]),
    "",
  ].join("\n");
  fs.writeFileSync(path.join(dir, ".open-next", "assets", "_headers"), headersFile);
  console.log("cf:build:clean: wrote .open-next/assets/_headers (production hosts only)");

  // ---- leak scan ---------------------------------------------------------------------
  // Library placeholders that are not credentials:
  //   postgres://base        pg-connection-string (base URL for parsing)
  //   postgresql://-         @neondatabase/serverless (default connection-string placeholder)
  // plus template-literal code such as `postgresql://${encode(user)}:...` (starts with "${").
  const ALLOWED_URL_LITERALS = new Set(["postgres://base", "postgresql://-"]);
  const isTemplateCode = (s) => /^postgres(?:ql)?:\/\/\$\{/.test(s);
  const patterns = [
    { name: "postgres URL", re: /(?<![+\w])postgres(?:ql)?:\/\/[^\s"'`)\\]*/g },
    { name: "neon.tech host", re: /[a-z0-9.-]*neon\.tech/gi },
    { name: "Neon endpoint id", re: /\bep-[a-z]+-[a-z]+-[a-z0-9]{6,}\b/g },
  ];
  const hits = [];
  const seen = new Set();
  const walk = (d) => {
    const real = fs.realpathSync(d);
    if (seen.has(real)) return; // symlinked directories (pnpm-style node_modules) once only
    seen.add(real);
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      let st;
      try {
        st = fs.statSync(p); // follows symlinks
      } catch {
        continue; // dangling symlink
      }
      if (st.isDirectory()) walk(p);
      else {
        const text = fs.readFileSync(p).toString("latin1");
        for (const { name, re } of patterns) {
          for (const m of text.matchAll(re)) {
            if (name === "postgres URL" && (ALLOWED_URL_LITERALS.has(m[0]) || isTemplateCode(m[0]))) continue;
            hits.push(`${path.relative(dir, p)}: ${name}`);
          }
        }
        if (text.includes(dbUrl) || (dbHost && text.includes(dbHost))) {
          hits.push(`${path.relative(dir, p)}: value/host of CF_BUILD_DATABASE_URL`);
        }
      }
    }
  };
  walk(path.join(dir, ".open-next"));
  const nextEnv = fs.readFileSync(path.join(dir, ".open-next/cloudflare/next-env.mjs"), "utf8");
  if (!/production = \{\};/.test(nextEnv)) hits.push(".open-next/cloudflare/next-env.mjs: not empty");

  // ---- prerendered-content check (what will actually be served from the cache) -------
  const contentProblems = [];
  let amazonLinks = 0, canonicals = 0, sitemapLocs = 0;
  const expectedAmazon = new RegExp(`^https://www\\.amazon\\.com/dp/[A-Z0-9]{10}\\?tag=${amazonTag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`);
  const cacheFiles = [];
  const walkCache = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walkCache(p);
      else if (p.endsWith(".cache")) cacheFiles.push(p);
    }
  };
  walkCache(path.join(dir, ".open-next", "cache"));
  for (const f of cacheFiles) {
    const rel = path.relative(path.join(dir, ".open-next", "cache"), f);
    const entry = JSON.parse(fs.readFileSync(f, "utf8"));
    const html = typeof entry.html === "string" ? entry.html : "";
    for (const a of html.match(/<a\b[^>]*>/g) ?? []) {
      const href = (a.match(/href="([^"]*)"/) ?? [])[1] ?? "";
      if (!/amazon\./i.test(href)) continue;
      amazonLinks++;
      const relAttr = (a.match(/rel="([^"]*)"/) ?? [])[1] ?? "";
      const decoded = href.replace(/&amp;/g, "&");
      if (!expectedAmazon.test(decoded)) contentProblems.push(`${rel}: Amazon href "${decoded}"`);
      if (relAttr !== "sponsored nofollow noopener") contentProblems.push(`${rel}: Amazon rel "${relAttr}"`);
    }
    for (const m of html.matchAll(/<link rel="canonical" href="([^"]*)"/g)) {
      canonicals++;
      if (new URL(m[1]).host !== siteHost) contentProblems.push(`${rel}: canonical ${m[1]}`);
    }
    if (/localhost:3000/.test(html)) contentProblems.push(`${rel}: contains localhost:3000`);
    if (rel.endsWith("sitemap.xml.cache")) {
      for (const m of String(entry.body).matchAll(/<loc>([^<]*)<\/loc>/g)) {
        sitemapLocs++;
        if (new URL(m[1]).host !== siteHost) contentProblems.push(`sitemap: ${m[1]}`);
      }
      if (sitemapLocs === 0) contentProblems.push("sitemap: no <loc> entries");
    }
  }
  if (amazonLinks === 0) contentProblems.push("no Amazon links found in any prerendered page");
  if (contentProblems.length) {
    failed = true;
    console.error(`cf:build:clean: FAIL — ${contentProblems.length} prerendered-content problem(s):`);
    for (const p of contentProblems.slice(0, 50)) console.error("  " + p);
  } else {
    console.log(
      `cf:build:clean: content check PASSED (${cacheFiles.length} cached entries; ${amazonLinks} Amazon links all ` +
        `?tag=${amazonTag} + rel="sponsored nofollow noopener"; ${canonicals} canonicals and ${sitemapLocs} sitemap URLs on ${siteHost})`,
    );
  }

  if (hits.length) {
    failed = true;
    console.error(`cf:build:clean: FAIL — ${hits.length} connection-string match(es) in .open-next:`);
    for (const h of [...new Set(hits)].slice(0, 50)) console.error("  " + h);
  } else {
    console.log("cf:build:clean: leak scan PASSED (no connection-string patterns in .open-next)");
  }
} catch (error) {
  failed = true;
  console.error("cf:build:clean: " + (error instanceof Error ? error.message : error));
} finally {
  if (keep && !failed) {
    console.log(`cf:build:clean: worktree kept at ${dir} (remove later with: git worktree remove --force "${dir}")`);
  } else {
    fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3 });
    git(["worktree", "prune"], repo);
    console.log("cf:build:clean: temporary worktree removed");
  }
}
process.exit(failed ? 1 : 0);
