/**
 * cuid v1-format id generator for the Workers raw-SQL path (src/lib/db/neon-sql.ts).
 *
 * Prisma's `@default(cuid())` is generated client-side (the ClickEvent.id column has no
 * database default), so a raw INSERT must supply its own id. This produces the same
 * shape Prisma does: 25 chars = "c" + timestamp(8, base36) + counter(4) + fingerprint(4)
 * + random(8). Ids are opaque (only used as the primary key); nothing parses them.
 */

const BASE = 36;
const BLOCK = 4;
const DISCRETE = BASE ** BLOCK;

const pad = (s: string, size: number) => s.padStart(size, "0").slice(-size);
const randomBlock = () => {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % DISCRETE;
  return pad(n.toString(BASE), BLOCK);
};

let counter = Math.floor(Math.random() * DISCRETE);
// Per-isolate fingerprint (cuid v1 derives it from pid + hostname, unavailable here).
const fingerprint = randomBlock();

export function cuid(): string {
  counter = counter < DISCRETE - 1 ? counter + 1 : 0;
  return (
    "c" +
    pad(Date.now().toString(BASE), 8) +
    pad(counter.toString(BASE), BLOCK) +
    fingerprint +
    randomBlock() +
    randomBlock()
  );
}
