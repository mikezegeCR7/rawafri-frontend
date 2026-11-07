// Mirrors backend/prisma/schema.prisma Product, Category, ProductUnit models.
// Note: unit `price` comes back as a STRING from the API — Prisma's Decimal
// type serializes to a JSON string (e.g. "1450.00"), not a number. Always
// parse it with Number(unit.price) before doing math or formatting.

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
};

/** One way a product is sold (Bag, Paint, Mudu…). Each has its own price and stock. */
export type ProductUnit = {
  id: string;
  productId: string;
  name: string;
  price: string;
  stockQuantity: number;
  lowStockThreshold: number;
  minOrderQuantity: number;
  sortOrder: number;
  isActive: boolean;
};

export type Product = {
  id: string;
  categoryId: string;
  category: Category;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  /** Public endpoints return active units only; the admin list returns all. */
  units: ProductUnit[];
};

/** The unit fields the shorter product shapes (wishlist, recently viewed,
 * recommended) carry. */
export type ProductUnitSummary = Pick<
  ProductUnit,
  "id" | "name" | "price" | "stockQuantity" | "minOrderQuantity" | "sortOrder"
>;

/** Product shape returned by wishlist, recently viewed and recommended. */
export type ProductSummary = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  category: { id: string; name: string };
  units: ProductUnitSummary[];
};

/** Whole naira normally; kobo only when the amount has them (e.g. after a % discount),
 * so a bank-transfer amount is never shown rounded. */
export const formatNaira = (n: number) =>
  `₦${n.toLocaleString("en-NG", {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;

/** Lowest unit price, for "from ₦…" labels. Null when there are no units. */
export function lowestPrice(units: Pick<ProductUnit, "price">[]): number | null {
  if (units.length === 0) return null;
  return Math.min(...units.map((u) => Number(u.price)));
}

/** Total stock across units — only meaningful as "is anything in stock". */
export const inStock = (units: Pick<ProductUnit, "stockQuantity">[]) =>
  units.some((u) => u.stockQuantity > 0);

/** Placeholder shown when a product has no imageUrl set yet. */
export const PRODUCT_IMAGE_FALLBACK = "/product-placeholder.svg";

/** Common Nigerian market measures offered in the admin unit picker. */
export const UNIT_PRESETS = ["Bag", "Half bag", "Paint", "Mudu", "Derica", "Cup", "Kg", "Piece"] as const;

// ─── Admin CRUD payloads ────────────────────────────────────────────────────

export type ProductUnitPayload = {
  /** Present for an existing unit; omit to add a new one. */
  id?: string;
  name: string;
  price: number;
  stockQuantity: number;
  lowStockThreshold?: number;
  minOrderQuantity?: number;
  sortOrder?: number;
};

export type CreateProductPayload = {
  categoryId: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
  /** Units left out on update are switched off (kept for past orders). */
  units: ProductUnitPayload[];
};

export type UpdateProductPayload = Partial<CreateProductPayload>;

export type UpdateUnitStockPayload = {
  stockQuantity?: number;
  lowStockThreshold?: number;
};
