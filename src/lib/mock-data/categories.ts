/**
 * MOCK DATA — see merchants.ts header note. Small, representative set only — per
 * Phase 3 instructions, not hundreds/thousands of records.
 */

import type { Category } from "@prisma/client";

export const MOCK_CATEGORIES: Omit<Category, "createdAt" | "updatedAt">[] = [
  {
    id: "category_desks",
    name: "Standing Desks",
    slug: "desks",
    description:
      "Sit-stand desks for home offices — electric and manual, single and dual motor.",
    parentId: null,
  },
  {
    id: "category_chairs",
    name: "Ergonomic Chairs",
    slug: "chairs",
    description:
      "Office chairs built for long sitting sessions, with adjustable lumbar support and armrests.",
    parentId: null,
  },
];
