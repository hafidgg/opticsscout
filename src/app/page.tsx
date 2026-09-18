import Link from "next/link";
import { AffiliateDisclosure } from "@/components/affiliate/AffiliateDisclosure";
import { Hero } from "@/components/home/Hero";
import { FeaturedComparisonsCarousel } from "@/components/home/FeaturedComparisonsCarousel";
import type { FeaturedProductCardData } from "@/components/product/FeaturedProductCard";
import { getLowestPrice } from "@/lib/content/pricing";
import {
  getFeaturedProducts,
  getHomepageCategories,
  getIndexableGuideSummaries,
} from "@/lib/content/repository";

/**
 * Homepage per master brief §23. Real content: category list, a featured-products
 * carousel, and any indexable guides — all filtered the same way the sitemap is
 * (never surfaces non-promoted content, even on the homepage).
 */
export default async function HomePage() {
  const [categories, featuredProducts, featuredGuides] = await Promise.all([
    getHomepageCategories(),
    getFeaturedProducts(),
    getIndexableGuideSummaries(),
  ]);

  const featuredCards: FeaturedProductCardData[] = featuredProducts.map((product) => {
    const lowest = getLowestPrice(product.offers);
    const matchingOffer =
      product.offers.find((o) => o.price === lowest.price) ?? product.offers[0];
    return {
      productId: product.id,
      slug: product.slug,
      name: product.name,
      categoryLabel: product.category?.name ?? "",
      price: lowest.price,
      currency: lowest.currency,
      isMsrp: lowest.isMsrp,
      merchantId: matchingOffer?.merchantId ?? "",
      merchantName: matchingOffer?.merchant.name ?? "",
    };
  });

  return (
    <main className="flex-1">
      <Hero />

      <section className="mx-auto max-w-3xl px-6 py-12">
        <h2 className="font-serif text-xl text-[var(--color-ink)]">
          Featured Comparisons
        </h2>
        <div className="mt-4">
          <FeaturedComparisonsCarousel products={featuredCards} />
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-12">
        <h2 className="font-serif text-xl text-[var(--color-ink)]">Categories</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/categories/${category.slug}`}
              className="rounded-full border border-[var(--color-border)] px-4 py-1.5 text-sm text-[var(--color-ink)] hover:border-[var(--color-ink)]"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </section>

      {featuredGuides.length > 0 && (
        <section className="mx-auto max-w-3xl px-6 pb-12">
          <h2 className="font-serif text-xl text-[var(--color-ink)]">Guides</h2>
          <ul className="mt-4 flex flex-col gap-3">
            {featuredGuides.map((guide) => (
              <li key={guide.slug}>
                <Link
                  href={guide.canonicalPath ?? `/guides/${guide.slug}`}
                  className="block rounded-md border border-[var(--color-border)] bg-[var(--color-paper-raised)] p-4 hover:border-[var(--color-ink)]"
                >
                  <h3 className="font-serif text-lg text-[var(--color-ink)]">
                    {guide.title}
                  </h3>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mx-auto max-w-3xl px-6 pb-12">
        <AffiliateDisclosure />
      </div>
    </main>
  );
}
