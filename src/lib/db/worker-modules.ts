/**
 * Registry for the Cloudflare-Workers-only modules.
 *
 * The app code in src/ never imports @opennextjs/cloudflare, @prisma/adapter-neon or
 * @neondatabase/serverless at runtime, so the Node/Vercel build neither loads nor bundles
 * them. The Workers entry (cloudflare/worker.js) imports them and registers them here
 * before any request is handled; only the Workers-only branches (OPTICSSCOUT_RUNTIME =
 * "cloudflare-workers") read this registry. A static registry (not `await import()`) is
 * needed because the Prisma client proxy must return a client synchronously.
 */

import type { getCloudflareContext as GetCloudflareContext } from "@opennextjs/cloudflare";
import type { PrismaNeonHttp as PrismaNeonHttpClass } from "@prisma/adapter-neon";
import type { neon as NeonFn } from "@neondatabase/serverless";

export interface WorkerModules {
  getCloudflareContext: typeof GetCloudflareContext;
  PrismaNeonHttp: typeof PrismaNeonHttpClass;
  neon: typeof NeonFn;
}

export const WORKER_MODULES_KEY = Symbol.for("opticsscout.workerModules");

export function workerModules(): WorkerModules {
  const mods = (globalThis as Record<symbol, WorkerModules | undefined>)[WORKER_MODULES_KEY];
  if (!mods) {
    throw new Error("Workers-only modules are not registered (expected cloudflare/worker.js as the entry)");
  }
  return mods;
}
