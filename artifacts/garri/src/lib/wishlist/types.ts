import type { ProductSummary } from "../products/types";

export type WishlistProduct = ProductSummary;

export type WishlistItem = {
  id: string;
  productId: string;
  createdAt: string;
  product: WishlistProduct;
};
