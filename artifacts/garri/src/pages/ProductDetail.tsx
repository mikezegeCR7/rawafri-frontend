import { useEffect, useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Minus, Plus, Heart, Landmark, Truck } from "lucide-react";
import { toast } from "sonner";
import { getProduct, getProductsByCategory, logProductView } from "@/lib/products/api";
import { formatNaira } from "@/lib/products/types";
import { ProductImage } from "@/components/storefront/ProductImage";
import { useCart } from "@/lib/cart/CartContext";
import { useWishlist } from "@/lib/wishlist/useWishlist";
import { useAuth } from "@/lib/auth/AuthContext";
import { SiteHeader } from "@/components/storefront/SiteHeader";
import { SiteFooter } from "@/components/storefront/SiteFooter";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { Eyebrow, btn } from "@/components/storefront/ui";
import { cn } from "@/lib/utils";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { addItem, items } = useCart();
  const { isWishlisted, toggle, isPending: wishlistPending } = useWishlist();
  const { isAuthenticated } = useAuth();

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ["product", id],
    queryFn: () => getProduct(id!),
    enabled: !!id,
  });

  const { data: related } = useQuery({
    queryKey: ["products", "category", product?.categoryId],
    queryFn: () => getProductsByCategory(product!.categoryId),
    enabled: !!product?.categoryId,
  });

  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (product) {
      setQty(product.minOrderQuantity);
    }
  }, [product]);

  useEffect(() => {
    if (id && isAuthenticated) {
      logProductView(id).catch(() => {
        // Non-critical — a failed view log shouldn't interrupt browsing.
      });
    }
  }, [id, isAuthenticated]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [id]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      {isLoading && (
        <main className="mx-auto grid w-full max-w-7xl animate-pulse gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="aspect-square rounded-lg bg-muted" />
          <div className="space-y-4 pt-4">
            <div className="h-3 w-24 rounded bg-muted" />
            <div className="h-10 w-3/4 rounded bg-muted" />
            <div className="h-7 w-32 rounded bg-muted" />
            <div className="h-20 w-full rounded bg-muted" />
          </div>
        </main>
      )}

      {(isError || (!isLoading && !product)) && (
        <main className="mx-auto w-full max-w-xl px-4 py-24 text-center">
          <p className="font-display text-2xl text-foreground">We couldn't find that product.</p>
          <p className="mt-2 text-sm text-muted-foreground">It may have been removed from the market.</p>
          <Link href="/" className={cn(btn.secondary, "mt-6")}>
            Back to the market
          </Link>
        </main>
      )}

      {product && (() => {
        const stock = product.inventory?.stockQuantity ?? 0;
        const outOfStock = stock <= 0;
        const lowStock = !outOfStock && stock <= (product.inventory?.lowStockThreshold ?? 0);
        const wishlisted = isWishlisted(product.id);
        const inBasket = items.find((i) => i.id === product.id)?.quantity ?? 0;
        const moreFromCategory = (related ?? []).filter((p) => p.id !== product.id).slice(0, 4);

        const handleAddToCart = () => {
          if (outOfStock) return;
          addItem(product, qty);
          toast.success(`${product.name} added to your basket`, {
            action: { label: "View basket", onClick: () => navigate("/checkout") },
          });
        };

        const stepper = (
          <div className="flex h-11 items-center rounded-md border border-input bg-card">
            <button
              onClick={() => setQty((q) => Math.max(product.minOrderQuantity, q - 1))}
              disabled={qty <= product.minOrderQuantity}
              aria-label="Decrease quantity"
              className="grid h-full w-10 place-items-center text-foreground disabled:opacity-30"
            >
              <Minus className="size-4" />
            </button>
            <span className="w-8 text-center text-[15px] font-bold tabular-nums">{qty}</span>
            <button
              onClick={() => setQty((q) => Math.min(stock, q + 1))}
              disabled={qty >= stock}
              aria-label="Increase quantity"
              className="grid h-full w-10 place-items-center text-foreground disabled:opacity-30"
            >
              <Plus className="size-4" />
            </button>
          </div>
        );

        return (
          <>
            <main className="mx-auto w-full max-w-7xl px-4 pb-32 pt-6 sm:px-6 lg:px-8 lg:pb-16">
              <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Link href="/" className="hover:text-foreground">Market</Link>
                <ChevronRight className="size-3.5" />
                <span>{product.category.name}</span>
                <ChevronRight className="size-3.5" />
                <span className="truncate text-foreground">{product.name}</span>
              </nav>

              <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-16">
                <div className="relative aspect-square overflow-hidden rounded-lg bg-muted lg:sticky lg:top-24 lg:self-start">
                  <ProductImage
                    src={product.imageUrl}
                    alt={product.name}
                    className={cn("size-full object-cover", outOfStock && "opacity-60 grayscale-[35%]")}
                  />
                  {outOfStock && (
                    <span className="absolute left-4 top-4 rounded-full bg-cocoa/90 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-background">
                      Out of stock
                    </span>
                  )}
                </div>

                <div className="lg:py-4">
                  <Eyebrow>{product.category.name}</Eyebrow>
                  <h1 className="mt-3 font-display text-4xl leading-tight text-foreground sm:text-5xl">{product.name}</h1>

                  <div className="mt-5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <p className="text-3xl font-bold text-foreground">{formatNaira(Number(product.price))}</p>
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        outOfStock ? "text-destructive" : lowStock ? "text-terracotta" : "text-brand",
                      )}
                    >
                      {outOfStock ? "Out of stock" : lowStock ? `Only ${stock} left` : "In stock"}
                    </p>
                  </div>

                  {product.description && (
                    <p className="mt-6 whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground">
                      {product.description}
                    </p>
                  )}

                  {product.minOrderQuantity > 1 && (
                    <p className="mt-6 rounded-md bg-secondary px-4 py-3 text-sm text-secondary-foreground">
                      Minimum order for this item is <span className="font-bold">{product.minOrderQuantity}</span>.
                    </p>
                  )}

                  {/* Desktop purchase row */}
                  <div className="mt-8 hidden items-center gap-3 lg:flex">
                    {!outOfStock && stepper}
                    <button onClick={handleAddToCart} disabled={outOfStock} className={cn(btn.primary, "flex-1")}>
                      {outOfStock ? "Out of stock" : `Add to basket · ${formatNaira(Number(product.price) * qty)}`}
                    </button>
                    <button
                      onClick={() => toggle(product.id)}
                      disabled={wishlistPending}
                      aria-label={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
                      className={cn(btn.secondary, "w-11 px-0")}
                    >
                      <Heart className={cn("size-5", wishlisted ? "fill-terracotta text-terracotta" : "")} />
                    </button>
                  </div>
                  {inBasket > 0 && (
                    <p className="mt-3 hidden text-sm text-muted-foreground lg:block">
                      You have {inBasket} in your basket.{" "}
                      <Link href="/checkout" className={btn.link}>Go to checkout</Link>
                    </p>
                  )}

                  <dl className="mt-10 divide-y divide-border border-y border-border text-sm">
                    <div className="flex gap-4 py-4">
                      <Landmark className="mt-0.5 size-5 shrink-0 text-brand" />
                      <div>
                        <dt className="font-semibold text-foreground">Pay by bank transfer</dt>
                        <dd className="mt-0.5 text-muted-foreground">
                          Your order is prepared once our team has confirmed your payment.
                        </dd>
                      </div>
                    </div>
                    <div className="flex gap-4 py-4">
                      <Truck className="mt-0.5 size-5 shrink-0 text-brand" />
                      <div>
                        <dt className="font-semibold text-foreground">Delivery</dt>
                        <dd className="mt-0.5 text-muted-foreground">
                          The delivery fee and estimated time depend on your area and are shown at checkout.
                        </dd>
                      </div>
                    </div>
                  </dl>
                </div>
              </div>

              {moreFromCategory.length > 0 && (
                <section className="mt-20">
                  <div className="flex items-end justify-between">
                    <h2 className="font-display text-2xl text-foreground sm:text-3xl">More {product.category.name.toLowerCase()}</h2>
                    <Link href="/" className={btn.link}>See all</Link>
                  </div>
                  <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-4 lg:gap-x-6">
                    {moreFromCategory.map((p) => (
                      <ProductCard key={p.id} product={p} />
                    ))}
                  </div>
                </section>
              )}
            </main>

            {/* Mobile purchase bar */}
            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 backdrop-blur-md lg:hidden">
              <div className="mx-auto flex max-w-xl items-center gap-2">
                {!outOfStock && stepper}
                <button onClick={handleAddToCart} disabled={outOfStock} className={cn(btn.primary, "flex-1 px-3")}>
                  {outOfStock ? "Out of stock" : "Add to basket"}
                </button>
                <button
                  onClick={() => toggle(product.id)}
                  disabled={wishlistPending}
                  aria-label={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
                  className={cn(btn.secondary, "w-11 shrink-0 px-0")}
                >
                  <Heart className={cn("size-5", wishlisted ? "fill-terracotta text-terracotta" : "")} />
                </button>
              </div>
            </div>
          </>
        );
      })()}

      <SiteFooter />
    </div>
  );
}
