import { Check, X } from "lucide-react";
import { ORDER_STAGES, STATUS_INDEX, type OrderStatus } from "@/lib/order-data";
import { cn } from "@/lib/utils";

export function OrderTimelineVertical({ status }: { status: OrderStatus }) {
  if (status === "CANCELLED") {
    return (
      <div className="flex items-center gap-3">
        <span className="grid size-8 place-items-center rounded-full bg-destructive/10">
          <X className="size-4 text-destructive" />
        </span>
        <div>
          <p className="text-sm font-bold text-destructive">Order cancelled</p>
          <p className="text-xs text-muted-foreground">This order won't be prepared or delivered.</p>
        </div>
      </div>
    );
  }

  const currentIndex = STATUS_INDEX[status] ?? 0;

  return (
    <ol>
      {ORDER_STAGES.map((stage, i) => {
        const done = i < currentIndex || status === "DELIVERED";
        const current = i === currentIndex && status !== "DELIVERED";
        const isLast = i === ORDER_STAGES.length - 1;
        return (
          <li key={stage.key} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full border-2",
                  done && "border-brand bg-brand text-brand-foreground",
                  current && "border-terracotta bg-background",
                  !done && !current && "border-border bg-background",
                )}
              >
                {done ? <Check className="size-3.5" strokeWidth={3} /> : current ? <span className="size-2 rounded-full bg-terracotta" /> : null}
              </span>
              {!isLast && <span className={cn("my-1 w-0.5 flex-1 min-h-5", done ? "bg-brand" : "bg-border")} />}
            </div>
            <div className={cn("flex-1", !isLast && "pb-5")}>
              <p className={cn("text-sm font-semibold leading-7", done || current ? "text-foreground" : "text-muted-foreground")}>
                {stage.label}
              </p>
              {current && <p className="text-xs text-muted-foreground">{stage.sub}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
