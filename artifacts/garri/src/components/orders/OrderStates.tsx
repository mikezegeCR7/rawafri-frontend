import { Link } from "wouter";
import { Package, AlertTriangle } from "lucide-react";
import { EmptyState, Panel, btn } from "@/components/storefront/ui";
import { cn } from "@/lib/utils";

export function OrderLoadingState() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Panel key={i} className="h-20 animate-pulse" />
      ))}
    </div>
  );
}

export function OrderErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <EmptyState
      icon={AlertTriangle}
      title="We couldn't load your orders"
      description="Check your connection and try again."
      action={
        <button onClick={onRetry} className={btn.secondary}>
          Try again
        </button>
      }
    />
  );
}

export function OrderEmptyState() {
  return (
    <EmptyState
      icon={Package}
      title="No orders yet"
      description="When you place an order, you'll be able to follow it here from payment to delivery."
      action={
        <Link href="/" className={cn(btn.primary)}>
          Start shopping
        </Link>
      }
    />
  );
}
