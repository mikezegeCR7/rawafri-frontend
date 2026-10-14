import { Plus, Check, Heart } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { formatNaira } from "@/lib/products/types";
import { ProductImage } from "@/components/storefront/ProductImage";
import { useCart, type CartProductInput } from "@/lib/cart/CartContext";
import { useWishlist } from "@/lib/wishlist/useWishlist";
import { cn } from "@/lib/utils";

/** Works with full products, wishlist items, recently viewed and recommended items. */
export type CardProduct = CartProductInput & {
  isActive?: boolean;
  category: { name: string };
};

export function ProductCard({ product }: { product: CardProduct }) {
  const { addItem } = useCart();
  const { isWishlisted, toggle, isPending } = useWishlist();
  const [, navigate] = useLocation();
  const [justAdded, setJustAdded] = useState(false);
  const unavailable = product.isActive === false;
  const outOfStock = (product.inventory?.stockQuantity ?? 0) <= 0;
  const wishlisted = isWishlisted(product.id);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (outOfStock || unavailable) return;
    addItem(product);
    toast.success(`${product.name} added to your basket`, {
      action: { label: "View basket", onClick: () => navigate("/checkout") },
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1400);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggle(product.id);
  };

  return (
    <article
      onClick={() => navigate(`/product/${product.id}`)}
      className="group flex cursor-pointer flex-col"
    >
      <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          width={512}
          height={512}
          className={cn(
            "size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]",
            (outOfStock || unavailable) && "opacity-60 grayscale-[35%]",
          )}
        />
        {(outOfStock || unavailable) && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-cocoa/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-background">
            {unavailable ? "Unavailable" : "Out of stock"}
          </span>
        )}
        <button
          onClick={handleToggleWishlist}
          disabled={isPending}
          aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          className="absolute right-2.5 top-2.5 grid size-8 place-items-center rounded-full bg-background/90 shadow-sm backdrop-blur-sm transition hover:bg-background disabled:opacity-50"
        >
          <Heart
            className={cn("size-4 transition-colors", wishlisted ? "fill-terracotta text-terracotta" : "text-foreground/70")}
          />
        </button>
      </div>

      <div className="flex flex-1 flex-col pt-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{product.category.name}</p>
        <h3 className="mt-1 line-clamp-2 text-[15px] font-semibold leading-snug text-foreground">{product.name}</h3>
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div>
            <p className="text-base font-bold text-foreground">{formatNaira(Number(product.price))}</p>
            {product.minOrderQuantity > 1 && (
              <p className="text-[11px] text-muted-foreground">Min. order {product.minOrderQuantity}</p>
            )}
          </div>
          <button
            onClick={handleAdd}
            disabled={outOfStock || unavailable}
            aria-label={`Add ${product.name} to basket`}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-[13px] font-semibold transition active:scale-95 disabled:pointer-events-none disabled:opacity-40",
              justAdded
                ? "bg-brand text-brand-foreground"
                : "border border-brand/30 text-brand hover:bg-brand hover:text-brand-foreground",
            )}
          >
            {justAdded ? <Check className="size-4" strokeWidth={2.5} /> : <Plus className="size-4" strokeWidth={2.5} />}
            {justAdded ? "Added" : "Add"}
          </button>
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-square rounded-lg bg-muted" />
      <div className="mt-3 h-3 w-16 rounded bg-muted" />
      <div className="mt-2 h-4 w-4/5 rounded bg-muted" />
      <div className="mt-4 flex items-center justify-between">
        <div className="h-5 w-20 rounded bg-muted" />
        <div className="h-9 w-16 rounded-md bg-muted" />
      </div>
    </div>
  );
}
