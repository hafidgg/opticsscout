// Cloudflare Workers entry for OpticsScout. Wraps the OpenNext-generated worker
// (.open-next/worker.js, created by `opennextjs-cloudflare build`).
//
// All hosts:
//   /_next/image -> 404. OpticsScout does not use next/image, and self-hosted Next exposes
//   this endpoint (GHSA-2464-fhr4-w9xw, GHSA-7qx7-33qx-rqx2).
//
// Test hosts only (*.workers.dev, localhost, 127.0.0.1) — unchanged since M3:
//   every Worker response gets "X-Robots-Tag: noindex, nofollow"; /robots.txt disallows all.
//
// Production hosts only (opticsscout.com, www.opticsscout.com) — parity with Vercel as
// measured on 2026-11-19:
//   a. www.opticsscout.com/<path>?<query> -> 308 https://opticsscout.com/<path>?<query>
//   b. Strict-Transport-Security: max-age=63072000 on every Worker response
//   c. Cache-Control "public, max-age=0, must-revalidate" on Worker responses except
//      /api/* and /search (which already match Vercel); static files keep their own
//      caching via the generated assets/_headers (immutable /_next/static).
//   d. Case-insensitive FIRST path segment for the dynamic routes only, like Vercel:
//      /Products/vortex-ranger-1300 serves /products/vortex-ranger-1300 (200, lowercase
//      canonical). The slug stays case-sensitive, paths without a slug and all other
//      routes are untouched, a trailing slash is left to Next's own 308 (which keeps the
//      original case, as on Vercel), and /_next and /api are never rewritten.
//
// Files served directly from the ASSETS binding (/_next/static/*, public/*) do not pass
// through this code.

import handler from "../.open-next/worker.js";
// Workers-only modules, registered for src/lib/db/worker-modules.ts. The app code never
// imports these packages itself, so the Node/Vercel build does not load or bundle them.
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PrismaNeonHttp } from "@prisma/adapter-neon";
import { neon } from "@neondatabase/serverless";

globalThis[Symbol.for("opticsscout.workerModules")] = { getCloudflareContext, PrismaNeonHttp, neon };

const TEST_HOST = /(\.workers\.dev|^localhost|^127\.0\.0\.1)$/;
const APEX = "opticsscout.com";
const WWW = "www.opticsscout.com";
const HSTS = "max-age=63072000";
const HTML_CACHE = "public, max-age=0, must-revalidate";
const CASE_INSENSITIVE_PREFIXES = new Set(["products", "guides", "compare", "best", "categories"]);

/** "/Products/slug" -> "/products/slug"; null when no rewrite applies. */
function lowercaseFirstSegment(pathname) {
  const m = pathname.match(/^\/([^/]+)(\/[^/]+)$/);
  if (!m) return null;
  const lower = m[1].toLowerCase();
  if (lower === m[1] || !CASE_INSENSITIVE_PREFIXES.has(lower)) return null;
  return `/${lower}${m[2]}`;
}

async function serveProduction(request, env, ctx, url) {
  if (url.hostname === WWW) {
    return new Response(null, {
      status: 308,
      headers: {
        Location: `https://${APEX}${url.pathname}${url.search}`,
        "Strict-Transport-Security": HSTS,
        "Cache-Control": HTML_CACHE,
      },
    });
  }

  let upstream = request;
  const rewritten = lowercaseFirstSegment(url.pathname);
  if (rewritten) {
    const target = new URL(url);
    target.pathname = rewritten;
    upstream = new Request(target, request);
  }

  const response = await handler.fetch(upstream, env, ctx);
  const out = new Response(response.body, response);
  out.headers.set("Strict-Transport-Security", HSTS);
  if (!url.pathname.startsWith("/api/") && url.pathname !== "/search") {
    out.headers.set("Cache-Control", HTML_CACHE);
  }
  return out;
}

const worker = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/_next/image" || url.pathname.startsWith("/_next/image/")) {
      return new Response("Not Found", { status: 404, headers: { "Cache-Control": "no-store" } });
    }

    if (url.hostname === APEX || url.hostname === WWW) return serveProduction(request, env, ctx, url);

    if (!TEST_HOST.test(url.hostname)) return handler.fetch(request, env, ctx);

    if (url.pathname === "/robots.txt") {
      return new Response("User-agent: *\nDisallow: /\n", {
        headers: { "Content-Type": "text/plain", "X-Robots-Tag": "noindex, nofollow" },
      });
    }

    const response = await handler.fetch(request, env, ctx);
    const out = new Response(response.body, response);
    out.headers.set("X-Robots-Tag", "noindex, nofollow");
    return out;
  },
};

export default worker;

export * from "../.open-next/worker.js";
