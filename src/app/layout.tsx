import type { Metadata } from "next";
import "./globals.css";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { isOnFinalDomain } from "@/lib/seo/metadata";
import { buildOrganizationJsonLd, buildWebSiteJsonLd } from "@/lib/seo/structured-data";
import { JsonLd } from "@/components/seo/JsonLd";

/**
 * Site-wide default robots directive. Routes that call buildMetadata() (see
 * lib/seo/metadata.ts) override this per-page based on seoStatus; this is the
 * fallback for any route — like the homepage — that has no generateMetadata of its
 * own, so noindex-while-on-a-non-final-domain is never silently skipped just because
 * a page didn't opt into the shared metadata builder.
 */
export const metadata: Metadata = {
  title: {
    default: "OpticsScout — Find, Compare, Decide",
    template: "%s | OpticsScout",
  },
  description:
    "Independent, spec-driven comparisons and buying guides to help you decide what to buy.",
  robots: isOnFinalDomain() ? { index: true, follow: true } : { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        <JsonLd data={buildOrganizationJsonLd()} />
        <JsonLd data={buildWebSiteJsonLd()} />
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
