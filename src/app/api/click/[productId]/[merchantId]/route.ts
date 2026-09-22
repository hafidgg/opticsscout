import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getAffiliateUrl } from "@/lib/affiliate";
import { prisma } from "@/lib/db/client";

/**
 * GET /api/click/[productId]/[merchantId]
 *
 * Resolves the ProductOffer + Merchant, builds the affiliate URL via the central
 * service, records a first-party ClickEvent (no PII — see Section 18), then 302s to
 * the resolved URL.
 *
 * Open-redirect safety: `productId`/`merchantId` are used ONLY as a lookup key into
 * ProductOffer via its (productId, merchantId) unique constraint — the redirect
 * destination always comes from that DB row's own `url`/`affiliateUrl`, never from any
 * request-supplied value. There is no way to make this route redirect anywhere other
 * than a URL a site operator has actually stored.
 *
 * Inactive-offer safety: an offer or merchant with `active: false` 404s here exactly
 * like a nonexistent one — a stale/shared link to a since-disabled offer never
 * produces a working redirect, matching what the public pages already refuse to
 * render (see ACTIVE_OFFER_FILTER in lib/content/repository.ts).
 */

function getOrCreateSessionId(request: NextRequest): string {
  const existing = request.cookies.get("anon_session_id")?.value;
  return existing ?? randomUUID();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string; merchantId: string }> }
) {
  const { productId, merchantId } = await params;
  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page") ?? "unknown";
  const placement = searchParams.get("placement") ?? "unknown";

  const [offer, merchant] = await Promise.all([
    prisma.productOffer.findUnique({ where: { productId_merchantId: { productId, merchantId } } }),
    prisma.merchant.findUnique({ where: { id: merchantId } }),
  ]);

  if (!offer || !merchant || !offer.active || !merchant.active) {
    return NextResponse.json(
      { error: "Offer or merchant not found" },
      { status: 404 }
    );
  }

  const sessionId = getOrCreateSessionId(request);

  const { url } = getAffiliateUrl(
    { url: offer.url, productId: offer.productId },
    merchant,
    placement
  );

  // Never let a tracking failure block the redirect — the user reaching the merchant
  // matters more than one lost click record. Errors are swallowed, not surfaced.
  try {
    await prisma.clickEvent.create({
      data: { productId, merchantId, page, placement, sessionId },
    });
  } catch (error) {
    console.error("Failed to record ClickEvent (navigation proceeds regardless):", error);
  }

  const response = NextResponse.redirect(url, { status: 302 });

  // Anonymous session cookie only — no identity, no PII (Section 18/19).
  if (!request.cookies.get("anon_session_id")) {
    response.cookies.set("anon_session_id", sessionId, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }

  return response;
}
