import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbJsonLd, type BreadcrumbSegment } from "@/lib/seo/structured-data";

/**
 * Renders both the visible breadcrumb trail AND its matching BreadcrumbList JSON-LD,
 * built from the same `segments` input — so the two can never drift apart
 * (SEO_STRATEGY.md §3).
 */
export function Breadcrumbs({ segments }: { segments: BreadcrumbSegment[] }) {
  if (segments.length === 0) return null;

  return (
    <>
      <JsonLd data={buildBreadcrumbJsonLd(segments)} />
      <nav aria-label="Breadcrumb" className="text-sm text-neutral-500">
        <ol className="flex flex-wrap items-center gap-1">
          {segments.map((segment, index) => {
            const isLast = index === segments.length - 1;
            return (
              <li key={segment.path} className="flex items-center gap-1">
                {index > 0 && <span aria-hidden="true">/</span>}
                {isLast ? (
                  <span aria-current="page" className="text-neutral-700">
                    {segment.name}
                  </span>
                ) : (
                  <Link href={segment.path} className="hover:text-neutral-700 hover:underline">
                    {segment.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
