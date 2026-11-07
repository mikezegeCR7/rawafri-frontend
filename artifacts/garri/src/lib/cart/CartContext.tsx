import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ProductUnitSummary } from "../products/types";

export type CartItem = {
  /** The selling unit's id — each unit of a product is its own basket line. */
  id: string;
  productId: string;
  name: string;
  /** e.g. "Bag", "Mudu". */
  unitName: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
  minOrderQuantity: number;
  categoryName: string;
  stockQuantity: number;
};

/** The product fields the basket needs. Full products, wishlist items and
 * recommended items all satisfy this. */
export type CartProductInput = {
  id: string;
  name: string;
  imageUrl: string | null;
  category?: { name: string } | null;
};

export type CartUnitInput = Pick<ProductUnitSummary, "id" | "name" | "price" | "stockQuantity" | "minOrderQuantity">;

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (product: CartProductInput, unit: CartUnitInput, quantity?: number) => void;
  updateQty: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const STORAGE_KEY = "rawafri.cart";

function loadInitialCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const saved = raw ? (JSON.parse(raw) as Partial<CartItem>[]) : [];
    // Baskets saved before selling units existed hold product ids, which the
    // backend no longer accepts — drop those lines.
    return saved.filter((i): i is CartItem => typeof i.productId === "string" && typeof i.unitName === "string");
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

  const addItem = useCallback((product: CartProductInput, unit: CartUnitInput, quantity?: number) => {
    const qty = quantity ?? unit.minOrderQuantity;
    setItems((prev) => {
      const existing = prev.find((i) => i.id === unit.id);
      if (existing) {
        return prev.map((i) =>
          i.id === unit.id ? { ...i, quantity: i.quantity + qty, stockQuantity: unit.stockQuantity } : i
        );
      }
      return [
        ...prev,
        {
          id: unit.id,
          productId: product.id,
          name: product.name,
          unitName: unit.name,
          price: Number(unit.price),
          imageUrl: product.imageUrl,
          quantity: qty,
          minOrderQuantity: unit.minOrderQuantity,
          categoryName: product.category?.name ?? "",
          stockQuantity: unit.stockQuantity,
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