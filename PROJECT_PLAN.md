# PROJECT_PLAN.md

## 1. Repository Inspection Result

**Status: NEW PROJECT.** No existing repository, code, or prior work was found. This is a
greenfield build. `create-next-app` was used to scaffold the base (Next.js 16, App Router,
TypeScript, Tailwind v4, ESLint) with no destructive risk since nothing pre-existed.

## 2. What This Project Is

An SEO-first Product Discovery & Comparison Platform. It does not sell anything directly,
hold inventory, or process payments. It helps users decide *what* to buy and *where* to buy
it, and monetizes through affiliate commissions and display advertising.

Core loop:

```
SEO traffic → useful research/comparison → affiliate click → merchant conversion
                                          → ad impression revenue
```

## 2a. Phase 4 — Niche Discovery (2026-09-06)

Following Phase 3, a dedicated research-only phase (no code/schema/content changes)
evaluated 10 candidate niches against real search evidence. Full detail in
`docs/NICHE_RESEARCH.md`. **Recommendation: Birding & Spotting Optics** as the niche
to test first, based on a verified SERP with no large-media competition and a real,
official multi-network affiliate program match (OpticsPlanet via AWIN/AvantLink/
Impact). Home Office & Ergonomic Gear (Section 3 below) is downgraded from "working
MVP niche" to **KEEP AS BACKUP** — nothing about it was invalidated, but the optics
research surfaced a clearly stronger competitive position. No architecture, schema,
or application code was changed as part of this decision; the platform's generic
Product/Offer/Merchant/Comparison/Guide model applies to either niche unmodified.
Next action, pending explicit approval: begin real content research for the
Birding Optics sub-niche opportunities listed in `docs/NICHE_RESEARCH.md` Section 16 —
no bulk page generation until that approval is given.

## 3. MVP Niche Decision (historical — see Section 2a for current status)

**Selected niche: Home Office & Ergonomic Workspace Gear**
(desks, chairs, monitor arms, keyboards/mice, lighting, desk organization, ergonomic
accessories).

Rejected alternatives and why:

- **Consumer electronics / gadgets** — highest competition tier, dominated by large
  established review outlets (Wirecutter, RTINGS, The Verge); very hard to gain SERP
  visibility as a new domain.
- **Health & wellness / supplements** — YMYL (Your Money or Your Life) category under
  intense Google scrutiny, real legal/medical liability, and the affiliate ecosystem
  favors recurring-commission SaaS/insurance rather than Amazon/eBay/Etsy physical goods
  which is our stated initial ecosystem.
- **Digital nomad / remote work lifestyle** — real signal, but monetization leans on
  SaaS/finance affiliate programs (Wise, SafetyWing, Monday.com), not the
  Amazon/eBay/Etsy/Awin stack this project is built around.
- **Fashion / beauty** — high competition, low product-spec differentiation (harder to
  build genuine spec-based comparisons, more subjective/trend-driven).

Why home office & ergonomic gear fits the stated model:

- **Two-network story for core furniture, plus a distinct Etsy content angle.**
  Standing desks and chairs are sold on Amazon and eBay — the same mass-produced SKUs
  genuinely appear on both, which is what the Product/Offer/Merchant abstraction
  (Section 8 of the brief) is for. Etsy's presence in this category is real but is a
  **different sub-market**, not a third price point on the same product: Etsy desk
  listings are overwhelmingly custom/handmade (live-edge wood, made-to-order
  dimensions), not the mass-produced electric desks Amazon/eBay carry. Etsy fits this
  niche as its own content angle (decor, artisanal accessories, made-to-order pieces)
  rather than as a same-SKU price comparator alongside Amazon/eBay. **Corrected
  2026-09-06 after live market research — see NICHE_VALIDATION.md, which also flags
  that "best standing desk"-tier head terms are dominated by large media outlets
  (Wirecutter/NYT, TechRadar, Tom's Guide) and that Amazon's furniture commission
  rate is inconsistently reported across sources (3%–10%) and has been cut
  industry-wide once before without much notice.**
- **Comparison-native intent.** "Standing desk vs sit-stand converter", "ergonomic chair
  under $300", "best monitor arm for dual monitors" are real, spec-driven, non-trend
  search queries — a natural fit for `/compare` and `/best` page types without inventing
  content.
- **Mid ticket size ($50–$800).** Enough for meaningful commission per conversion without
  requiring the trust threshold of $1000+ purchases (e.g. laptops, appliances).
- **Evergreen, not seasonal.** Demand doesn't collapse outside a holiday window (unlike
  "best gifts for X" categories on their own).
- **AdSense-safe.** No YMYL, no restricted categories (weapons, supplements, adult, etc.).
- **Solo-operable content model.** Editorial comparisons can be built honestly from
  published specifications (dimensions, weight capacity, adjustability range, materials)
  without requiring hands-on testing claims — consistent with Section 16's honesty
  requirement.

This choice is documented per Section 36 requirement to justify the niche before building
the vertical slice.

## 4. Build Phases

**Phase 0 — Foundation (this phase)**
- Repository inspection (done — none existed)
- Six planning documents (this file + ARCHITECTURE, DATA_MODEL, SEO_STRATEGY,
  MONETIZATION, TODO)
- Next.js + TypeScript + Tailwind + Prisma + Zod scaffold
- Prisma schema (Product, Offer, Merchant, Comparison, Guide, Category, SourceRecord)
- Environment variable convention for affiliate IDs (unset-safe)

**Phase 1 — Core data + affiliate abstraction**
- Prisma migrations against a local/dev Postgres
- Mock data provider layer (no scraping, no fake data — clearly labeled seed/mock data)
- Merchant adapter interface + Amazon/eBay/Etsy/Awin stub adapters
- Centralized `getAffiliateUrl()` service + env-based config
- Affiliate click redirect route with first-party tracking

**Phase 2 — SEO foundation + Quality Gate**
- Dynamic metadata, canonical URLs, robots, sitemap
- Structured data (Product, Offer, BreadcrumbList, Article, FAQ)
- Quality Gate service + page status enum (DRAFT/REVIEW/READY/INDEXABLE/NOINDEX/ARCHIVED)

**Phase 3 — Core UI + routes**
- Homepage, category pages, product pages, compare pages, best pages, guides, search
- Internal linking engine
- AdSense placeholder slots

**Phase 4 — Testing & validation**
- Unit/integration tests for affiliate URLs, quality gate, sitemap, schema, routes
- Type check, lint, production build
- SEO_AUDIT.md, MONETIZATION_AUDIT.md, FINAL_STATUS.md

## 5. Explicit Non-Goals for MVP

- No admin UI beyond a minimal protected scaffold (Section 28 says don't overbuild)
- No live merchant API integrations (all adapters run in mock mode until real credentials
  are supplied — labeled `BLOCKED — EXTERNAL CREDENTIAL REQUIRED`)
- No AI-generated bulk page creation without passing the Quality Gate
- No categories beyond home-office/ergonomic gear in the MVP vertical

## 6. Status Legend Used Throughout This Project

`PASS` `FAIL` `BLOCKED` `NOT_IMPLEMENTED` — per Section 42/45 requirement, no work is
described as complete without verification evidence.
