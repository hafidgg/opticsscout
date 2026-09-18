import type { MetadataRoute } from "next";
import { isOnFinalDomain } from "@/lib/seo/metadata";

/**
 * Next.js native robots.txt convention (SEO_STRATEGY.md §3).
 *
 * Disallows /admin and /api unconditionally. Per-page noindex is handled by each
 * route's own <meta name="robots"> via lib/seo/metadata.ts (robotsDirectiveFor) —
 * robots.txt disallow and per-page noindex serve different purposes and both are used:
 * disallow keeps crawlers out of admin/API entirely, while noindex lets a page be
 * crawled (so Google can see the noindex tag and de-list it if previously indexed)
 * without blocking the crawl outright.
 *
 * Ahead of the real domain move, the whole site is disallowed here too (belt-and-
 * suspenders alongside the per-page noindex meta tag from isOnFinalDomain()) — see
 * that function's doc comment for why.
 */
export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  if (!isOnFinalDomain()) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/admin/", "/api/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
