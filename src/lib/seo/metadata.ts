/**
 * Metadata builders (SEO_STRATEGY.md §3). Every route's generateMetadata() should
 * call one of these rather than hand-assembling a Metadata object, so canonical URL
 * construction and the noindex-by-default safety rule live in exactly one place.
 */

import type { Metadata } from "next";
import type { SeoStatus } from "@prisma/client";

const SITE_NAME = "OpticsScout";

/** The real, final production domain. Anything else (Vercel's own *.vercel.app
 *  subdomain, previews, localhost) is pre-launch and must never be indexed, even for
 *  content whose seoStatus is INDEXABLE — see isOnFinalDomain(). */
const FINAL_DOMAIN = "opticsscout.com";

/**
 * Reads from env so the canonical/OG base URL is correct in every environment
 * (local, preview, production) without hand-editing code. Falls back to localhost for
 * dev convenience — never silently produces a production URL from unset config.
 */
function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

/**
 * True only once the site is actually served from FINAL_DOMAIN. While deployed on a
 * Vercel subdomain ahead of the real domain move, this is false everywhere, which is
 * what forces noindex below regardless of any content's seoStatus — prevents the
 * Vercel URL from getting indexed and creating duplicate-content/redirect issues once
 * the real domain goes live.
 */
export function isOnFinalDomain(): boolean {
  try {
    return new URL(getSiteUrl()).hostname === FINAL_DOMAIN;
  } catch {
    return false;
  }
}

export interface BuildMetadataInput {
  metaTitle: string | null | undefined;
  metaDescription: string | null | undefined;
  canonicalPath: string | null | undefined;
  seoStatus: SeoStatus;
  /** Fallback title used only if metaTitle is unset — should rarely happen since the
   *  Quality Gate requires metaTitle before a page reaches READY/INDEXABLE, but content
   *  in DRAFT/REVIEW still needs to render something sane in dev/preview. */
  fallbackTitle: string;
  fallbackDescription?: string;
  images?: string[];
}

/**
 * The single safety rule for indexability: ONLY seoStatus === "INDEXABLE" ever emits
 * `index, follow`. Every other status — including READY, which has passed the Quality
 * Gate but not yet been explicitly promoted — emits noindex. This prevents any content
 * from being crawled before an explicit, auditable promotion step (SEO_STRATEGY.md §4).
 */
export function robotsDirectiveFor(seoStatus: SeoStatus): Metadata["robots"] {
  if (seoStatus === "INDEXABLE" && isOnFinalDomain()) {
    return { index: true, follow: true };
  }
  return { index: false, follow: false };
}

export function buildMetadata(input: BuildMetadataInput): Metadata {
  const siteUrl = getSiteUrl();
  const title = input.metaTitle?.trim() || input.fallbackTitle;
  const description =
    input.metaDescription?.trim() ||
    input.fallbackDescription ||
    "Independent, spec-driven comparisons and buying guides to help you decide what to buy.";
  const canonicalPath = input.canonicalPath?.trim();
  const canonicalUrl = canonicalPath
    ? `${siteUrl}${canonicalPath.startsWith("/") ? "" : "/"}${canonicalPath}`
    : undefined;

  return {
    title,
    description,
    alternates: canonicalUrl ? { canonical: canonicalUrl } : undefined,
    robots: robotsDirectiveFor(input.seoStatus),
    openGraph: {
      title,
      description,
      siteName: SITE_NAME,
      url: canonicalUrl,
      type: "website",
      images: input.images && input.images.length > 0 ? input.images : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: input.images && input.images.length > 0 ? input.images : undefined,
    },
  };
}
