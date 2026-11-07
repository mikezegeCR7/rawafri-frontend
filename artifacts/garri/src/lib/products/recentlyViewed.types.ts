import type { ProductSummary } from "./types";

export type RecentlyViewedProduct = ProductSummary;

export type ProductView = {
  id: string;
  productId: string;
  viewedAt: string;
  product: RecentlyViewedProduct;
};
