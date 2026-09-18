import Link from "next/link";

/**
 * Site-wide footer navigation to the trust pages (About, How We Test, Editorial
 * Policy, Affiliate Disclosure, Privacy, Terms, Contact). Distinct from
 * AffiliateDisclosure — that snippet is placed near affiliate CTAs specifically
 * (MONETIZATION.md §4); this is general site navigation, rendered once per page
 * via the root layout.
 */
const FOOTER_LINKS: { href: string; label: string }[] = [
  { href: "/about", label: "About" },
  { href: "/how-we-test", label: "How We Test" },
  { href: "/editorial-policy", label: "Editorial Policy" },
  { href: "/affiliate-disclosure", label: "Affiliate Disclosure" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/contact", label: "Contact" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-paper-raised)]">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <nav aria-label="Site" className="flex flex-wrap gap-x-5 gap-y-2">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:underline"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="mt-4 text-xs text-[var(--color-muted)]">
          &copy; {new Date().getFullYear()} OpticsScout.
        </p>
      </div>
    </footer>
  );
}
