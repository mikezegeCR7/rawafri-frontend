import { Link } from "wouter";
import { type Order, formatNaira } from "@/lib/order-data";
import { ProductImage } from "@/components/storefront/ProductImage";
import { Panel } from "@/components/storefront/ui";

export function OrderSummary({ order }: { order: Order }) {
  return (
    <Panel>
      <div className="border-b border-border px-5 py-4">
        <h2 className="font-display text-lg text-foreground">
          Items <span className="text-muted-foreground">({order.items.length})</span>
        </h2>
      </div>
      <ul className="divide-y divide-border">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-center gap-4 px-5 py-4">
            <ProductImage
              src={item.image}
              alt={item.name}
              className="size-14 shrink-0 rounded-md object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-foreground">{item.name}</p>
              <p className="text-sm text-muted-foreground">
                {item.quantity} × {formatNaira(item.price)}
              </p>
            </div>
            <p className="font-bold text-foreground">{formatNaira(item.quantity * item.price)}</p>
          </li>
        ))}
      </ul>
      <dl className="space-y-2 border-t border-border bg-secondary/40 px-5 py-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="text-foreground">{formatNaira(order.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Delivery ({order.deliveryZoneName})</dt>
          <dd className="text-foreground">{formatNaira(order.deliveryFee)}</dd>
        </div>
        {order.discount > 0 && (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Promo discount</dt>
            <dd className="font-semibold text-brand">−{formatNaira(order.discount)}</dd>
          </div>
        )}
        <div className="flex justify-between border-t border-border pt-3 text-base">
          <dt className="font-bold text-foreground">Total</dt>
          <dd className="font-bold text-foreground">{formatNaira(order.total)}</dd>
        </div>
      </dl>
      <div className="border-t border-border px-5 py-3">
        <Link href="/" className="text-sm font-semibold text-brand hover:underline underline-offset-4">
          Shop again
        </Link>
      </div>
    </Panel>
  );
}
