import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCategoryBySlug, getAllCategorySlugs, getProductBySlug } from "@/lib/content/repository";
import { getLowestPrice } from "@/lib/content/pricing";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbJsonLd } from "@/lib/seo/structured-data";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { ProductCard, type ProductCardData } from "@/components/product/ProductCard";

/**
 * Category hub page (master brief §25). Unlike Product/Compare/Best/Guide, a
 * Category page doesn't have its own seoStatus/Quality Gate record in this
 * provisional model — it's a structural hub, always indexable if it exists, and only
 * ever lists products that are themselves INDEXABLE (never surfaces DRAFT/REVIEW
 * products just because they belong to the category).
 */

interface PageProps {
  params: Promise<{ category: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllCategorySlugs();
  return slugs.map((category) => ({ category }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: categorySlug } = await params;
  const resolved = await getCategoryBySlug(categorySlug);

  if (!resolved) {
    return buildMetadata({
      metaTitle: null,
      metaDescription: null,
      canonicalPath: null,
      seoStatus: "NOINDEX",
      fallbackTitle: "Not found",
    });
  }

  const { category } = resolved;
  return buildMetadata({
    metaTitle: `${category.name} — Compare and Buy`,
    metaDescription: category.description ?? undefined,
    canonicalPath: `/categories/${category.slug}`,
    // Category hubs are indexable as soon as they have at least one indexable
    // product — otherwise there's nothing real to show a crawler.
    seoStatus: "INDEXABLE",
    fallbackTitle: category.name,
  });
}

export default async function CategoryPage({ params }: PageProps) {
  const { category: categorySlug } = await params;
  const resolved = await getCategoryBySlug(categorySlug);

  if (!resolved) {
    notFound();
  }

  const { category, products } = resolved;

  const indexableProducts = products.filter((p) => p.seoStatus === "INDEXABLE");

  const cards: ProductCardData[] = await Promise.all(
    indexableProducts.map(async (product) => {
      const full = await getProductBySlug(product.slug);
      const lowest = getLowestPrice(full?.offers ?? []);
      return {
        slug: product.slug,
        name: product.name,
        shortDescription: product.shortDescription,
        brand: product.brand,
        lowestPrice: lowest.price,
        currency: lowest.currency,
        isMsrp: lowest.isMsrp,
        merchantCount: full?.offers.length ?? 0,
        categoryLabel: category.name,
      };
    })
  );

  const breadcrumbSegments = [
    { name: "Home", path: "/" },
    { name: category.name, path: `/categories/${category.slug}` },
  ];

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbSegments)} />
      <Breadcrumbs segments={breadcrumbSegments} />

      <h1 className="mt-4 font-serif text-3xl text-[var(--color-ink)]">{category.name}</h1>
      {category.description && (
        <p className="mt-2 text-base text-[var(--color-muted)]">{category.description}</p>
      )}

      {cards.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {cards.map((card) => (
            <ProductCard key={card.slug} product={card} />
          ))}
        </div>
      ) : (
        <p className="mt-8 text-sm text-[var(--color-muted)]">
          We&rsquo;re still building out coverage for this category — check back soon.
        </p>
      )}
    </main>
  );
}
