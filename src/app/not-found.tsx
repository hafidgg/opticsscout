import Link from "next/link";

/**
 * Custom 404 boundary (App Router convention). Without this file, Next falls back to
 * a bare, unbranded default not-found page with no way back into the site — a real
 * dead end for anyone hitting a stale/mistyped link. Deliberately not indexed (no
 * generateMetadata override needed: the root layout's default metadata already sets
 * `robots: noindex` while isOnFinalDomain() is false, and a 404 should never be
 * indexed regardless of domain — Next serves this with a 404 HTTP status either way,
 * which is itself enough to keep it out of a search index once live).
 */
export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col items-center px-6 py-24 text-center">
      <h1 className="font-serif text-3xl text-[var(--color-ink)]">Page not found</h1>
      <p className="mt-4 text-base text-[var(--color-muted)]">
        The page you&rsquo;re looking for doesn&rsquo;t exist, or the link may be out of
        date.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/"
          className="rounded-lg bg-[var(--color-ink)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-accent)]"
        >
          Back to homepage
        </Link>
        <Link
          href="/categories"
          className="rounded-lg border border-[var(--color-border)] px-5 py-2.5 text-sm font-medium text-[var(--color-ink)] hover:border-[var(--color-ink)]"
        >
          Browse categories
        </Link>
      </div>
    </main>
  );
}
