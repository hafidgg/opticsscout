import Link from "next/link";

/**
 * Site-wide header — a logo/name link back to the homepage plus a link to the
 * /categories index. Rendered once via the root layout, so every page (including the
 * trust pages, which have no other way back to "/" besides the browser back button)
 * has a way home, and /categories is linked from every page instead of being an orphan
 * reachable only via the sitemap.
 */
export function SiteHeader() {
  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-paper-raised)]">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="font-serif text-lg text-[var(--color-ink)] hover:text-[var(--color-accent)]"
        >
          OpticsScout
        </Link>
        <nav aria-label="Main">
          <Link
            href="/categories"
            className="text-sm text-[var(--color-ink)] hover:text-[var(--color-accent)] hover:underline"
          >
            Categories
          </Link>
        </nav>
      </div>
    </header>
  );
}
