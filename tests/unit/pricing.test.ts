import { describe, it, expect } from "vitest";
import { getLowestOffer, getLowestPrice } from "@/lib/content/pricing";

describe("getLowestOffer", () => {
  it("returns null for an empty offer list", () => {
    expect(getLowestOffer([])).toBeNull();
  });

  it("returns the single offer when there's only one", () => {
    const offer = { id: "a", price: 100 };
    expect(getLowestOffer([offer])).toBe(offer);
  });

  it("returns the cheapest of multiple priced offers", () => {
    const cheap = { id: "cheap", price: 50 };
    const mid = { id: "mid", price: 75 };
    const expensive = { id: "expensive", price: 200 };
    expect(getLowestOffer([expensive, cheap, mid])).toBe(cheap);
  });

  it("ignores unpriced offers when at least one priced offer exists", () => {
    const unpriced = { id: "unpriced", price: null };
    const priced = { id: "priced", price: 42 };
    expect(getLowestOffer([unpriced, priced])).toBe(priced);
  });

  it("falls back to the first offer when none are priced", () => {
    const first = { id: "first", price: null };
    const second = { id: "second", price: null };
    expect(getLowestOffer([first, second])).toBe(first);
  });
});

describe("getLowestPrice (existing behavior unchanged)", () => {
  it("still returns null price for an empty offer list", () => {
    expect(getLowestPrice([])).toEqual({ price: null, currency: "USD", isMsrp: false });
  });

  it("still picks the cheapest priced offer", () => {
    const result = getLowestPrice([
      { price: 200, currency: "USD", isMsrp: false },
      { price: 50, currency: "USD", isMsrp: true },
    ]);
    expect(result.price).toBe(50);
    expect(result.isMsrp).toBe(true);
  });
});
