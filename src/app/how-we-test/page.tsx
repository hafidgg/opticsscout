import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  metaTitle: "How We Test",
  metaDescription:
    "How OpticsScout sources specifications and prices, and what our editorial process does and doesn't currently include.",
  canonicalPath: "/how-we-test",
  seoStatus: "INDEXABLE",
  fallbackTitle: "How We Test",
});

export default function HowWeTestPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="font-serif text-3xl text-[var(--color-ink)]">How We Test</h1>

      <section className="mt-8">
        <h2 className="font-serif text-xl text-[var(--color-ink)]">
          Where our specifications come from
        </h2>
        <p className="mt-3 text-base leading-relaxed text-[var(--color-ink)]">
          Every spec on a product page — field of view, close focus, eye relief,
          weight, range, accuracy, and similar — is sourced from the manufacturer&rsquo;s
          own published documentation: an official product page or spec sheet. We
          record where each figure came from and when we retrieved it internally, and
          we don&rsquo;t average, round, or adjust manufacturer-stated numbers.
          Occasionally a manufacturer&rsquo;s own page doesn&rsquo;t clearly state a
          number (this has happened); when that occurs, we either find a second,
          named, real source and say so, or we leave the field out rather than guess.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-xl text-[var(--color-ink)]">
          Where our prices come from
        </h2>
        <p className="mt-3 text-base leading-relaxed text-[var(--color-ink)]">
          A price shown on this site is either a manufacturer&rsquo;s stated MSRP —
          always labeled &ldquo;MSRP&rdquo; when it is one, never presented as a live
          price — or a specific retailer&rsquo;s listed price at the time we checked
          it. We do not have live pricing-API access yet, so prices are not
          real-time; check the retailer link itself for the current price before
          buying.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-xl text-[var(--color-ink)]">
          What &ldquo;hands-on testing&rdquo; means here — and what it doesn&rsquo;t, yet
        </h2>
        <p className="mt-3 text-base leading-relaxed text-[var(--color-ink)]">
          We do not currently physically test the products we cover. Our verdicts and
          &ldquo;who it&rsquo;s for&rdquo; guidance are built by comparing sourced
          specifications against each other and against publicly known use cases —
          not by using the product in the field. We say this plainly rather than
          implying otherwise, because a comparison built from real specs is still
          useful, and pretending it&rsquo;s something it isn&rsquo;t would undermine
          the one thing we can actually promise: that what we tell you is sourced and
          checkable. If we do start hands-on testing for certain products in the
          future, we&rsquo;ll say so explicitly on that specific page — not apply it
          retroactively to pages that were never tested.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-xl text-[var(--color-ink)]">
          Ratings and reviews
        </h2>
        <p className="mt-3 text-base leading-relaxed text-[var(--color-ink)]">
          We never invent a star rating or review count. If a product page shows no
          rating, that&rsquo;s because we don&rsquo;t have a real, sourced one — not a
          missing field we forgot to fill in.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-xl text-[var(--color-ink)]">
          Before a page goes live
        </h2>
        <p className="mt-3 text-base leading-relaxed text-[var(--color-ink)]">
          Every page goes through an internal review before it&rsquo;s published:
          checking that it has real editorial content (not just a name and a price),
          that every product it references has valid, non-placeholder specifications,
          that its metadata is complete, and that it doesn&rsquo;t duplicate an
          existing page&rsquo;s intent. A page passing that review still isn&rsquo;t
          published automatically — publishing is a separate, deliberate step.
        </p>
      </section>
    </main>
  );
}
