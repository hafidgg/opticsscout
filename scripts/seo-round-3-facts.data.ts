/**
 * SEO round 3 change data (user-approved 2026-11-13): small factual fixes on the
 * rangefinder pages. Every `from` is the exact production value read on 2026-11-13
 * (after round 2); every `to` uses only stored fields or Vortex's product page
 * (https://vortexoptics.com/vortex-ranger-1300-rangefinder.html: "Primary HCD (Horizontal
 * Component Distance) mode displays an angle-compensated distance reading"; the word
 * "inclinometer" does not appear there). Used by scripts/seo-round-3-facts.ts (apply) and
 * scripts/seo-round-3-facts-rollback.ts. No titles, meta descriptions, seoStatus, prices
 * or offers are touched.
 */

import type { Round2Change as ContentChange } from "./seo-round-2-claims.data";

export const ROUND3_CHANGES: ContentChange[] = [
  {
    // a) The Leupold's reflective range (1400 yd) is LONGER than the Ranger's (1300 yd).
    model: "product",
    id: "product_leupold_rx_1400i_tbrw_gen2",
    field: "whoShouldAvoid",
    from: "Anyone who specifically wants Vortex's VIP warranty policy or the marginally longer reflective-target range should compare against the Ranger 1300 directly — see the comparison below.",
    to: "Anyone who specifically wants Vortex's VIP warranty policy should compare against the Ranger 1300 directly — see the comparison below.",
  },
  {
    // b) "maximum reflective-target range" was wrong (Leupold 1400 yd > Ranger 1300 yd).
    model: "product",
    id: "product_vortex_ranger_1300",
    field: "whoItsFor",
    from: "Hunters and long-range shooters who want maximum reflective-target range and Vortex's warranty policy, and who don't mind paying a premium over the Leupold.",
    to: "Hunters and long-range shooters who want Vortex's warranty policy and don't mind paying a premium over the Leupold. Per Vortex, it's rated to 1300 yards on reflective targets and 600 yards on deer-sized targets, with an angle-compensated (HCD) distance mode.",
  },
  {
    // c) "built-in inclinometer" is not on Vortex's page.
    model: "product",
    id: "product_vortex_ranger_1300",
    field: "description",
    from: "A 6x22 laser rangefinder from Vortex rated to 1300 yards on reflective targets and 600 yards on deer-sized targets, with a built-in inclinometer for angle-compensated (HCD) distance readings. Like every Vortex optic, it carries the brand's unconditional VIP lifetime warranty.",
    to: "A 6x22 laser rangefinder from Vortex rated to 1300 yards on reflective targets and 600 yards on deer-sized targets, with an angle-compensated (HCD) distance reading, per Vortex. Like every Vortex optic, it carries the brand's unconditional VIP lifetime warranty.",
  },
  {
    model: "product",
    id: "product_vortex_ranger_1300",
    field: "features",
    from: [
      "Angle-compensated (HCD) distance mode via built-in inclinometer",
      "Ranges in under 1 second",
      "2,000+ single-range battery life",
      "Vortex VIP unconditional lifetime warranty",
    ],
    to: [
      "Angle-compensated (HCD) distance reading, per Vortex",
      "Ranges in under 1 second",
      "2,000+ single-range battery life",
      "Vortex VIP unconditional lifetime warranty",
    ],
  },
  {
    // e) Drop the opinion; keep the numbers.
    model: "product",
    id: "product_vortex_ranger_1300",
    field: "verdict",
    from: "The headline 1300 yd figure is a reflective-target number — the 600 yd deer-target range is the more practically relevant spec for hunting use, versus 900 yd for the Leupold RX-1400i TBR/W Gen 2. Built from Vortex's own published specifications and MSRP, not hands-on field testing.",
    to: "The headline 1300 yd figure is a reflective-target number; its 600 yd deer-target range compares with 900 yd for the Leupold RX-1400i TBR/W Gen 2. Built from Vortex's own published specifications and MSRP, not hands-on field testing.",
  },
  {
    // d) Wording fix only.
    model: "comparison",
    id: "comparison_vortex_ranger_1300_vs_leupold_rx_1400i",
    field: "verdict",
    from: "The reflective-target ratings are close (1300 vs 1400 yd); on deer-sized targets the Leupold is rated 900 yd vs 600. The Leupold is also lighter (5.1 oz vs 7.7 oz) and less than half the Vortex's MSRP ($199.99 vs $449.99). The Vortex's real advantages are its VIP unconditional warranty and 1x higher magnification (6x vs 5x). If deer-target range and price are the deciding factors, the Leupold wins on the numbers; if the warranty policy matters more to you than either, that changes the calculation.",
    to: "The reflective-target ratings are close (1300 vs 1400 yd); on deer-sized targets the Leupold is rated 900 yd vs 600. The Leupold is also lighter (5.1 oz vs 7.7 oz) and less than half the Vortex's MSRP ($199.99 vs $449.99). The Vortex's real advantages are its VIP unconditional warranty and 6x vs 5x magnification. If deer-target range and price are the deciding factors, the Leupold wins on the numbers; if the warranty policy matters more to you than either, that changes the calculation.",
  },
];
