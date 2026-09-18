import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getAlternativesBySlug,
  getAllAlternativesSlugs,
  getProductBySlug,
} from "@/lib/content/repository";
import { getLowestPrice } from "@/lib/content/pricing";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbJsonLd } from "@/lib/seo/structured-data";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { ProductCard, type ProductCardData } from "@/components/product/ProductCard";
import { AffiliateDisclosure } from "@/components/affiliate/AffiliateDisclosure";

/** Same required pipeline as the product page — see that file's header comment. */

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllAlternativesSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const resolved = await getAlternativesBySlug(slug);

  if (!resolved || !resolved.isIndexable) {
    return buildMetadata({
      metaTitle: null,
      metaDescription: null,
      canonicalPath: null,
      seoStatus: "NOINDEX",
      fallbackTitle: "Not found",
    });
  }

  const { sourceProduct } = resolved;
  return buildMetadata({
    metaTitle: `Alternatives to ${sourceProduct.name}`,
    metaDescription: sourceProduct.metaDescription,
    canonicalPath: `/alternatives/${sourceProduct.slug}`,
    seoStatus: sourceProduct.seoStatus,
    fallbackTitle: `Alternatives to ${sourceProduct.name}`,
  });
}

export default async function AlternativesPage({ params }: PageProps) {
  const { slug } = await params;
  const resolved = await getAlternativesBySlug(slug);

  if (!resolved || !resolved.isIndexable) {
    notFound();
  }

  const { sourceProduct, alternatives } = resolved;

  const cards: ProductCardData[] = await Promise.all(
    alternatives.map(async (product) => {
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
        categoryLabel: null,
      };
    })
  );

  const breadcrumbSegments = [
    { name: "Home", path: "/" },
    { name: sourceProduct.name, path: `/products/${sourceProduct.slug}` },
    { name: "Alternatives", path: `/alternatives/${sourceProduct.slug}` },
  ];

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbSegments)} />
      <Breadcrumbs segments={breadcrumbSegments} />

      <h1 className="mt-4 font-serif text-3xl text-[var(--color-ink)]">
        Alternatives to {sourceProduct.name}
      </h1>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <ProductCard key={card.slug} product={card} />
        ))}
      </div>

      <div className="mt-10">
        <AffiliateDisclosure />
      </div>
    </main>
  );
}
