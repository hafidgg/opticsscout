import Link from "next/link";
import type { Metadata } from "next";
import { searchContent } from "@/lib/content/repository";
import { buildMetadata } from "@/lib/seo/metadata";

/**
 * Search results are never indexable themselves (Section 13/SEO_STRATEGY.md — search
 * result pages are not a content type that passes the Quality Gate; they're a utility
 * surface). Always noindex, regardless of query.
 */
export const metadata: Metadata = buildMetadata({
  metaTitle: "Search",
  metaDescription: null,
  canonicalPath: null,
  seoStatus: "NOINDEX",
  fallbackTitle: "Search",
});

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

const typeLabels: Record<string, string> = {
  product: "Product",
  guide: "Guide",
  comparison: "Comparison",
  best: "Best of",
};

export default async function SearchPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const results = query ? await searchContent(query) : [];

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="font-serif text-3xl text-[var(--color-ink)]">Search</h1>

      <form action="/search" className="mt-6 flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="What are you looking for?"
          className="w-full rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)]"
        />
        <button
          type="submit"
          className="rounded-lg bg-[var(--color-ink)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-accent)]"
        >
          Search
        </button>
      </form>

      {query && (
        <p className="mt-6 text-sm text-[var(--color-muted)]">
          {results.length > 0
            ? `${results.length} result${results.length === 1 ? "" : "s"} for "${query}"`
            : `No results for "${query}"`}
        </p>
      )}

      <ul className="mt-4 flex flex-col gap-3">
        {results.map((result) => (
          <li key={result.path}>
            <Link
              href={result.path}
              className="block rounded-md border border-[var(--color-border)] bg-[var(--color-paper-raised)] p-4 hover:border-[var(--color-ink)]"
            >
              <span className="text-xs text-[var(--color-muted)]">
                {typeLabels[result.type] ?? result.type}
              </span>
              <h2 className="font-serif text-lg text-[var(--color-ink)]">{result.title}</h2>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
