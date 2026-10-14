import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Product } from "../products/types";

export type CartItem = {
  /** Same as the source product's id. */
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
  minOrderQuantity: number;
  categoryName: string;
  stockQuantity: number;
};

/** The product fields the basket needs. Full products, wishlist items and
 * recommended items all satisfy this. */
export type CartProductInput = Pick<Product, "id" | "name" | "price" | "imageUrl" | "minOrderQuantity"> & {
  category?: { name: string } | null;
  inventory?: { stockQuantity: number } | null;
};

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (product: CartProductInput, quantity?: number) => void;
  updateQty: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const STORAGE_KEY = "rawafri.cart";

function loadInitialCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadInitialCart);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage full or unavailable — cart just won't persist across reloads.
    }
  }, [items]);

  const addItem = useCallback((product: CartProductInput, quantity?: number) => {
    const qty = quantity ?? product.minOrderQuantity;
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + qty } : i
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: Number(product.price),
          imageUrl: product.imageUrl,
          quantity: qty,
          minOrderQuantity: product.minOrderQuantity,
          categoryName: product.category?.name ?? "",
          stockQuantity: product.inventory?.stockQuantity ?? 0,
        },
      ];
    });
  }, []);

  const updateQty = useCallback((id: string, quantity: number) => {
    setItems((prev) => {
      if (quantity < 1) return prev.filter((i) => i.id !== id);
      return prev.map((i) => (i.id === id ? { ...i, quantity } : i));
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items]
  );
  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const value = useMemo<CartContextValue>(
    () => ({ items, itemCount, subtotal, addItem, updateQty, removeItem, clearCart }),
    [items, itemCount, subtotal, addItem, updateQty, removeItem, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}