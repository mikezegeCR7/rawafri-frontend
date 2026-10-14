// Mirrors backend/prisma/schema.prisma Product, Category, Inventory models.
// Note: `price` comes back as a STRING from the API — Prisma's Decimal type
// serializes to a JSON string (e.g. "1450.00"), not a number. Always parse
// it with Number(product.price) before doing math or formatting.

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
};

export type Inventory = {
  id: string;
  productId: string;
  stockQuantity: number;
  lowStockThreshold: number;
};

export type Product = {
  id: string;
  categoryId: string;
  category: Category;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  minOrderQuantity: number;
  isActive: boolean;
  inventory: Inventory | null;
};

/** Whole naira normally; kobo only when the amount has them (e.g. after a % discount),
 * so a bank-transfer amount is never shown rounded. */
export const formatNaira = (n: number) =>
  `₦${n.toLocaleString("en-NG", {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;

/** Placeholder shown when a product has no imageUrl set yet. */
export const PRODUCT_IMAGE_FALLBACK = "/product-placeholder.svg";

// ─── Admin CRUD payloads ────────────────────────────────────────────────────

export type CreateProductPayload = {
  categoryId: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  imageUrl?: string;
  minOrderQuantity?: number;
  isActive?: boolean;
};

export type UpdateProductPayload = Partial<CreateProductPayload>;

export type CreateInventoryPayload = {
  productId: string;
  stockQuantity: number;
  lowStockThreshold?: number;
};

export type UpdateInventoryPayload = Partial<Omit<CreateInventoryPayload, "productId">>;