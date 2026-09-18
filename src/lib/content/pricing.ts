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
