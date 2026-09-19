import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getGuideBySlug, getAllGuideSlugs, getProductBySlug } from "@/lib/content/repository";
import { getLowestPrice } from "@/lib/content/pricing";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildArticleJsonLd } from "@/lib/seo/structured-data";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { ProductCard, type ProductCardData } from "@/components/product/ProductCard";
import { AffiliateDisclosure } from "@/components/affiliate/AffiliateDisclosure";

/** Same required pipeline as the product page — see that file's header comment. */

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllGuideSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const resolved = await getGuideBySlug(slug);

  if (!resolved || !resolved.isIndexable) {
    return buildMetadata({
      metaTitle: null,
      metaDescription: null,
      canonicalPath: null,
      seoStatus: "NOINDEX",
      fallbackTitle: "Not found",
    });
  }

  const { guide } = resolved;
  return buildMetadata({
    metaTitle: guide.metaTitle,
    metaDescription: guide.metaDescription,
    canonicalPath: guide.canonicalPath,
    seoStatus: guide.seoStatus,
    fallbackTitle: guide.title,
  });
}

export default async function GuidePage({ params }: PageProps) {
  const { slug } = await params;
  const resolved = await getGuideBySlug(slug);

  if (!resolved || !resolved.isIndexable) {
    notFound();
  }

  const { guide, products, category } = resolved;

  const cards: ProductCardData[] = await Promise.all(
    products.map(async (product) => {
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
    ...(category
      ? [{ name: category.name, path: `/categories/${category.slug}` }]
      : []),
    { name: guide.title, path: guide.canonicalPath ?? `/guides/${guide.slug}` },
  ];

  const articleJsonLd = buildArticleJsonLd({
    title: guide.title,
    description: guide.metaDescription,
    canonicalPath: guide.canonicalPath,
    datePublished: guide.createdAt,
    dateModified: guide.updatedAt,
  });

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <JsonLd data={articleJsonLd} />
      <Breadcrumbs segments={breadcrumbSegments} />

      <h1 className="mt-4 font-serif text-3xl text-[var(--color-ink)]">{guide.title}</h1>

      {guide.content && (
        <p className="mt-6 text-base leading-relaxed text-[var(--color-ink)]">
          {guide.content}
        </p>
      )}

      {cards.length > 0 && (
        <div className="mt-8">
          <h2 className="font-serif text-lg text-[var(--color-ink)]">Our picks</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {cards.map((card) => (
              <ProductCard key={card.slug} product={card} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-10">
        <AffiliateDisclosure />
      </div>
    </main>
  );
}
