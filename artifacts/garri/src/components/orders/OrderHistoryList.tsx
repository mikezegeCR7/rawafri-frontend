import { Link } from "wouter";
import { ChevronRight } from "lucide-react";
import { type Order, STATUS_BADGE, formatNaira } from "@/lib/order-data";
import { ProductImage } from "@/components/storefront/ProductImage";
import { Badge, Panel } from "@/components/storefront/ui";

export function OrderHistoryList({ orders }: { orders: Order[] }) {
  return (
    <Panel className="divide-y divide-border">
      {orders.map((order) => {
        const badge = STATUS_BADGE[order.status];
        const needsReceipt = order.paymentStatus === "PENDING" || order.paymentStatus === "REJECTED";
        const needsAction = order.status === "AWAITING_CUSTOMER_CONFIRMATION" || (needsReceipt && order.status !== "CANCELLED");
        return (
          <Link
            key={order.id}
            href={`/orders/${order.id}`}
            className="flex items-center gap-4 px-4 py-4 transition-colors hover:bg-accent/60 sm:px-5"
          >
            <div className="hidden -space-x-2 sm:flex">
              {order.items.slice(0, 3).map((item) => (
                <ProductImage
                  key={item.id}
                  src={item.image}
                  alt={item.name}
                  className="size-11 rounded-md border-2 border-card object-cover"
                />
              ))}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-bold text-foreground">{order.reference}</p>
                <Badge className={badge.color}>{badge.label}</Badge>
              </div>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {order.createdAt} · {order.items.length} item{order.items.length === 1 ? "" : "s"}
              </p>
              {needsAction && (
                <p className="mt-1.5 text-xs font-bold text-terracotta">
                  {order.status === "AWAITING_CUSTOMER_CONFIRMATION"
                    ? "Confirm you've received this delivery"
                    : order.paymentStatus === "REJECTED"
                      ? "Receipt not accepted. Upload a new one"
                      : "Upload your payment receipt"}
                </p>
              )}
            </div>
            <p className="font-bold text-foreground">{formatNaira(order.total)}</p>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </Link>
        );
      })}
    </Panel>
  );
}
