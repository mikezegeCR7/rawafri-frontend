import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { getMyOrders, confirmDelivery as confirmDeliveryRequest, sendDeliveryOtp, confirmDeliveryOtp } from "@/lib/orders/api";
import { toDisplayOrder } from "@/lib/orders/adapter";
import { STATUS_BADGE, type Order } from "@/lib/order-data";
import { apiErrorMessage } from "@/lib/api/errors";
import { AccountLayout } from "@/components/account/AccountLayout";
import { Badge, PageHeading, Panel } from "@/components/storefront/ui";
import { DeliveryConfirmationCard } from "@/components/orders/DeliveryConfirmationCard";
import { PaymentReviewCard } from "@/components/orders/PaymentReviewCard";
import { OrderSummary } from "@/components/orders/OrderSummary";
import { DeliveryInfo } from "@/components/orders/DeliveryInfo";
import { NotificationFeed } from "@/components/orders/NotificationFeed";
import { OrderHistoryList } from "@/components/orders/OrderHistoryList";
import { OrderLoadingState, OrderErrorState, OrderEmptyState } from "@/components/orders/OrderStates";
import { OrderTimelineVertical } from "@/components/orders/OrderTimeline";
import { cn } from "@/lib/utils";

export default function Orders() {
  const params = useParams<{ id?: string }>();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"active" | "past">("active");

  const { data: rawOrders, isLoading, isError, refetch } = useQuery({
    queryKey: ["my-orders"],
    queryFn: getMyOrders,
  });

  const orders: Order[] = [...(rawOrders ?? [])]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map(toDisplayOrder);
  const selectedOrder = params.id ? orders.find((o) => o.id === params.id) ?? null : null;

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [params.id]);

  const invalidateOrders = () => {
    queryClient.invalidateQueries({ queryKey: ["my-orders"] });
    queryClient.invalidateQueries({ queryKey: ["unread-notification-count"] });
  };

  const confirmMutation = useMutation({ mutationFn: confirmDeliveryRequest, onSuccess: invalidateOrders });
  const sendOtpMutation = useMutation({ mutationFn: sendDeliveryOtp });
  const confirmOtpMutation = useMutation({
    mutationFn: ({ orderId, otp }: { orderId: string; otp: string }) => confirmDeliveryOtp(orderId, otp),
    onSuccess: invalidateOrders,
  });

  const handleConfirmed = async (orderId: string) => {
    try {
      await confirmMutation.mutateAsync(orderId);
    } catch (error) {
      throw new Error(apiErrorMessage(error, "Couldn't confirm delivery"));
    }
  };

  const handleSendOtp = async (orderId: string) => {
    try {
      await sendOtpMutation.mutateAsync(orderId);
    } catch (error) {
      throw new Error(apiErrorMessage(error, "Couldn't send a confirmation code"));
    }
  };

  const handleConfirmWithOtp = async (orderId: string, otp: string) => {
    try {
      await confirmOtpMutation.mutateAsync({ orderId, otp });
    } catch (error) {
      throw new Error(apiErrorMessage(error, "That code is invalid or has expired"));
    }
  };

  // ── Detail view ─────────────────────────────────────────────
  if (params.id) {
    return (
      <AccountLayout active="orders">
        <Link href="/orders" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> All orders
        </Link>

        {isLoading && <div className="mt-6"><OrderLoadingState /></div>}
        {isError && <div className="mt-6"><OrderErrorState onRetry={() => refetch()} /></div>}

        {!isLoading && !isError && !selectedOrder && (
          <Panel className="mt-6 px-6 py-14 text-center">
            <p className="font-display text-xl text-foreground">We couldn't find that order.</p>
            <Link href="/orders" className="mt-4 inline-block text-sm font-semibold text-brand hover:underline underline-offset-4">
              Back to all orders
            </Link>
          </Panel>
        )}

        {selectedOrder && (
          <>
            <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="font-display text-3xl text-foreground sm:text-4xl">{selectedOrder.reference}</h1>
                <p className="mt-1.5 text-sm text-muted-foreground">Placed {selectedOrder.createdAt}</p>
              </div>
              <Badge className={cn(STATUS_BADGE[selectedOrder.status].color, "px-3 py-1 text-xs")}>
                {STATUS_BADGE[selectedOrder.status].label}
              </Badge>
            </div>

            <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
              <div className="space-y-6">
                {selectedOrder.status === "AWAITING_CUSTOMER_CONFIRMATION" && (
                  <DeliveryConfirmationCard
                    order={selectedOrder}
                    onConfirmed={handleConfirmed}
                    onSendOtp={handleSendOtp}
                    onConfirmWithOtp={handleConfirmWithOtp}
                  />
                )}
                <PaymentReviewCard order={selectedOrder} />
                <OrderSummary order={selectedOrder} />
              </div>
              <div className="space-y-6">
                <Panel className="p-5">
                  <h2 className="mb-4 font-display text-lg text-foreground">Progress</h2>
                  <OrderTimelineVertical status={selectedOrder.status} />
                </Panel>
                <DeliveryInfo order={selectedOrder} />
                <NotificationFeed notifications={selectedOrder.notifications} />
              </div>
            </div>
          </>
        )}
      </AccountLayout>
    );
  }

  // ── List view ───────────────────────────────────────────────
  const activeOrders = orders.filter((o) => o.status !== "DELIVERED" && o.status !== "CANCELLED");
  const pastOrders = orders.filter((o) => o.status === "DELIVERED" || o.status === "CANCELLED");
  // Land on whichever tab has something in it.
  const currentTab = tab === "active" && activeOrders.length === 0 && pastOrders.length > 0 ? "past" : tab;
  const shown = currentTab === "active" ? activeOrders : pastOrders;

  return (
    <AccountLayout active="orders">
      <div className="space-y-8">
        <PageHeading title="Orders" description="Follow each order from payment to delivery." />

        {isLoading && <OrderLoadingState />}
        {isError && <OrderErrorState onRetry={() => refetch()} />}
        {!isLoading && !isError && orders.length === 0 && <OrderEmptyState />}

        {!isLoading && !isError && orders.length > 0 && (
          <>
            <div role="tablist" className="flex gap-6 border-b border-border">
              {([
                ["active", "In progress", activeOrders.length],
                ["past", "Completed", pastOrders.length],
              ] as const).map(([key, label, count]) => (
                <button
                  key={key}
                  role="tab"
                  aria-selected={currentTab === key}
                  onClick={() => setTab(key)}
                  className={cn(
                    "-mb-px border-b-2 pb-3 text-sm font-semibold transition-colors",
                    currentTab === key ? "border-cocoa text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {label} <span className="text-muted-foreground">({count})</span>
                </button>
              ))}
            </div>
            {shown.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                {currentTab === "active" ? "No orders in progress right now." : "No completed orders yet."}
              </p>
            ) : (
              <OrderHistoryList orders={shown} />
            )}
          </>
        )}
      </div>
    </AccountLayout>
  );
}
