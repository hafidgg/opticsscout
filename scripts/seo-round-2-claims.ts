/**
 * SEO round 2 (user-approved 2026-11-13): trust cleanup of unsupported claims on live
 * pages + one internal link to the new spotting-scope specs guide. Change list:
 * scripts/seo-round-2-claims.data.ts. Rollback: scripts/seo-round-2-claims-rollback.ts.
 *
 * Narrow by design: plain `update`s on exactly the listed rows/fields (no upserts), and
 * seoStatus is never written. Every field is guarded: if any field no longer holds its
 * expected old value, the script aborts before writing anything; all updates then run in
 * one transaction. No titles, meta descriptions, prices or offers are touched.
 *
 * Content pages are static: this goes live only on the next build
 * (docs/CONTENT_WORKFLOW.md). Run once; a re-run aborts on the guards.
 *
 * Run: npx tsx scripts/seo-round-2-claims.ts
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { ROUND2_CHANGES, type Round2Change } from "./seo-round-2-claims.data";

const adapter = new PrismaPg(process.env.DATABASE_URL as string);
const prisma = new PrismaClient({ adapter });

export async function applyChanges(
  client: PrismaClient,
  changes: Round2Change[],
  direction: "apply" | "rollback"
) {
  const expected = (c: Round2Change) => (direction === "apply" ? c.from : c.to);
  const target = (c: Round2Change) => (direction === "apply" ? c.to : c.from);

  const read = async (c: Round2Change): Promise<unknown> => {
    const select = { [c.field]: true } as Record<string, true>;
    const where = { id: c.id };
    const row =
      c.model === "product"
        ? await client.product.findUnique({ where, select })
        : c.model === "bestPage"
          ? await client.bestPage.findUnique({ where, select })
          : c.model === "comparison"
            ? await client.comparison.findUnique({ where, select })
            : await client.guide.findUnique({ where, select });
    if (!row) throw new Error(`${c.model} ${c.id} not found`);
    return (row as Record<string, unknown>)[c.field];
  };

  // Guards: every field must hold exactly the expected value before anything is written.
  for (const c of changes) {
    const current = await read(c);
    if (JSON.stringify(current) !== JSON.stringify(expected(c))) {
      throw new Error(`Guard failed — ${c.model} ${c.id}.${c.field} does not hold the expected value; nothing was written.`);
    }
  }

  // One update per row.
  const byRow = new Map<string, { model: Round2Change["model"]; id: string; data: Record<string, unknown> }>();
  for (const c of changes) {
    const key = `${c.model}:${c.id}`;
    const entry = byRow.get(key) ?? { model: c.model, id: c.id, data: {} };
    entry.data[c.field] = target(c);
    byRow.set(key, entry);
  }

  await client.$transaction(
    [...byRow.values()].map(({ model, id, data }) =>
      model === "product"
        ? client.product.update({ where: { id }, data })
        : model === "bestPage"
          ? client.bestPage.update({ where: { id }, data })
          : model === "comparison"
            ? client.comparison.update({ where: { id }, data })
            : client.guide.update({ where: { id }, data })
    )
  );

  for (const { model, id, data } of byRow.values()) {
    console.log(`${direction}: ${model} ${id}: ${Object.keys(data).join(", ")}`);
  }
}

async function main() {
  await applyChanges(prisma, ROUND2_CHANGES, "apply");
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
