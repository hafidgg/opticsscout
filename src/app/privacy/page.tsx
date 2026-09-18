import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  metaTitle: "Privacy Policy",
  metaDescription: "What OpticsScout collects, what it doesn't, and why.",
  canonicalPath: "/privacy",
  seoStatus: "INDEXABLE",
  fallbackTitle: "Privacy Policy",
});

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="font-serif text-3xl text-[var(--color-ink)]">Privacy Policy</h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">Last updated 2026-09-07.</p>

      <section className="mt-8">
        <h2 className="font-serif text-xl text-[var(--color-ink)]">
          What we collect
        </h2>
        <p className="mt-3 text-base leading-relaxed text-[var(--color-ink)]">
          When you click a merchant link on this site, we record which product page
          you were on, which merchant you clicked through to, and a randomly
          generated, anonymous session identifier — stored in a cookie
          (<code>anon_session_id</code>) for 30 days. This lets us see which pages and
          links are useful without identifying who you are.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-xl text-[var(--color-ink)]">
          What we don&rsquo;t collect
        </h2>
        <p className="mt-3 text-base leading-relaxed text-[var(--color-ink)]">
          We do not collect or store your name, email address, IP address, or browser
          user-agent string as part of this click tracking. The session identifier is
          not tied to any account or identity — we don&rsquo;t have accounts. We do
          not currently run any third-party analytics or advertising scripts on this
          site.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-xl text-[var(--color-ink)]">Cookies</h2>
        <p className="mt-3 text-base leading-relaxed text-[var(--color-ink)]">
          The only cookie this site sets is the anonymous session identifier
          described above, used solely for the click statistics described above. It
          is not used for advertising targeting or shared with third parties.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-xl text-[var(--color-ink)]">
          Third-party merchant sites
        </h2>
        <p className="mt-3 text-base leading-relaxed text-[var(--color-ink)]">
          When you click through to a merchant (such as Amazon) to view or buy a
          product, you leave this site and that merchant&rsquo;s own privacy policy
          applies to whatever they collect from that point on. We don&rsquo;t control
          and aren&rsquo;t responsible for their practices.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-xl text-[var(--color-ink)]">
          Changes to this policy
        </h2>
        <p className="mt-3 text-base leading-relaxed text-[var(--color-ink)]">
          If what we collect changes — for example, if we add analytics or
          advertising in the future — we&rsquo;ll update this page to reflect it
          before that change takes effect, not after.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-xl text-[var(--color-ink)]">Contact</h2>
        <p className="mt-3 text-base leading-relaxed text-[var(--color-ink)]">
          Questions about this policy: see our{" "}
          <a href="/contact" className="underline hover:text-[var(--color-accent)]">
            contact page
          </a>
          .
        </p>
      </section>
    </main>
  );
}
