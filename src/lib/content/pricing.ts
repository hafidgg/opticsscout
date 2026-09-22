/** Shared helper: lowest available price across a set of offers, or null if none priced. */
export function getLowestPrice(
  offers: { price: number | null; currency: string; isMsrp: boolean }[]
): { price: number | null; currency: string; isMsrp: boolean } {
  const priced = offers.filter(
    (o): o is { price: number; currency: string; isMsrp: boolean } => o.price !== null
  );
  if (priced.length === 0) {
    return { price: null, currency: offers[0]?.currency ?? "USD", isMsrp: false };
  }
  const lowest = priced.reduce((min, o) => (o.price < min.price ? o : min));
  return lowest;
}

/** Same ordering as getLowestPrice, but returns the whole offer object (not just its
 *  price fields) — for callers that need to build a CTA from it (e.g. a merchant name
 *  / id to link through /api/click), not just display a number. Priced offers sort
 *  first (cheapest first); an unpriced offer is only returned if none are priced at
 *  all. Returns null only when `offers` itself is empty. */
export function getLowestOffer<T extends { price: number | null }>(offers: T[]): T | null {
  if (offers.length === 0) return null;
  const priced = offers.filter((o): o is T & { price: number } => o.price !== null);
  if (priced.length === 0) return offers[0];
  return priced.reduce((min, o) => (o.price < min.price ? o : min));
}
