// GET /inventory only includes `product: true` (no nested category/inventory
// to avoid circularity), so this is intentionally a narrower shape than the
// full Product type used elsewhere.
export type InventoryProductSummary = {
  id: string;
  name: string;
  slug: string;
  price: string;
  imageUrl: string | null;
  minOrderQuantity: number;
  isActive: boolean;
};

export type InventoryRecord = {
  id: string;
  productId: string;
  product: InventoryProductSummary;
  stockQuantity: number;
  lowStockThreshold: number;
  availableQuantity: number;
  isLowStock: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UpdateInventoryAdminPayload = {
  stockQuantity?: number;
  lowStockThreshold?: number;
};