import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db/client";

/**
 * POST /api/click-event — records a ClickEvent for direct (non-redirect) outbound
 * links, sent by AffiliateButton via navigator.sendBeacon / fetch keepalive. Same
 * fields and anonymous session cookie as GET /api/click. Only an existing, active
 * offer is recorded. Always answers 204 — failures are silent to the visitor.
 */

const clip = (value: unknown, max: number) =>
  typeof value === "string" && value ? value.slice(0, max) : "unknown";

export async function POST(request: NextRequest) {
  const done = new NextResponse(null, { status: 204 });
  try {
    const body = await request.json().catch(() => null);
    const productId = body?.productId;
    const merchantId = body?.merchantId;
    if (typeof productId !== "string" || typeof merchantId !== "string") return done;

    const offer = await prisma.productOffer.findUnique({
      where: { productId_merchantId: { productId, merchantId } },
      include: { merchant: true },
    });
    if (!offer || !offer.active || !offer.merchant.active) return done;

    const existing = request.cookies.get("anon_session_id")?.value;
    const sessionId = existing ?? randomUUID();

    await prisma.clickEvent.create({
      data: {
        productId,
        merchantId,
        page: clip(body.page, 300),
        placement: clip(body.placement, 100),
        sessionId,
      },
    });

    // Anonymous session cookie only — no identity, no PII (Section 18/19).
    if (!existing) {
      done.cookies.set("anon_session_id", sessionId, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }
  } catch (error) {
    console.error("click-event: failed to record (ignored):", error);
  }
  return done;
}
