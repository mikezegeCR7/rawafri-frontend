import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowRight, Package, ShoppingBasket } from "lucide-react";
import { STATUS_BADGE, formatNaira } from "@/lib/order-data";
import type { FullOrder } from "@/lib/orders/types";
import { getMyOrders } from "@/lib/orders/api";
import { getWishlist } from "@/lib/wishlist/api";
import { getRecentlyViewed } from "@/lib/products/api";
import { ProductImage } from "@/components/storefront/ProductImage";
import { useAuth } from "@/lib/auth/AuthContext";
import { useCart } from "@/lib/cart/CartContext";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { Badge, Panel, btn } from "@/components/storefront/ui";
import { cn } from "@/lib/utils";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export function OverviewSection() {
  const { user } = useAuth();
  const { itemCount, subtotal } = useCart();

  const { data: orders, isLoading: ordersLoading } = useQuery({ queryKey: ["my-orders"], queryFn: getMyOrders });
  const { data: wishlist } = useQuery({ queryKey: ["wishlist"], queryFn: getWishlist });
  const { data: recentlyViewed } = useQuery({ queryKey: ["recently-viewed"], queryFn: getRecentlyViewed });

  const sorted = [...(orders ?? [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const active = sorted.filter((o) => o.status !== "DELIVERED" && o.status !== "CANCELLED");
  const needsAction = sorted.filter(
    (o) =>
      o.status === "AWAITING_CUSTOMER_CONFIRMATION" ||
      o.payment?.status === "REJECTED" ||
      (o.payment?.status === "PENDING" && o.status !== "CANCELLED"),
  );
  const totalSpent = sorted
    .filter((o) => o.status !== "CANCELLED")
    .reduce((sum, o) => sum + Number(o.totalAmount), 0);

  const stats = [
    { label: "Orders placed", value: String(sorted.length) },
    { label: "In progress", value: String(active.length) },
    { label: "Saved items", value: String(wishlist?.length ?? 0) },
    { label: "Total spent", value: formatNaira(totalSpent), hint: "Excludes cancelled orders" },
  ];

  return (
    <div className="space-y-10">
      <div>
        <p className="text-sm font-semibold text-muted-foreground">{greeting()},</p>
        <h1 className="mt-1 font-display text-4xl leading-tight text-foreground">{user?.firstName ?? "there"}</h1>
      </div>

      {/* Things that need the customer */}
      {needsAction.length > 0 && (
        <div className="space-y-2">
          {needsAction.slice(0, 3).map((o) => (
            <Link
              key={o.id}
              href={`/orders/${o.id}`}
              className="flex items-center gap-4 rounded-lg border border-terracotta/30 bg-terracotta/[0.06] px-4 py-3.5 transition-colors hover:bg-terracotta/10"
            >
              <span className="size-2 shrink-0 rounded-full bg-terracotta" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-foreground">{actionTitle(o)}</p>
                <p className="text-xs text-muted-foreground">
                  {o.orderNumber} · {formatNaira(Number(o.totalAmount))}
                </p>
              </div>
              <ArrowRight className="size-4 shrink-0 text-terracotta" />
            </Link>
          ))}
        </div>
      )}

      {/* Stats */}
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-card p-5" title={s.hint}>
            <dt className="text-xs font-semibold text-muted-foreground">{s.label}</dt>
            <dd className="mt-2 font-display text-2xl text-foreground">
              {ordersLoading && s.label !== "Saved items" ? <span className="inline-block h-7 w-16 animate-pulse rounded bg-muted" /> : s.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-10 xl:grid-cols-[1.4fr_1fr]">
        {/* Recent orders */}
        <section>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="font-display text-2xl text-foreground">Recent orders</h2>
            {sorted.length > 0 && <Link href="/orders" className={btn.link}>All orders</Link>}
          </div>
          {ordersLoading ? (
            <Panel className="h-40 animate-pulse" />
          ) : sorted.length === 0 ? (
            <Panel className="px-6 py-10 text-center">
              <Package className="mx-auto size-6 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">You haven't placed an order yet.</p>
              <Link href="/" className={cn(btn.primary, btn.sm, "mt-5")}>Start shopping</Link>
            </Panel>
          ) : (
            <Panel className="divide-y divide-border">
              {sorted.slice(0, 4).map((o) => (
                <OrderRow key={o.id} order={o} />
              ))}
            </Panel>
          )}
        </section>

        {/* Basket */}
        <section>
          <h2 className="mb-4 font-display text-2xl text-foreground">Your basket</h2>
          <Panel className="p-5">
            {itemCount === 0 ? (
              <div className="py-4 text-center">
                <ShoppingBasket className="mx-auto size-6 text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">Your basket is empty.</p>
                <Link href="/" className={cn(btn.secondary, btn.sm, "mt-5")}>Browse the market</Link>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  {itemCount} item{itemCount === 1 ? "" : "s"} waiting
                </p>
                <p className="mt-1 font-display text-3xl text-foreground">{formatNaira(subtotal)}</p>
                <p className="mt-1 text-xs text-muted-foreground">Before delivery fee</p>
                <div className="mt-5 flex gap-2">
                  <Link href="/checkout" className={cn(btn.primary, btn.sm, "flex-1")}>Checkout</Link>
                  <Link href="/dashboard/cart" className={cn(btn.secondary, btn.sm)}>Edit</Link>
                </div>
              </>
            )}
          </Panel>
        </section>
      </div>

      {recentlyViewed && recentlyViewed.length > 0 && (
        <section>
          <div className="mb-6 flex items-end justify-between">
            <h2 className="font-display text-2xl text-foreground">Recently viewed</h2>
            <Link href="/dashboard/recent" className={btn.link}>See all</Link>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4">
            {recentlyViewed.slice(0, 4).map((view) => (
              <ProductCard key={view.id} product={view.product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function actionTitle(o: FullOrder) {
  if (o.status === "AWAITING_CUSTOMER_CONFIRMATION") return "Your delivery has arrived. Please confirm you received it.";
  if (o.payment?.status === "REJECTED") return "Your payment receipt was not accepted. Please upload a new one.";
  return "Upload your payment receipt so we can confirm your order.";
}

function OrderRow({ order }: { order: FullOrder }) {
  const badge = STATUS_BADGE[order.status];
  return (
    <Link href={`/orders/${order.id}`} className="flex items-center gap-4 px-4 py-4 transition-colors hover:bg-accent/60">
      <div className="flex -space-x-2">
        {order.items.slice(0, 3).map((item) => (
          <ProductImage
            key={item.id}
            src={item.product.imageUrl}
            alt={item.product.name}
            className="size-10 rounded-md border-2 border-card object-cover"
          />
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-foreground">{order.orderNumber}</p>
        <p className="text-xs text-muted-foreground">
          {new Date(order.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" })} · {order.items.length} item
          {order.items.length === 1 ? "" : "s"}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <p className="text-sm font-bold text-foreground">{formatNaira(Number(order.totalAmount))}</p>
        <Badge className={badge.color}>{badge.label}</Badge>
      </div>
    </Link>
  );
}
