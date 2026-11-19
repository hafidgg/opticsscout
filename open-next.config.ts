import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// OpticsScout pages are fully static (generateStaticParams, no ISR/revalidation), so the
// read-only Static Assets incremental cache serves the build-time prerendered pages from
// Workers Static Assets (.open-next/assets/cdn-cgi/_next_cache) instead of rendering them
// per request. Cache interception answers cached routes without loading the Next server.
// No Queue or Tag Cache is needed for a site without revalidation.
// https://opennext.js.org/cloudflare/caching
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
  enableCacheInterception: true,
});
