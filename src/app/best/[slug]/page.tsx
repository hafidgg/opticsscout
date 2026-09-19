import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBestPageBySlug, getAllBestPageSlugs } from "@/lib/content/repository";
import { getLowestPrice } from "@/lib/content/pricing";
import { buildMetadata } from "@/lib/seo/metadata";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { ProductCard, type ProductCardData } from "@/components/product/ProductCard";
import { AffiliateDisclosure } from "@/components/affiliate/AffiliateDisclosure";

/** Same required pipeline as the product page — see that file's header comment. */

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllBestPageSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const resolved = await getBestPageBySlug(slug);

  if (!resolved || !resolved.isIndexable) {
    return buildMetadata({
      metaTitle: null,
      metaDescription: null,
      canonicalPath: null,
      seoStatus: "NOINDEX",
      fallbackTitle: "Not found",
    });
  }

  const { bestPage } = resolved;
  return buildMetadata({
    metaTitle: bestPage.metaTitle,
    metaDescription: bestPage.metaDescription,
    canonicalPath: bestPage.canonicalPath,
    seoStatus: bestPage.seoStatus,
    fallbackTitle: bestPage.title,
  });
}

export default async function BestPage({ params }: PageProps) {
  const { slug } = await params;
  const resolved = await getBestPageBySlug(slug);

  if (!resolved || !resolved.isIndexable) {
    notFound();
  }

  const { bestPage, products, productOffers } = resolved;

  const cards: ProductCardData[] = products.map((product) => {
    const offers = productOffers[product.id] ?? [];
    const lowest = getLowestPrice(offers);
    return {
      slug: product.slug,
      name: product.name,
      shortDescription: product.shortDescription,
      brand: product.brand,
      lowestPrice: lowest.price,
      currency: lowest.currency,
      isMsrp: lowest.isMsrp,
      merchantCount: offers.length,
      categoryLabel: null,
    };
  });

  const breadcrumbSegments = [
    { name: "Home", path: "/" },
    { name: bestPage.title, path: bestPage.canonicalPath ?? `/best/${bestPage.slug}` },
  ];

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Breadcrumbs segments={breadcrumbSegments} />

      <h1 className="mt-4 font-serif text-3xl text-[var(--color-ink)]">{bestPage.title}</h1>

      {/* No "Top pick" badge on card position 0: `position` here is just the order
          products were added in, not a scored/documented ranking — see bestPage.verdict
          below for this page's actual, sourced conclusion. */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <ProductCard key={card.slug} product={card} />
        ))}
      </div>

      {bestPage.verdict && (
        <div className="mt-8 rounded-md border border-[var(--color-border)] bg-[var(--color-paper-raised)] p-4">
          <h2 className="font-serif text-lg text-[var(--color-ink)]">Verdict</h2>
          <p className="mt-2 text-sm text-[var(--color-ink)]">{bestPage.verdict}</p>
        </div>
      )}

      <div className="mt-10">
        <AffiliateDisclosure />
      </div>
    </main>
  );
}
