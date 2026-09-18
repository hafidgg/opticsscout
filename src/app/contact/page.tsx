import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  metaTitle: "Contact",
  metaDescription: "How to reach OpticsScout.",
  canonicalPath: "/contact",
  seoStatus: "INDEXABLE",
  fallbackTitle: "Contact",
});

const CONTACT_EMAIL = "contact@opticsscout.com";

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="font-serif text-3xl text-[var(--color-ink)]">Contact</h1>

      <p className="mt-6 text-base leading-relaxed text-[var(--color-ink)]">
        Spotted an error in a spec or price, have a question about a comparison, or
        want to reach us for any other reason? Email us:
      </p>

      <p className="mt-4">
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="text-lg font-medium text-[var(--color-accent)] underline"
        >
          {CONTACT_EMAIL}
        </a>
      </p>

      <p className="mt-6 text-sm text-[var(--color-muted)]">
        See our{" "}
        <a href="/editorial-policy" className="underline hover:text-[var(--color-ink)]">
          editorial policy
        </a>{" "}
        for how we handle corrections.
      </p>
    </main>
  );
}
