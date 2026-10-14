import { type Order } from "@/lib/order-data";
import { Panel } from "@/components/storefront/ui";

export function DeliveryInfo({ order }: { order: Order }) {
  const rows = [
    {
      label: "Deliver to",
      value: (
        <>
          <p className="font-semibold text-foreground">{order.contactName}</p>
          <p className="text-foreground">{order.address}</p>
          {order.landmark && <p className="text-muted-foreground">Near {order.landmark}</p>}
        </>
      ),
    },
    {
      label: "Phone",
      value: (
        <a href={`tel:${order.contactPhone}`} className="font-semibold text-brand hover:underline underline-offset-4">
          {order.contactPhone}
        </a>
      ),
    },
    { label: "Delivery area", value: <p className="text-foreground">{order.deliveryZoneName}</p> },
    {
      label: order.status === "DELIVERED" ? "Delivered" : "Estimated delivery",
      value: <p className="text-foreground">{order.status === "DELIVERED" && order.confirmedAt ? `Confirmed at ${order.confirmedAt}` : order.estimatedDelivery}</p>,
    },
  ];

  return (
    <Panel>
      <div className="border-b border-border px-5 py-4">
        <h2 className="font-display text-lg text-foreground">Delivery</h2>
      </div>
      <dl className="divide-y divide-border">
        {rows.map((row) => (
          <div key={row.label} className="px-5 py-3.5 text-sm">
            <dt className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}
