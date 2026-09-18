import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  metaTitle: "Affiliate Disclosure",
  metaDescription:
    "How OpticsScout uses affiliate links, which networks we use, and how this does not affect our editorial coverage.",
  canonicalPath: "/affiliate-disclosure",
  seoStatus: "INDEXABLE",
  fallbackTitle: "Affiliate Disclosure",
});

export default function AffiliateDisclosurePage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="font-serif text-3xl text-[var(--color-ink)]">
        Affiliate Disclosure
      </h1>

      <section className="mt-8">
        <p className="text-base leading-relaxed text-[var(--color-ink)]">
          OpticsScout participates in affiliate programs, including Amazon
          Associates. When you click certain links on this site and make a purchase,
          we may earn a commission — at no extra cost to you. The price you pay is
          the same whether or not you use our link.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-xl text-[var(--color-ink)]">
          This does not affect our coverage
        </h2>
        <p className="mt-3 text-base leading-relaxed text-[var(--color-ink)]">
          Which products we cover, how we compare them, and what we say about them is
          decided independently of any affiliate relationship — see our{" "}
          <a
            href="/editorial-policy"
            className="underline hover:text-[var(--color-accent)]"
          >
            editorial policy
          </a>
          . We do not rank a product higher because it pays a larger commission.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-xl text-[var(--color-ink)]">
          About the prices you see
        </h2>
        <p className="mt-3 text-base leading-relaxed text-[var(--color-ink)]">
          Where a price is labeled &ldquo;MSRP,&rdquo; it is the manufacturer&rsquo;s
          suggested retail price, not a live price from that specific merchant —
          check the retailer link itself for current pricing before buying. Where no
          price is shown at all, it means we don&rsquo;t have a verified, current
          figure to show rather than a guess.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-xl text-[var(--color-ink)]">
          How outbound links work
        </h2>
        <p className="mt-3 text-base leading-relaxed text-[var(--color-ink)]">
          Affiliate links on this site route through a first-party redirect so we can
          keep basic, anonymous click statistics (which page, which merchant — never
          your identity or IP address) before sending you on to the merchant&rsquo;s
          site. See our{" "}
          <a href="/privacy" className="underline hover:text-[var(--color-accent)]">
            privacy policy
          </a>{" "}
          for detail on what we do and don&rsquo;t collect.
        </p>
      </section>
    </main>
  );
}
