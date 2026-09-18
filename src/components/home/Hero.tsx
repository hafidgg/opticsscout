/**
 * Homepage hero — dark, high-visual-weight band (deep pine, matching the site's
 * existing --color-ink token rather than a second, unrelated palette). The
 * ridge-line silhouette along the bottom edge is inline SVG, not a stock photo —
 * we don't have real, rights-cleared optics photography any more than we have
 * real product photos, so this stays abstract/vector until that changes.
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden bg-[var(--color-ink)] px-6 py-24">
      <div className="relative z-10 mx-auto max-w-2xl text-center">
        <h1 className="font-serif text-4xl leading-tight text-[var(--color-paper)]">
          Find the right optics. Compare real specs. Buy with confidence.
        </h1>
        <p className="mt-4 text-lg text-white/70">
          Independent, spec-driven comparisons of binoculars, spotting scopes, and
          rangefinders.
        </p>

        <form action="/search" className="mt-8 flex justify-center gap-2">
          <input
            type="text"
            name="q"
            placeholder="What are you looking for?"
            className="w-full max-w-md rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-sm text-[var(--color-paper)] placeholder:text-white/40 shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          />
          <button
            type="submit"
            className="rounded-lg bg-[var(--color-accent)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)]"
          >
            Search
          </button>
        </form>
      </div>

      {/* Ridge-line silhouette, bottom edge — abstract, not photographic. */}
      <svg
        aria-hidden="true"
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 h-16 w-full text-[var(--color-paper)]"
      >
        <path
          d="M0,120 L0,70 L120,95 L260,40 L380,80 L520,20 L640,65 L780,30 L900,75 L1040,45 L1200,90 L1200,120 Z"
          fill="currentColor"
        />
      </svg>

      {/* Faint lens/optics motif, top-right corner — decorative only. */}
      <svg
        aria-hidden="true"
        viewBox="0 0 200 200"
        className="pointer-events-none absolute -top-10 -right-10 h-48 w-48 opacity-10"
      >
        <circle cx="80" cy="100" r="55" fill="none" stroke="var(--color-paper)" strokeWidth="6" />
        <circle cx="150" cy="100" r="40" fill="none" stroke="var(--color-paper)" strokeWidth="6" />
      </svg>
    </section>
  );
}
