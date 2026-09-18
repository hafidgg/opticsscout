import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  metaTitle: "Editorial Policy",
  metaDescription:
    "How OpticsScout decides what to cover, how affiliate relationships are kept separate from editorial coverage, and our correction policy.",
  canonicalPath: "/editorial-policy",
  seoStatus: "INDEXABLE",
  fallbackTitle: "Editorial Policy",
});

export default function EditorialPolicyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="font-serif text-3xl text-[var(--color-ink)]">Editorial Policy</h1>

      <section className="mt-8">
        <h2 className="font-serif text-xl text-[var(--color-ink)]">
          How we choose what to cover
        </h2>
        <p className="mt-3 text-base leading-relaxed text-[var(--color-ink)]">
          We cover real, currently-sold products with publicly available
          specifications. We don&rsquo;t cover a product just because it has an
          affiliate program attached, and we don&rsquo;t skip a product because it
          doesn&rsquo;t — coverage decisions and affiliate relationships are made
          independently of each other.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-xl text-[var(--color-ink)]">
          Affiliate relationships never influence coverage
        </h2>
        <p className="mt-3 text-base leading-relaxed text-[var(--color-ink)]">
          We do not accept payment for favorable coverage, placement, or ranking, and
          we do not rank a product higher because it earns a larger commission. Our
          comparisons and &ldquo;best of&rdquo; picks are ordered by how a product
          performs against the criteria stated on that page — not by commission rate.
          See our{" "}
          <a
            href="/affiliate-disclosure"
            className="underline hover:text-[var(--color-accent)]"
          >
            affiliate disclosure
          </a>{" "}
          for how those relationships work.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-xl text-[var(--color-ink)]">
          Corrections
        </h2>
        <p className="mt-3 text-base leading-relaxed text-[var(--color-ink)]">
          If a sourced specification, price, or fact on this site turns out to be
          wrong — a manufacturer revises a spec sheet, a model is discontinued, or we
          simply made a mistake — we fix it. We don&rsquo;t quietly bury errors or
          leave outdated information live once we know about it. If you spot something
          that looks wrong,{" "}
          <a href="/contact" className="underline hover:text-[var(--color-accent)]">
            contact us
          </a>
          .
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-xl text-[var(--color-ink)]">
          What we don&rsquo;t do
        </h2>
        <p className="mt-3 text-base leading-relaxed text-[var(--color-ink)]">
          We don&rsquo;t fabricate ratings, reviews, or hands-on testing claims — see{" "}
          <a href="/how-we-test" className="underline hover:text-[var(--color-accent)]">
            how we test
          </a>{" "}
          for detail. We don&rsquo;t publish a comparison or best-of page until it has
          real, substantive editorial content referencing real products with valid
          specifications.
        </p>
      </section>
    </main>
  );
}
