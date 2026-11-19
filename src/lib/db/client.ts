import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
// Workers-only modules come from a registry filled by cloudflare/worker.js; nothing from
// @opennextjs/cloudflare or the Neon packages is imported (or bundled) on the Node path.
import { workerModules } from "./worker-modules";

declare global {
  var __prisma: PrismaClient | undefined;
}

// ---------------------------------------------------------------------------------------
// Vercel / Node path (unchanged): one module-global client, as before.
// ---------------------------------------------------------------------------------------
function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg(process.env.DATABASE_URL as string);
  return new PrismaClient({ adapter });
}

// ---------------------------------------------------------------------------------------
// Cloudflare Workers path: Workers forbid reusing an I/O object (a pg socket) across
// requests, so each request gets its own client with a single-connection pool, keyed by
// the request's ExecutionContext (OpenNext: "create a new client for each request").
// Selected only when the Worker sets OPTICSSCOUT_RUNTIME=cloudflare-workers (a wrangler
// var); that variable is never set on Vercel or in local `next build` / `next dev`.
// ---------------------------------------------------------------------------------------
const onWorkers = () => process.env.OPTICSSCOUT_RUNTIME === "cloudflare-workers";
const perRequest = new WeakMap<object, PrismaClient>();

// Worker-only driver switch (wrangler var OPTICSSCOUT_DB_DRIVER), default "pg":
//   "pg"        node-postgres over TCP: per request a new connection (TLS + SCRAM auth).
//   "neon-http" Neon serverless driver over HTTPS fetch (no socket, no SCRAM in the Worker).
//               Limitation: no transactions in HTTP mode; the runtime code only does reads
//               and single-row ClickEvent creates, which need none.
//   "neon-sql"  /search and the two click routes bypass Prisma (src/lib/db/neon-sql.ts);
//               any other Prisma use on the Worker (e.g. an unknown slug) uses neon-http.
function workerAdapter() {
  const driver = process.env.OPTICSSCOUT_DB_DRIVER;
  if (driver === "neon-http" || driver === "neon-sql") {
    return new (workerModules().PrismaNeonHttp)(process.env.DATABASE_URL as string, {});
  }
  // PoolConfig, not a Pool instance: PrismaPg builds its own single-connection pool.
  return new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 1 });
}

function workerClient(): PrismaClient {
  const ctx = workerModules().getCloudflareContext().ctx as object;
  let client = perRequest.get(ctx);
  if (!client) {
    client = new PrismaClient({ adapter: workerAdapter() });
    perRequest.set(ctx, client);
  }
  return client;
}

function nodeClient(): PrismaClient {
  const client = globalThis.__prisma ?? createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalThis.__prisma = client;
  }
  return client;
}

// On Node the global client is created eagerly at import, exactly as before. Inside the
// Workers runtime (navigator.userAgent "Cloudflare-Workers") it never is, even if this
// module is evaluated before the Worker's vars reach process.env.
const inWorkersRuntime =
  typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";
const nodePrisma: PrismaClient | null = onWorkers() || inWorkersRuntime ? null : nodeClient();

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = onWorkers() ? workerClient() : (nodePrisma ?? nodeClient());
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
