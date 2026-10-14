import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { CreditCard, ChevronRight } from "lucide-react";
import { getMyPayments } from "@/lib/payments/api";
import type { MyPayment } from "@/lib/payments/types";
import { formatNaira } from "@/lib/products/types";
import { Badge, EmptyState, PageHeading, Panel } from "@/components/storefront/ui";

const STATUS: Record<MyPayment["status"], { label: string; className: string; hint: string }> = {
  PENDING: { label: "Receipt needed", className: "bg-gold/15 text-[oklch(0.45_0.1_70)] ring-gold/40", hint: "Upload your transfer receipt" },
  UPLOADED: { label: "Being checked", className: "bg-secondary text-secondary-foreground ring-border", hint: "Our team is checking your receipt" },
  VERIFIED: { label: "Confirmed", className: "bg-brand-muted text-brand ring-brand/20", hint: "Payment confirmed" },
  REJECTED: { label: "Not accepted", className: "bg-destructive/10 text-destructive ring-destructive/20", hint: "Please upload a new receipt" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

export function PaymentsSection() {
  const { data: payments, isLoading } = useQuery({ queryKey: ["my-payments"], queryFn: getMyPayments });

  return (
    <div className="space-y-8">
      <PageHeading title="Payments" description="Every bank transfer you've made for an order, and where it stands." />

      {isLoading ? (
        <Panel className="h-48 animate-pulse" />
      ) : !payments || payments.length === 0 ? (
        <EmptyState icon={CreditCard} title="No payments yet" description="Your payment history will appear here after your first order." />
      ) : (
        <Panel className="divide-y divide-border">
          {payments.map((payment) => {
            const status = STATUS[payment.status];
            return (
              <Link
                key={payment.id}
                href={`/orders/${payment.orderId}`}
                className="flex items-center gap-4 px-4 py-4 transition-colors hover:bg-accent/60 sm:px-5"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground">{payment.order.orderNumber}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatDate(payment.createdAt)} · {status.hint}
                  </p>
                  {payment.status === "REJECTED" && payment.rejectionReason && (
                    <p className="mt-1.5 text-xs text-destructive">Reason: {payment.rejectionReason}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <p className="font-bold text-foreground">{formatNaira(Number(payment.amount))}</p>
                  <Badge className={status.className}>{status.label}</Badge>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            );
          })}
        </Panel>
      )}
    </div>
  );
}
