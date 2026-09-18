import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  metaTitle: "Terms of Use",
  metaDescription: "The terms for using the OpticsScout website.",
  canonicalPath: "/terms",
  seoStatus: "INDEXABLE",
  fallbackTitle: "Terms of Use",
});

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="font-serif text-3xl text-[var(--color-ink)]">Terms of Use</h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">Last updated 2026-09-07.</p>

      <section className="mt-8">
        <h2 className="font-serif text-xl text-[var(--color-ink)]">
          Informational purposes only
        </h2>
        <p className="mt-3 text-base leading-relaxed text-[var(--color-ink)]">
          The content on this site — specifications, prices, comparisons, and
          editorial guidance — is provided for general informational purposes to help
          you research a purchase. It is not a guarantee of accuracy, availability, or
          current pricing. Always verify specifications and pricing with the
          manufacturer or retailer directly before making a purchase decision. See our{" "}
          <a href="/how-we-test" className="underline hover:text-[var(--color-accent)]">
            how we test
          </a>{" "}
          page for how this content is sourced.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-xl text-[var(--color-ink)]">
          No liability for purchase decisions
        </h2>
        <p className="mt-3 text-base leading-relaxed text-[var(--color-ink)]">
          We are not a party to any transaction between you and a merchant. We are not
          liable for any loss or damage arising from a purchase decision made based on
          information found on this site, including inaccuracies in manufacturer- or
          retailer-sourced information we did not independently verify.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-xl text-[var(--color-ink)]">
          Third-party sites
        </h2>
        <p className="mt-3 text-base leading-relaxed text-[var(--color-ink)]">
          Links to merchant and manufacturer websites take you to sites we don&rsquo;t
          control and aren&rsquo;t responsible for, including their own terms,
          pricing, and availability.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-xl text-[var(--color-ink)]">
          Content ownership
        </h2>
        <p className="mt-3 text-base leading-relaxed text-[var(--color-ink)]">
          The editorial text, comparisons, and organization of information on this
          site are ours. Product names, images, and trademarks referenced belong to
          their respective manufacturers and are used to identify the products being
          discussed, not to imply endorsement of this site by those manufacturers.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-xl text-[var(--color-ink)]">Changes</h2>
        <p className="mt-3 text-base leading-relaxed text-[var(--color-ink)]">
          We may update these terms as the site changes. Continued use of the site
          after an update means you accept the current version.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-xl text-[var(--color-ink)]">Contact</h2>
        <p className="mt-3 text-base leading-relaxed text-[var(--color-ink)]">
          Questions about these terms: see our{" "}
          <a href="/contact" className="underline hover:text-[var(--color-accent)]">
            contact page
          </a>
          .
        </p>
      </section>
    </main>
  );
}
