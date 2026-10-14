"use client";

import type { MouseEvent } from "react";
import type { ClickBeacon, OutboundLink } from "@/lib/affiliate/outbound";

/**
 * CTA button for an affiliate offer. The link itself is resolved server-side by
 * resolveOutboundLink() (lib/affiliate/outbound.ts):
 * - Amazon: a direct amazon.com/dp/<ASIN> link (tagged when AMAZON_ASSOCIATE_TAG is
 *   set), rel without `noreferrer`, with the click recorded via a fire-and-forget
 *   beacon to POST /api/click-event — no redirect through our own endpoint.
 * - Other merchants: the first-party tracking redirect /api/click/[productId]/[merchantId].
 *
 * Never renders aggressive copy like "BUY NOW!!!" — see Section 24.
 */

interface AffiliateButtonProps {
  /** Resolved server-side by resolveOutboundLink(). */
  link: OutboundLink;
  merchantName: string;
  price?: number | null;
  currency?: string;
  /** True when price is a manufacturer MSRP, not a live price from this merchant. */
  isMsrp?: boolean;
}

/** Fire-and-forget click record for direct (non-redirect) links. Never throws and
 *  never delays navigation: the <a> navigates on its own. */
function sendClickBeacon(beacon: ClickBeacon) {
  try {
    const body = JSON.stringify(beacon);
    if (navigator.sendBeacon?.("/api/click-event", new Blob([body], { type: "application/json" }))) {
      return;
    }
    void fetch("/api/click-event", {
      method: "POST",
      body,
      keepalive: true,
      headers: { "Content-Type": "application/json" },
    }).catch(() => {});
  } catch {
    // Silent by design — tracking must never affect the visitor.
  }
}

export function AffiliateButton({
  link,
  merchantName,
  price,
  currency = "USD",
  isMsrp = false,
}: AffiliateButtonProps) {
  const beacon = link.beacon;
  const onClick = beacon ? () => sendClickBeacon(beacon) : undefined;
  // Middle-click only (button 1); right-click opens a menu, not a navigation.
  const onAuxClick = beacon
    ? (event: MouseEvent<HTMLAnchorElement>) => {
        if (event.button === 1) sendClickBeacon(beacon);
      }
    : undefined;

  return (
    <a
      href={link.href}
      rel={link.rel}
      target="_blank"
      onClick={onClick}
      onAuxClick={onAuxClick}
      className="inline-flex items-center justify-between gap-3 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-900 shadow-sm transition hover:border-neutral-400 hover:shadow"
    >
      <span>Check price at {merchantName}</span>
      {typeof price === "number" && (
        <span className="text-neutral-500">
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency,
          }).format(price)}
          {isMsrp && " MSRP"}
        </span>
      )}
    </a>
  );
}
