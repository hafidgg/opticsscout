import Link from "next/link";
import type { Metadata } from "next";
import { getAllCategories } from "@/lib/content/repository";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  metaTitle: "All Categories",
  metaDescription: "Browse all categories.",
  canonicalPath: "/categories",
  seoStatus: "INDEXABLE",
  fallbackTitle: "All Categories",
});

export default async function CategoriesIndexPage() {
  const categories = await getAllCategories();
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-serif text-3xl text-[var(--color-ink)]">All Categories</h1>
      <ul className="mt-8 flex flex-col gap-3">
        {categories.map((category) => (
          <li key={category.slug}>
            <Link
              href={`/categories/${category.slug}`}
              className="block rounded-md border border-[var(--color-border)] bg-[var(--color-paper-raised)] p-4 hover:border-[var(--color-ink)]"
            >
              <h2 className="font-serif text-lg text-[var(--color-ink)]">{category.name}</h2>
              {category.description && (
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  {category.description}
                </p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
