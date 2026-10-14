import { Link } from "wouter";
import { ShoppingBasket } from "lucide-react";
import { useCart } from "@/lib/cart/CartContext";
import { formatNaira } from "@/lib/products/types";
import { BasketLines } from "@/components/account/BasketLines";
import { EmptyState, PageHeading, Panel, btn } from "@/components/storefront/ui";
import { cn } from "@/lib/utils";

export function CartSection() {
  const { items, itemCount, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="space-y-8">
        <PageHeading title="Basket" />
        <EmptyState
          icon={ShoppingBasket}
          title="Your basket is empty"
          description="Add items from the market and they'll wait for you here."
          action={<Link href="/" className={btn.primary}>Browse the market</Link>}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeading title="Basket" description={`${itemCount} item${itemCount === 1 ? "" : "s"}`} />
      <div className="grid gap-8 xl:grid-cols-[1fr_320px]">
        <Panel>
          <BasketLines />
        </Panel>
        <Panel className="h-fit p-5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-bold text-foreground">{formatNaira(subtotal)}</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Delivery fee depends on your area and is added at checkout, along with any promo code.
          </p>
          <Link href="/checkout" className={cn(btn.primary, "mt-5 w-full")}>
            Go to checkout
          </Link>
        </Panel>
      </div>
    </div>
  );
}
