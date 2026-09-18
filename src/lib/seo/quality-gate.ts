/**
 * SEO Quality Gate (SEO_STRATEGY.md §4).
 *
 * A pure, explainable function: given a page's content, returns which checks passed
 * and failed. Never a black-box score — every failure is a named, actionable reason.
 * This gate decides whether a page's seoStatus is ALLOWED to move to INDEXABLE; it does
 * not itself write to the database.
 */

import type { SeoStatus } from "@prisma/client";

export type QualityGateCheckId =
  | "hasMinimumEditorialContent"
  | "hasSufficientProductCoverage"
  | "hasValidProductData"
  | "hasNoEmptySections"
  | "hasNoBrokenOffers"
  | "hasCompleteMetadata"
  | "hasNoDuplicateIntent"
  | "hasInternalLinks";

export interface QualityGateCheckResult {
  id: QualityGateCheckId;
  passed: boolean;
  reason: string;
}

export interface QualityGateResult {
  passed: boolean;
  checks: QualityGateCheckResult[];
  /** Convenience: just the failing checks, for logging/reporting. */
  failures: QualityGateCheckResult[];
}

/** Minimum length (characters) for a body of editorial text to count as substantive,
 *  not a placeholder. Deliberately conservative — see SEO_STRATEGY.md §4 point 1. */
const MIN_EDITORIAL_TEXT_LENGTH = 240;

/** Minimum distinct real products a /best or /compare page must reference. */
const MIN_PRODUCT_COUNT_FOR_LISTING_PAGES = 2;

export interface EditorialSection {
  name: string;
  text: string | null | undefined;
  /** Whether this section is required for this specific page type. If false and the
   *  section is empty, that's fine — it's simply omitted from render, not a failure. */
  required: boolean;
}

export interface OfferHealthCheck {
  offerId: string;
  urlResolves: boolean;
}

export interface QualityGateInput {
  pageType: "product" | "best" | "compare" | "alternatives" | "gifts" | "guide" | "category";
  metaTitle: string | null | undefined;
  metaDescription: string | null | undefined;
  canonicalPath: string | null | undefined;
  editorialSections: EditorialSection[];
  referencedProductIds: string[];
  /** For each referenced product, whether its specification data is non-empty and not
   *  entirely UNKNOWN placeholder values. */
  productDataValidity: Record<string, boolean>;
  offerHealth: OfferHealthCheck[];
  internalLinkCount: number;
  /** Slugs of existing pages whose targeted intent overlaps this one above the
   *  configured threshold (computed by the caller — see lib/seo/duplicate-detection.ts). */
  overlappingIntentSlugs: string[];
}

function checkEditorialContent(input: QualityGateInput): QualityGateCheckResult {
  const requiredSections = input.editorialSections.filter((s) => s.required);
  const missing = requiredSections.filter(
    (s) => !s.text || s.text.trim().length < MIN_EDITORIAL_TEXT_LENGTH
  );

  return {
    id: "hasMinimumEditorialContent",
    passed: missing.length === 0,
    reason:
      missing.length === 0
        ? "All required editorial sections meet the minimum length."
        : `Required section(s) missing or too short (< ${MIN_EDITORIAL_TEXT_LENGTH} chars): ${missing
            .map((s) => s.name)
            .join(", ")}.`,
  };
}

function checkProductCoverage(input: QualityGateInput): QualityGateCheckResult {
  const needsMultipleProducts =
    input.pageType === "best" || input.pageType === "compare";

  if (!needsMultipleProducts) {
    return {
      id: "hasSufficientProductCoverage",
      passed: input.referencedProductIds.length >= 1,
      reason:
        input.referencedProductIds.length >= 1
          ? "Page references at least one product."
          : "Page references no products.",
    };
  }

  const passed =
    input.referencedProductIds.length >= MIN_PRODUCT_COUNT_FOR_LISTING_PAGES;

  return {
    id: "hasSufficientProductCoverage",
    passed,
    reason: passed
      ? `Page references ${input.referencedProductIds.length} products (minimum ${MIN_PRODUCT_COUNT_FOR_LISTING_PAGES}).`
      : `Page type "${input.pageType}" requires at least ${MIN_PRODUCT_COUNT_FOR_LISTING_PAGES} products; found ${input.referencedProductIds.length}.`,
  };
}

function checkProductDataValidity(input: QualityGateInput): QualityGateCheckResult {
  const invalid = input.referencedProductIds.filter(
    (id) => input.productDataValidity[id] !== true
  );

  return {
    id: "hasValidProductData",
    passed: invalid.length === 0,
    reason:
      invalid.length === 0
        ? "All referenced products have valid, non-placeholder specification data."
        : `Product(s) with missing/invalid spec data: ${invalid.join(", ")}.`,
  };
}

