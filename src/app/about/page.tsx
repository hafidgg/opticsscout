import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  // "About" not "About OpticsScout" — the root layout's title template ("%s | OpticsScout")
  // already appends the site name, so the old value rendered as the duplicated
  // "About OpticsScout | OpticsScout". Every other trust page's metaTitle already
  // omits the site name for the same reason (e.g. "Contact", "Privacy Policy").
  metaTitle: "About",
  metaDescription:
    "OpticsScout helps you compare birding optics and outdoor field gear using sourced manufacturer specifications and retailer data.",
  canonicalPath: "/about",
  seoStatus: "INDEXABLE",
  fallbackTitle: "About",
});

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="font-serif text-3xl text-[var(--color-ink)]">About OpticsScout</h1>

      <section className="mt-8">
        <h2 className="font-serif text-xl text-[var(--color-ink)]">What we do</h2>
        <p className="mt-3 text-base leading-relaxed text-[var(--color-ink)]">
          OpticsScout helps you compare birding optics and outdoor field gear —
          binoculars, spotting scopes, and rangefinders — by pulling together publicly
          available specifications, official manufacturer data, and current listings
          from major retailers, so you can see the real tradeoffs between models side
          by side.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-xl text-[var(--color-ink)]">
          How we research and compare products
        </h2>
        <p className="mt-3 text-base leading-relaxed text-[var(--color-ink)]">
          Every product page and comparison on this site is built from sourced
          information. Specifications (field of view, close focus, eye relief, weight,
          and similar) come from manufacturers&rsquo; own published spec sheets, cited
          on each page. Prices reflect either a manufacturer&rsquo;s stated MSRP or a
          specific retailer listing at the time it was checked — never a guess, and
          never presented as more current than it is. We do not fabricate ratings or
          review counts. If a product page doesn&rsquo;t show a star rating, it&rsquo;s
          because we don&rsquo;t have a real, sourced one to show — not an oversight.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-xl text-[var(--color-ink)]">
          What this site is not
        </h2>
        <p className="mt-3 text-base leading-relaxed text-[var(--color-ink)]">
          We do not currently conduct hands-on, in-field testing of every product we
          cover — most of what you&rsquo;ll read here is built from public
          specifications and manufacturer documentation, not personal field use. Where
          a page reflects genuine hands-on experience, we say so explicitly; where it
          doesn&rsquo;t, we don&rsquo;t imply otherwise. See{" "}
          <a href="/how-we-test" className="underline hover:text-[var(--color-accent)]">
            how we test
          </a>{" "}
          for the full methodology.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-xl text-[var(--color-ink)]">
          Affiliate disclosure
        </h2>
        <p className="mt-3 text-base leading-relaxed text-[var(--color-ink)]">
          Some links on this site are affiliate links — if you buy through one, we may
          earn a commission at no extra cost to you. This never affects which products
          we cover or what we say about them. Full policy:{" "}
          <a
            href="/affiliate-disclosure"
            className="underline hover:text-[var(--color-accent)]"
          >
            affiliate disclosure
          </a>
          .
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-xl text-[var(--color-ink)]">
          Who&rsquo;s behind this site
        </h2>
        <p className="mt-3 text-base leading-relaxed text-[var(--color-ink)]">
          OpticsScout is an independent, research-driven site with no formal
          ornithology or optics-industry credentials, built on publicly available
          manufacturer specifications and sourced retailer data.
        </p>
      </section>
    </main>
  );
}
