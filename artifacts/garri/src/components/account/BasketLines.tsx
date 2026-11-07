import { useState } from "react";
import { Link } from "wouter";
import { MessageSquareText, Minus, Plus, X } from "lucide-react";
import { ITEM_NOTE_MAX, useCart, type CartItem } from "@/lib/cart/CartContext";
import { formatNaira } from "@/lib/products/types";
import { ProductImage } from "@/components/storefront/ProductImage";

/** Editable basket rows — used in Account → Basket and the first checkout step. */
export function BasketLines() {
  const { items, updateQty, removeItem } = useCart();

  return (
    <ul className="divide-y divide-border">
      {items.map((item) => {
        const atMin = item.quantity <= item.minOrderQuantity;
        const atMax = item.stockQuantity > 0 && item.quantity >= item.stockQuantity;
        return (
          <li key={item.id} className="flex gap-4 p-4 sm:p-5">
            <Link href={`/product/${item.productId}`} className="shrink-0">
              <ProductImage
                src={item.imageUrl}
                alt={item.name}
                className="size-20 rounded-md object-cover sm:size-24"
              />
            </Link>
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {item.categoryName && (
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{item.categoryName}</p>
                  )}
                  <Link href={`/product/${item.productId}`} className="mt-0.5 block font-semibold leading-snug text-foreground hover:underline underline-offset-4">
                    {item.name}
                    {item.unitName.toLowerCase() !== "unit" && (
                      <span className="font-normal text-muted-foreground"> · {item.unitName}</span>
                    )}
                  </Link>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatNaira(item.price)} {item.unitName.toLowerCase() === "unit" ? "each" : `per ${item.unitName.toLowerCase()}`}
                  </p>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  aria-label={`Remove ${item.name}`}
                  className="-mr-1 -mt-1 grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-destructive"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="mt-auto flex items-end justify-between gap-3 pt-3">
                <div className="flex h-9 items-center rounded-md border border-input bg-card">
                  <button
                    onClick={() => (atMin ? removeItem(item.id) : updateQty(item.id, item.quantity - 1))}
                    aria-label={atMin ? `Remove ${item.name}` : "Decrease quantity"}
                    className="grid h-full w-9 place-items-center text-foreground"
                  >
                    <Minus className="size-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm font-bold tabular-nums">{item.quantity}</span>
                  <button
                    onClick={() => updateQty(item.id, item.quantity + 1)}
                    disabled={atMax}
                    aria-label="Increase quantity"
                    className="grid h-full w-9 place-items-center text-foreground disabled:opacity-30"
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
                <p className="font-bold text-foreground">{formatNaira(item.price * item.quantity)}</p>
              </div>
              {item.minOrderQuantity > 1 && (
                <p className="mt-2 text-[11px] text-muted-foreground">Minimum order {item.minOrderQuantity}</p>
              )}
              <ItemNote item={item} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** The customer's request for one basket line — shown to the admin with the order. */
function ItemNote({ item }: { item: CartItem }) {
  const { setNote } = useCart();
  const [open, setOpen] = useState(Boolean(item.note));
  const value = item.note ?? "";

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-3 inline-flex items-center gap-1.5 self-start text-[13px] font-semibold text-brand hover:underline underline-offset-4"
      >
        <MessageSquareText className="size-3.5" /> Add a note for this item
      </button>
    );
  }

  return (
    <div className="mt-3">
      <label htmlFor={`note-${item.id}`} className="text-[12px] font-semibold text-foreground">
        Note for this item
      </label>
      <textarea
        id={`note-${item.id}`}
        value={value}
        onChange={(e) => setNote(item.id, e.target.value)}
        rows={2}
        maxLength={ITEM_NOTE_MAX}
        placeholder="e.g. pick out the stones, blend it, small pieces…"
        className="mt-1 w-full resize-none rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
      />
      <p className="text-right text-[11px] tabular-nums text-muted-foreground">
        {value.length}/{ITEM_NOTE_MAX}
      </p>
    </div>
  );
}