function checkNoEmptySections(input: QualityGateInput): QualityGateCheckResult {
  // A section that's not required is fine to be empty (it's simply omitted from
  // render). Only a required-but-rendered section with whitespace-only text fails.
  const emptyRequired = input.editorialSections.filter(
    (s) => s.required && s.text !== null && s.text !== undefined && s.text.trim() === ""
  );

  return {
    id: "hasNoEmptySections",
    passed: emptyRequired.length === 0,
    reason:
      emptyRequired.length === 0
        ? "No required section is present-but-empty."
        : `Section(s) present but empty: ${emptyRequired.map((s) => s.name).join(", ")}.`,
  };
}

function checkOfferHealth(input: QualityGateInput): QualityGateCheckResult {
  const broken = input.offerHealth.filter((o) => !o.urlResolves);

  return {
    id: "hasNoBrokenOffers",
    passed: broken.length === 0,
    reason:
      broken.length === 0
        ? "All referenced offer URLs resolve."
        : `Broken offer URL(s): ${broken.map((o) => o.offerId).join(", ")}.`,
  };
}

function checkMetadataComplete(input: QualityGateInput): QualityGateCheckResult {
  const missing: string[] = [];
  if (!input.metaTitle || input.metaTitle.trim() === "") missing.push("metaTitle");
  if (!input.metaDescription || input.metaDescription.trim() === "")
    missing.push("metaDescription");
  if (!input.canonicalPath || input.canonicalPath.trim() === "")
    missing.push("canonicalPath");

  return {
    id: "hasCompleteMetadata",
    passed: missing.length === 0,
    reason:
      missing.length === 0
        ? "metaTitle, metaDescription, and canonicalPath are all present."
        : `Missing metadata field(s): ${missing.join(", ")}.`,
  };
}

function checkDuplicateIntent(input: QualityGateInput): QualityGateCheckResult {
  const passed = input.overlappingIntentSlugs.length === 0;
  return {
    id: "hasNoDuplicateIntent",
    passed,
    reason: passed
      ? "No existing page targets materially overlapping search intent."
      : `Overlapping intent with existing page(s): ${input.overlappingIntentSlugs.join(", ")}. Held for manual disambiguation per SEO_STRATEGY.md §5.`,
  };
}

function checkInternalLinks(input: QualityGateInput): QualityGateCheckResult {
  const passed = input.internalLinkCount >= 1;
  return {
    id: "hasInternalLinks",
    passed,
    reason: passed
      ? `Page has ${input.internalLinkCount} internal link(s).`
      : "Page has no internal links to related Category/Guide/Product content.",
  };
}

/**
 * Runs the full Quality Gate against a candidate page. Pure function — no I/O.
 * Callers are responsible for gathering the input (e.g. resolving offer health via a
 * real HTTP check, computing overlappingIntentSlugs via the duplicate-detection module)
 * before calling this.
 */
export function runQualityGate(input: QualityGateInput): QualityGateResult {
  const checks: QualityGateCheckResult[] = [
    checkEditorialContent(input),
    checkProductCoverage(input),
    checkProductDataValidity(input),
    checkNoEmptySections(input),
    checkOfferHealth(input),
    checkMetadataComplete(input),
    checkDuplicateIntent(input),
    checkInternalLinks(input),
  ];

  const failures = checks.filter((c) => !c.passed);

  return {
    passed: failures.length === 0,
    checks,
    failures,
  };
}

/**
 * Given a gate result and the page's current status, determines the next allowed
 * status. This encodes the DRAFT → REVIEW → READY → INDEXABLE state machine
 * (SEO_STRATEGY.md §4) — the gate never jumps a page straight to INDEXABLE from DRAFT
 * without passing through REVIEW/READY, and a failed gate never advances status.
 */
export function nextSeoStatus(
  currentStatus: SeoStatus,
  gateResult: QualityGateResult
): SeoStatus {
  if (currentStatus === "ARCHIVED" || currentStatus === "NOINDEX") {
    // Terminal/manual statuses are never auto-advanced by the gate.
    return currentStatus;
  }

  if (!gateResult.passed) {
    // A page that was READY/INDEXABLE but now fails (e.g. a broken offer link appeared)
    // is demoted to REVIEW rather than silently staying INDEXABLE with a failing gate.
    return currentStatus === "DRAFT" ? "DRAFT" : "REVIEW";
  }

  if (currentStatus === "DRAFT") return "REVIEW";
  if (currentStatus === "REVIEW") return "READY";
  // READY pages that pass are eligible for INDEXABLE, but promotion from READY to
  // INDEXABLE is intentionally left as a separate, explicit human/editorial action
  // (not automatic) per Section 14's "Human Review" step in the automation pipeline.
  return currentStatus;
}
