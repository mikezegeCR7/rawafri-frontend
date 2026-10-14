export type WishlistProduct = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  minOrderQuantity: number;
  isActive: boolean;
  category: {
    id: string;
    name: string;
  };
  inventory: {
    stockQuantity: number;
  } | null;
};

export type WishlistItem = {
  id: string;
  productId: string;
  createdAt: string;
  product: WishlistProduct;
};