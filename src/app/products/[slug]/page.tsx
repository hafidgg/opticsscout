import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getProductBySlug, getAllProductSlugs } from "@/lib/content/repository";
import { getLowestPrice } from "@/lib/content/pricing";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildProductJsonLd } from "@/lib/seo/structured-data";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { WhereToBuy } from "@/components/product/WhereToBuy";
import { ProductSpecifications } from "@/components/product/ProductSpecifications";
import { AffiliateDisclosure } from "@/components/affiliate/AffiliateDisclosure";
import { getRelatedLinksForProduct } from "@/lib/linking/internal-links";

/**
 * Product page. Follows the required pipeline:
 * page data (repository, which itself runs the Quality Gate)
 *   -> indexability decision (isIndexable)
 *   -> metadata (buildMetadata)
 *   -> canonical (from product.canonicalPath, inside buildMetadata)
 *   -> structured data (buildProductJsonLd)
 *   -> internal links (getRelatedLinksForProduct)
 *   -> render
 *
 * Only seoStatus === "INDEXABLE" products render publicly. Everything else 404s —
 * there is no preview/admin auth yet (Phase 3 explicitly defers admin), so the safest
 * correct behavior is to never expose non-promoted content on the public route at all.
 */

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  // Only pre-render slugs that actually resolve — Next.js will 404 anything else via
  // notFound() below regardless, this just controls what's built ahead of time.
  const slugs = await getAllProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const resolved = await getProductBySlug(slug);

  if (!resolved || !resolved.isIndexable) {
    // Metadata for a 404'd page — still noindex, never leaks real metadata for
    // non-promoted content.
    return buildMetadata({
      metaTitle: null,
      metaDescription: null,
      canonicalPath: null,
      seoStatus: "NOINDEX",
      fallbackTitle: "Not found",
    });
  }

  const { product } = resolved;
  return buildMetadata({
    metaTitle: product.metaTitle,
    metaDescription: product.metaDescription,
    canonicalPath: product.canonicalPath,
    seoStatus: product.seoStatus,
    fallbackTitle: product.name,
    fallbackDescription: product.shortDescription ?? undefined,
    images: product.images,
  });
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const resolved = await getProductBySlug(slug);

  if (!resolved || !resolved.isIndexable) {
    notFound();
  }

  const { product, category, offers, specSourceInfo, siblingProducts, comparisonLink } =
    resolved;
  const lowest = getLowestPrice(offers);

  const relatedLinks = getRelatedLinksForProduct(
    { ...product, alternativeSlugs: [], alternativeNames: [] },
    category?.name ?? null,
    category?.slug ?? null,
    siblingProducts,
    comparisonLink
  );

  const productJsonLd = buildProductJsonLd({
    product,
    offers: offers.map((o) => ({
      price: o.price,
      currency: o.currency,
      availability: o.availability,
      url: o.url,
      merchant: { name: o.merchant.name },
    })),
  });

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <JsonLd data={productJsonLd} />

      <Breadcrumbs
        segments={[
          { name: "Home", path: "/" },
          ...(category
            ? [{ name: category.name, path: `/categories/${category.slug}` }]
            : []),
          { name: product.name, path: `/products/${product.slug}` },
        ]}
      />

      <h1 className="mt-4 font-serif text-3xl text-[var(--color-ink)]">{product.name}</h1>
      {product.brand && (
        <p className="mt-1 text-sm text-[var(--color-muted)]">by {product.brand}</p>
      )}

      {product.shortDescription && (
        <p className="mt-4 text-lg text-[var(--color-ink)]">{product.shortDescription}</p>
      )}

      {lowest.price !== null && (
        <p className="mt-2 text-2xl font-medium text-[var(--color-accent)]">
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: lowest.currency,
          }).format(lowest.price)}
          {lowest.isMsrp && (
            <span className="ml-1 text-sm font-normal text-[var(--color-muted)]">
              MSRP
            </span>
          )}
        </p>
      )}

      <div className="mt-8">
        <WhereToBuy
          productId={product.id}
          page={`/products/${product.slug}`}
          offers={offers.map((o) => ({
            id: o.id,
            merchantId: o.merchantId,
            merchantName: o.merchant.name,
            price: o.price,
            currency: o.currency,
            isMsrp: o.isMsrp,
            availability: o.availability,
          }))}
        />
      </div>

      <ProductSpecifications
        specifications={product.specifications as Record<string, unknown> | null}
        sourceInfo={specSourceInfo}
      />

      {(product.pros.length > 0 || product.cons.length > 0) && (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {product.pros.length > 0 && (
            <div>
              <h2 className="font-serif text-lg text-[var(--color-good)]">Pros</h2>
              <ul className="mt-2 list-inside list-disc text-sm text-[var(--color-ink)]">
                {product.pros.map((pro) => (
                  <li key={pro}>{pro}</li>
                ))}
              </ul>
            </div>
          )}
          {product.cons.length > 0 && (
            <div>
              <h2 className="font-serif text-lg text-[var(--color-accent)]">Cons</h2>
              <ul className="mt-2 list-inside list-disc text-sm text-[var(--color-ink)]">
                {product.cons.map((con) => (
                  <li key={con}>{con}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {product.whoItsFor && (
        <div className="mt-8">
          <h2 className="font-serif text-lg text-[var(--color-ink)]">Who it&rsquo;s for</h2>
          <p className="mt-2 text-sm text-[var(--color-ink)]">{product.whoItsFor}</p>
        </div>
      )}

      {product.whoShouldAvoid && (
        <div className="mt-4">
          <h2 className="font-serif text-lg text-[var(--color-ink)]">Who should avoid it</h2>
          <p className="mt-2 text-sm text-[var(--color-ink)]">{product.whoShouldAvoid}</p>
        </div>
      )}

      {product.verdict && (
        <div className="mt-8 rounded-md border border-[var(--color-border)] bg-[var(--color-paper-raised)] p-4">
          <h2 className="font-serif text-lg text-[var(--color-ink)]">Our verdict</h2>
          <p className="mt-2 text-sm text-[var(--color-ink)]">{product.verdict}</p>
          <p className="mt-3 text-xs text-[var(--color-muted)]">
            Based on specifications, published information, and our evaluation
            framework — see{" "}
            <Link href="/how-we-test" className="underline">
              how we test
            </Link>
            .
          </p>
        </div>
      )}

      {relatedLinks.length > 0 && (
        <div className="mt-10 border-t border-[var(--color-border)] pt-6">
          <h2 className="font-serif text-lg text-[var(--color-ink)]">Related</h2>
          <ul className="mt-2 flex flex-wrap gap-3">
            {relatedLinks.map((link) => (
              <li key={link.path}>
                <Link
                  href={link.path}
                  className="text-sm text-[var(--color-ink)] underline hover:text-[var(--color-accent)]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-10">
        <AffiliateDisclosure />
      </div>
    </main>
  );
}
