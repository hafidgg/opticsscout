import Link from "next/link";

/**
 * Site-wide header — just a logo/name link back to the homepage. Rendered once
 * via the root layout, so every page (including the trust pages, which have no
 * other way back to "/" besides the browser back button) has a way home.
 */
export function SiteHeader() {
  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-paper-raised)]">
      <div className="mx-auto max-w-4xl px-6 py-4">
        <Link
          href="/"
          className="font-serif text-lg text-[var(--color-ink)] hover:text-[var(--color-accent)]"
        >
          OpticsScout
        </Link>
      </div>
    </header>
  );
}
