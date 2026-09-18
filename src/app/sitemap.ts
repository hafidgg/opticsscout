import type { MetadataRoute } from "next";
import {
  getIndexableProductPaths,
  getIndexableComparisonPaths,
  getIndexableGuidePaths,
  getIndexableBestPagePaths,
  getIndexableCategoryPaths,
} from "@/lib/seo/indexable-content";

/**
 * Next.js native XML sitemap convention (SEO_STRATEGY.md §3).
 *
 * Only ever includes seoStatus === "INDEXABLE" content — see indexable-content.ts for
 * the enforced invariant, applied identically across every content type. Always
 * includes the homepage and the static /categories index, which are hand-built pages
 * (not Quality-Gate-governed content records).
 *
 * A sitemap index (splitting into multiple files) is a documented future step once
 * entry count approaches ~40k — not needed at current/MVP scale (SEO_STRATEGY.md §3).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const staticEntries: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    {
      url: `${siteUrl}/categories`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    ...(
      [
        "/about",
        "/how-we-test",
        "/editorial-policy",
        "/affiliate-disclosure",
        "/privacy",
        "/terms",
        "/contact",
      ] as const
    ).map((path) => ({
      url: `${siteUrl}${path}`,
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];

  const toEntries = (
    entries: Awaited<ReturnType<typeof getIndexableProductPaths>>,
    priority: number
  ): MetadataRoute.Sitemap =>
    entries.map((entry) => ({
      url: `${siteUrl}${entry.path}`,
      lastModified: entry.lastModified,
      changeFrequency: "weekly",
      priority,
    }));

  const [categoryPaths, productPaths, guidePaths, bestPagePaths, comparisonPaths] =
    await Promise.all([
      getIndexableCategoryPaths(),
      getIndexableProductPaths(),
      getIndexableGuidePaths(),
      getIndexableBestPagePaths(),
      getIndexableComparisonPaths(),
    ]);

  return [
    ...staticEntries,
    ...toEntries(categoryPaths, 0.6),
    ...toEntries(productPaths, 0.7),
    ...toEntries(guidePaths, 0.7),
    ...toEntries(bestPagePaths, 0.7),
    ...toEntries(comparisonPaths, 0.65),
  ];
}
