"use client";

import { useRef } from "react";
import {
  FeaturedProductCard,
  type FeaturedProductCardData,
} from "@/components/product/FeaturedProductCard";

/**
 * Horizontal scroll-snap carousel for the homepage's "Featured Comparisons"
 * section. Plain CSS scroll-snap + a ref-based scrollBy on the prev/next
 * buttons — no carousel library. This is the only client-interactive piece;
 * the product data itself is fetched server-side by the homepage and passed in
 * as props.
 */
export function FeaturedComparisonsCarousel({
  products,
}: {
  products: FeaturedProductCardData[];
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  function scrollByCard(direction: 1 | -1) {
    trackRef.current?.scrollBy({ left: direction * 288, behavior: "smooth" });
  }

  if (products.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-[var(--color-border)] bg-[var(--color-paper-raised)] p-8 text-center text-sm text-[var(--color-muted)]">
        Comparisons are on the way — check back soon.
      </p>
    );
  }

  return (
    <div className="relative">
      <div
        ref={trackRef}
        className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((product) => (
          <FeaturedProductCard key={product.slug} product={product} />
        ))}
      </div>

      {products.length > 2 && (
        <div className="mt-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => scrollByCard(-1)}
            aria-label="Scroll left"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-paper-raised)] text-[var(--color-ink)] hover:border-[var(--color-ink)]"
          >
            &larr;
          </button>
          <button
            type="button"
            onClick={() => scrollByCard(1)}
            aria-label="Scroll right"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-paper-raised)] text-[var(--color-ink)] hover:border-[var(--color-ink)]"
          >
            &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
