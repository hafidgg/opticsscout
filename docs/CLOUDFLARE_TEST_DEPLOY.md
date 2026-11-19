# Cloudflare Workers TEST deploy (opticsscout-cf-test, workers.dev only)

Test Worker only. Production stays on Vercel. No routes, no custom domain, no DNS.
The Worker reads the COPY database (Neon project `opticsscout-copy`), never production.

## Why this flow

`opennextjs-cloudflare build` copies every `.env*` value into the Worker bundle
(`.open-next/cloudflare/next-env.mjs`). So the bundle is never built in the normal
checkout: `npm run cf:build:clean` builds the committed HEAD in a temporary git
worktree that has no `.env` files, then scans `.open-next` for connection strings and
fails if it finds one. Deploy runs from that same worktree, so wrangler also never sees
a `.env` file.

## Steps (bash)

```bash
# 1. Clean build against the COPY database (URL only in a shell variable, never printed)
export CF_BUILD_DATABASE_URL="<COPY pooled URL>"     # e.g. read from .env.local via node, not echoed
export NEXT_PUBLIC_SITE_URL=https://opticsscout.com   # REQUIRED: canonicals, JSON-LD, sitemap, robots
export AMAZON_ASSOCIATE_TAG=opticsscout06-20          # REQUIRED: baked into every Amazon buy link
# optional, runtime-only (/api/click adapters), unused by current offers:
#   EBAY_CAMPAIGN_ID, ETSY_AFFILIATE_ID, AWIN_PUBLISHER_ID
npm run cf:build:clean -- --keep    # fails if a required var is empty; must print
                                    # "content check PASSED" and "leak scan PASSED"

# 2. From the kept worktree
cd "<worktree path>"
npx opennextjs-cloudflare populateCache remote        # static-assets cache: local copy of .open-next/cache
                                                      # into .open-next/assets/cdn-cgi/_next_cache (no network)
npx wrangler deploy --dry-run --outdir ../os-cf-dry   # review: name, bindings, vars, size
npx wrangler deploy                                   # requires `npx wrangler login` done by the owner

# 3. Database URL as a Worker SECRET (never a var, never in wrangler.toml)
printf %s "$COPY_POOLED_URL" | npx wrangler secret put DATABASE_URL
```

Verification before deploying (read-only GETs; never /api/*):

```bash
# reference: a Vercel-style `next build` in the same worktree (does not touch .open-next),
# candidate: the Worker served locally (`npx wrangler dev`, a fake DATABASE_URL is enough
# for prerendered pages)
npm run cf:verify:pages -- "dir:<worktree>/.next/server/app" "url:http://127.0.0.1:8787"
# optional: against the live site (order-only differences = known unordered queries)
npm run cf:verify:pages -- "url:https://opticsscout.com" "url:http://127.0.0.1:8787"
```

Runtime configuration of the Worker:
- var `OPTICSSCOUT_RUNTIME = "cloudflare-workers"` (wrangler.toml)
- secret `DATABASE_URL` (COPY pooled URL), the only secret
- binding `ASSETS`; `workers_dev = true`, `preview_urls = false`, no routes
- `NEXT_PUBLIC_SITE_URL` is inlined at build time; not needed at runtime
- `AMAZON_ASSOCIATE_TAG` at runtime is only used by `/api/click` for an Amazon offer
  (buy buttons link to Amazon directly with the tag baked in). Not set on the test Worker
  unless approved; see the M4b report.

## Rollback (remove the test Worker)

Owner runs, from any directory where wrangler is logged in:

```bash
npx wrangler delete --name opticsscout-cf-test
```

or in the dashboard: Workers & Pages → opticsscout-cf-test → Settings → Delete.
This removes only that Worker (its versions, secret and workers.dev URL). Nothing else in
the account, the COPY database, Vercel or DNS is affected.
