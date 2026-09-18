import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getComparisonBySlug, getAllComparisonSlugs } from "@/lib/content/repository";
import { getLowestPrice } from "@/lib/content/pricing";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbJsonLd } from "@/lib/seo/structured-data";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { ComparisonTable } from "@/components/comparison/ComparisonTable";
import { AffiliateDisclosure } from "@/components/affiliate/AffiliateDisclosure";

/** Same required pipeline as the product page — see that file's header comment. */

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllComparisonSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const resolved = await getComparisonBySlug(slug);

  if (!resolved || !resolved.isIndexable) {
    return buildMetadata({
      metaTitle: null,
      metaDescription: null,
      canonicalPath: null,
      seoStatus: "NOINDEX",
      fallbackTitle: "Not found",
    });
  }

  const { comparison } = resolved;
  return buildMetadata({
    metaTitle: comparison.metaTitle,
    metaDescription: comparison.metaDescription,
    canonicalPath: comparison.canonicalPath,
    seoStatus: comparison.seoStatus,
    fallbackTitle: comparison.title,
  });
}

export default async function ComparePage({ params }: PageProps) {
  const { slug } = await params;
  const resolved = await getComparisonBySlug(slug);

  if (!resolved || !resolved.isIndexable) {
    notFound();
  }

  const { comparison, products, productOffers } = resolved;

  const tableProducts = products.map((product) => {
    const offers = productOffers[product.id] ?? [];
    const lowest = getLowestPrice(offers);
    return {
      slug: product.slug,
      name: product.name,
      lowestPrice: lowest.price,
      currency: lowest.currency,
      isMsrp: lowest.isMsrp,
      specifications: product.specifications as Record<string, unknown> | null,
      pros: product.pros,
      cons: product.cons,
      bestForLabel: null as string | null,
    };
  });

  if (tableProducts[0]) tableProducts[0].bestForLabel = "Top pick";

  const breadcrumbSegments = [
    { name: "Home", path: "/" },
    { name: "Compare", path: "/compare" },
    { name: comparison.title, path: comparison.canonicalPath ?? `/compare/${comparison.slug}` },
  ];

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbSegments)} />
      <Breadcrumbs segments={breadcrumbSegments} />

      <h1 className="mt-4 font-serif text-3xl text-[var(--color-ink)]">
        {comparison.title}
      </h1>

      <div className="mt-8">
        <ComparisonTable products={tableProducts} />
      </div>

      {comparison.verdict && (
        <div className="mt-8 rounded-md border border-[var(--color-border)] bg-[var(--color-paper-raised)] p-4">
          <h2 className="font-serif text-lg text-[var(--color-ink)]">Verdict</h2>
          <p className="mt-2 text-sm text-[var(--color-ink)]">{comparison.verdict}</p>
        </div>
      )}

      <div className="mt-10">
        <AffiliateDisclosure />
      </div>
    </main>
  );
}
