import { Fragment, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Phone, X, CheckCircle, AlertTriangle, Clock, History, ImageOff, ShieldAlert, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@workspace/api-client-react";
import { formatNaira, statusColors, statusLabels, type Order, type OrderStatus } from "@/lib/admin-data";
import { getAllOrdersAdmin, updateOrderStatusAdmin } from "@/lib/orders/api";
import { toAdminOrderRow } from "@/lib/orders/adminAdapter";
import { verifyPaymentAdmin, rejectPaymentAdmin } from "@/lib/payments/api";

const STATUS_FLOW: OrderStatus[] = [
  "ORDER_RECEIVED",
  "AWAITING_PAYMENT",
  "PAYMENT_CONFIRMED",
  "PREPARING_ORDER",
  "OUT_FOR_DELIVERY",
  "AWAITING_CUSTOMER_CONFIRMATION",
  "DELIVERED",
  "CANCELLED",
];

const DELIVERY_FLOW: OrderStatus[] = [
  "ORDER_RECEIVED",
  "AWAITING_PAYMENT",
  "PAYMENT_CONFIRMED",
  "PREPARING_ORDER",
  "OUT_FOR_DELIVERY",
  "AWAITING_CUSTOMER_CONFIRMATION",
  "DELIVERED",
];

const paymentBadge = (status: string) => {
  if (status === "paid") return "bg-green-50 text-green-700";
  if (status === "pending") return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-red-600";
};

function apiErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

const PAGE_SIZE = 8;

export function OrdersSection({ search }: { search: string }) {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [contactOrder, setContactOrder] = useState<Order | null>(null);
  const [confirmModal, setConfirmModal] = useState<Order | null>(null);
  const [rejectPaymentTarget, setRejectPaymentTarget] = useState<Order | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [cancelModal, setCancelModal] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const { data: rawOrders, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: getAllOrdersAdmin,
  });

  const orderList: Order[] = (rawOrders ?? []).map(toAdminOrderRow);

  const statusMutation = useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: OrderStatus; note?: string }) =>
      updateOrderStatusAdmin(id, { status, note }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success(`Order → "${statusLabels[variables.status]}"`);
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, "Couldn't update this order"));
    },
  });

  const verifyPaymentMutation = useMutation({
    mutationFn: verifyPaymentAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Payment verified — order moved to Payment Confirmed");
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, "Couldn't verify this payment"));
    },
  });

  const rejectPaymentMutation = useMutation({
    mutationFn: ({ paymentId, reason }: { paymentId: string; reason: string }) =>
      rejectPaymentAdmin(paymentId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Payment rejected — customer can now re-upload proof");
      setRejectPaymentTarget(null);
      setRejectReason("");
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, "Couldn't reject this payment"));
    },
  });

  const filtered = orderList.filter((o) => {
    const matchSearch =
      o.customer.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      (o.orderNumber ?? "").toLowerCase().includes(search.toLowerCase()) ||
      o.items.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const activeOrders = filtered.filter(o => o.status !== "DELIVERED" && o.status !== "CANCELLED");
  const awaitingConfirmation = orderList.filter(o => o.status === "AWAITING_CUSTOMER_CONFIRMATION");

  const displayOrders = statusFilter !== "all"
    ? filtered
    : showHistory ? filtered : activeOrders;

  const totalPages = Math.max(1, Math.ceil(displayOrders.length / PAGE_SIZE));
  const paginated = displayOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = STATUS_FLOW.reduce(
    (acc, s) => ({ ...acc, [s]: orderList.filter((o) => o.status === s).length }),
    {} as Record<OrderStatus, number>
  );

  const updateStatus = (order: Order) => {
    const idx = DELIVERY_FLOW.indexOf(order.status);
    const next = DELIVERY_FLOW[Math.min(idx + 1, DELIVERY_FLOW.length - 1)];
    statusMutation.mutate({ id: order.id, status: next });
  };

  const confirmDelivery = (order: Order) => {
    statusMutation.mutate(
      { id: order.id, status: "DELIVERED", note: "Delivery confirmed by admin" },
      {
        onSuccess: () => {
          setConfirmModal(null);
          setExpanded(null);
        },
      },
    );
  };

  const cancelOrder = (order: Order, reason: string) => {
    statusMutation.mutate(
      { id: order.id, status: "CANCELLED", note: reason },
      {
        onSuccess: () => {
          setExpanded(null);
          setCancelModal(null);
          setCancelReason("");
        },
      },
    );
  };

  return (
    <div className="space-y-4">

      {/* Contact Modal */}
      {contactOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4" onClick={() => setContactOrder(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-80 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Contact Customer</h3>
              <button onClick={() => setContactOrder(null)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800">{contactOrder.customer}</p>
              <p className="text-xs text-slate-500">Order: {contactOrder.orderNumber ?? contactOrder.id}</p>
            </div>
            <div className="flex flex-col gap-2">
              <a href={`tel:${contactOrder.phone}`} className="flex items-center gap-2 justify-center w-full py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors">
                <Phone className="w-4 h-4" /> Call {contactOrder.phone}
              </a>
              <button onClick={() => { navigator.clipboard.writeText(contactOrder.phone); toast.success("Copied!"); }} className="w-full py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
                Copy number
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Confirm Delivery Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4" onClick={() => setConfirmModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-[340px] space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Confirm Delivery</h3>
              <button onClick={() => setConfirmModal(null)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 space-y-1">
              <p className="text-sm font-semibold text-slate-800">{confirmModal.orderNumber ?? confirmModal.id}</p>
              <p className="text-xs text-slate-500">{confirmModal.customer} · {confirmModal.phone}</p>
              <p className="text-xs text-slate-500">{confirmModal.items}</p>
            </div>
            <p className="text-xs text-slate-500">
              Use this to manually confirm delivery after the customer confirms via phone call or in person.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmModal(null)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition">
                Cancel
              </button>
              <button
                onClick={() => confirmDelivery(confirmModal)}
                disabled={statusMutation.isPending}
                className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" /> Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Payment Modal */}
      {rejectPaymentTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4" onClick={() => { setRejectPaymentTarget(null); setRejectReason(""); }}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-[360px] space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Reject Payment</h3>
              <button onClick={() => { setRejectPaymentTarget(null); setRejectReason(""); }}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div className="bg-red-50 rounded-xl p-4 space-y-1">
              <p className="text-sm font-semibold text-slate-800">{rejectPaymentTarget.orderNumber ?? rejectPaymentTarget.id}</p>
              <p className="text-xs text-slate-500">{rejectPaymentTarget.customer} · {formatNaira(rejectPaymentTarget.total)}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Reason (the customer will see this) *</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="e.g. The receipt is too blurry to read the amount — please re-upload a clearer photo"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-400/30 resize-none"
              />
            </div>
            <p className="text-xs text-slate-500">
              The order stays open — the customer can re-upload proof against this same order, no need to re-order.
            </p>
            <div className="flex gap-2">
              <button onClick={() => { setRejectPaymentTarget(null); setRejectReason(""); }} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition">
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!rejectReason.trim()) { toast.error("Please give a reason"); return; }
                  if (!rejectPaymentTarget.paymentId) return;
                  rejectPaymentMutation.mutate({ paymentId: rejectPaymentTarget.paymentId, reason: rejectReason.trim() });
                }}
                disabled={rejectPaymentMutation.isPending}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition disabled:opacity-50"
              >
                {rejectPaymentMutation.isPending ? "Rejecting..." : "Reject Payment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4" onClick={() => { setCancelModal(null); setCancelReason(""); }}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-[360px] space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Cancel Order</h3>
              <button onClick={() => { setCancelModal(null); setCancelReason(""); }}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div className="bg-red-50 rounded-xl p-4 space-y-1">
              <p className="text-sm font-semibold text-slate-800">{cancelModal.orderNumber ?? cancelModal.id}</p>
              <p className="text-xs text-slate-500">{cancelModal.customer} · {cancelModal.phone}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Reason for cancellation *</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                placeholder="e.g. Item out of stock, customer requested cancellation..."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-400/30 resize-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                This will be recorded on the order and visible to the customer.
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setCancelModal(null); setCancelReason(""); }} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition">
                Back
              </button>
              <button
                onClick={() => {
                  if (!cancelReason.trim()) { toast.error("Please give a reason"); return; }
                  cancelOrder(cancelModal, cancelReason.trim());
                }}
                disabled={statusMutation.isPending}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <X className="w-4 h-4" /> {statusMutation.isPending ? "Cancelling..." : "Cancel Order"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Awaiting confirmation banner */}
      {awaitingConfirmation.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-purple-800">
              {awaitingConfirmation.length} order{awaitingConfirmation.length > 1 ? "s" : ""} awaiting customer confirmation
            </p>
            <p className="text-xs text-purple-600 mt-0.5">
              {awaitingConfirmation.map(o => o.orderNumber ?? o.id).join(", ")}
            </p>
          </div>
          <button
            onClick={() => { setStatusFilter("AWAITING_CUSTOMER_CONFIRMATION"); setPage(1); }}
            className="text-xs font-medium text-purple-700 bg-purple-100 px-3 py-1.5 rounded-lg hover:bg-purple-200 transition"
          >
            View all
          </button>
        </div>
      )}

      {/* Status filter tabs */}
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-1.5">
        {(["all", ...STATUS_FLOW] as const).map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-2 py-2 rounded-lg text-[11px] font-medium transition-all text-center ${
              statusFilter === s ? "bg-green-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            {s === "all" ? "All" : statusLabels[s]}
            {s !== "all" && counts[s] > 0 && (
              <span className={`ml-1 text-[10px] ${statusFilter === s ? "text-white/70" : "text-slate-400"}`}>
                ({counts[s]})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Orders table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3.5">Order ID</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3.5">Customer</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3.5 hidden md:table-cell">Items</th>
                <th className="text-right text-xs font-semibold text-slate-500 px-4 py-3.5">Total</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3.5">Status</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3.5 hidden sm:table-cell">Payment</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3.5 hidden lg:table-cell">Time</th>
                <th className="px-4 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading && (
                <tr><td colSpan={8} className="text-center py-12 text-slate-400 text-sm">Loading orders...</td></tr>
              )}
              {isError && (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <p className="text-red-400 text-sm mb-2">Couldn't load orders.</p>
                    <button onClick={() => refetch()} className="text-xs font-medium text-green-600 hover:underline">Try again</button>
                  </td>
                </tr>
              )}
              {!isLoading && !isError && paginated.map((order) => (
                <Fragment key={order.id}>
                  <tr
                    className={`hover:bg-slate-50 transition-colors cursor-pointer ${order.status === "AWAITING_CUSTOMER_CONFIRMATION" ? "bg-purple-50/50" : ""}`}
                    onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs text-slate-700 font-semibold">{order.orderNumber ?? order.id}</span>
                        {order.status === "AWAITING_CUSTOMER_CONFIRMATION" && (
                          <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div>
                        <p className="text-slate-800 font-medium whitespace-nowrap">{order.customer}</p>
                        <p className="text-slate-400 text-[11px]">{order.phone}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <p className="text-slate-600 text-xs max-w-[200px] truncate">{order.items}</p>
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold text-slate-800 whitespace-nowrap">
                      {formatNaira(order.total)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-[10px] font-semibold px-2 py-1 rounded-full whitespace-nowrap ${statusColors[order.status]}`}>
                        {statusLabels[order.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <span className={`text-[10px] font-semibold px-2 py-1 rounded-full capitalize ${paymentBadge(order.payment)}`}>
                        {order.payment}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell text-slate-400 text-xs whitespace-nowrap">
                      {order.date}
                    </td>
                    <td className="px-4 py-3.5">
                      <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${expanded === order.id ? "rotate-90" : ""}`} />
                    </td>
                  </tr>

                  {expanded === order.id && (
                    <tr className="bg-slate-50">
                      <td colSpan={8} className="px-5 py-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs mb-4">
                          <div>
                            <p className="text-slate-400 font-medium mb-1">Delivery Address</p>
                            <p className="text-slate-700">{order.address}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 font-medium mb-1">Order Items</p>
                            <p className="text-slate-700">{order.items}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 font-medium mb-2">Status Timeline</p>
                            <div className="flex items-center gap-1 flex-wrap">
                              {DELIVERY_FLOW.map((s, i) => {
                                const currentIdx = DELIVERY_FLOW.indexOf(order.status);
                                const done = order.status !== "CANCELLED" && currentIdx >= i;
                                return (
                                  <div key={s} className="flex items-center gap-1">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${done ? "bg-green-100 text-green-700" : s === "AWAITING_CUSTOMER_CONFIRMATION" ? "bg-purple-100 text-purple-600" : "bg-slate-200 text-slate-500"}`}>
                                      {statusLabels[s]}
                                    </span>
                                    {i < DELIVERY_FLOW.length - 1 && <span className="text-slate-300">›</span>}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Payment review */}
                        {order.paymentId && (
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-3 flex flex-col sm:flex-row gap-3">
                            <div className="flex items-center gap-3 flex-1">
                              {order.paymentProofImageUrl ? (
                                <a href={order.paymentProofImageUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
                                  <img
                                    src={order.paymentProofImageUrl}
                                    alt="Payment proof"
                                    className="w-14 h-14 rounded-lg object-cover ring-1 ring-slate-200 hover:ring-green-400 transition"
                                  />
                                </a>
                              ) : (
                                <div className="w-14 h-14 rounded-lg bg-slate-200 flex items-center justify-center shrink-0">
                                  <ImageOff className="w-5 h-5 text-slate-400" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-700">
                                  Payment: <span className={`${paymentBadge(order.payment)} px-1.5 py-0.5 rounded-full capitalize`}>{order.payment}</span>
                                </p>
                                {order.paymentStatus === "REJECTED" && order.paymentRejectionReason && (
                                  <p className="text-[11px] text-red-600 mt-1">Rejected: {order.paymentRejectionReason}</p>
                                )}
                                {!order.paymentProofImageUrl && (
                                  <p className="text-[11px] text-slate-400 mt-1">No proof uploaded yet</p>
                                )}
                              </div>
                            </div>
                            {(order.paymentStatus === "PENDING" || order.paymentStatus === "UPLOADED") && (
                              <div className="flex gap-2 shrink-0">
                                <button
                                  onClick={() => order.paymentId && verifyPaymentMutation.mutate(order.paymentId)}
                                  disabled={verifyPaymentMutation.isPending || !order.paymentProofImageUrl}
                                  title={!order.paymentProofImageUrl ? "No proof uploaded yet" : undefined}
                                  className="px-3 py-1.5 bg-green-600 text-white text-[11px] font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-40 flex items-center gap-1"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5" /> Verify Payment
                                </button>
                                <button
                                  onClick={() => setRejectPaymentTarget(order)}
                                  className="px-3 py-1.5 bg-white border border-red-200 text-red-600 text-[11px] font-medium rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1"
                                >
                                  <ShieldAlert className="w-3.5 h-3.5" /> Reject Payment
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Awaiting confirmation special section */}
                        {order.status === "AWAITING_CUSTOMER_CONFIRMATION" && (
                          <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 mb-3 flex items-center gap-3">
                            <AlertTriangle className="w-4 h-4 text-purple-600 flex-shrink-0" />
                            <p className="text-xs text-purple-700 flex-1">
                              This order is awaiting customer confirmation. You can confirm manually if the customer called to confirm.
                            </p>
                          </div>
                        )}

                        <div className="flex gap-2 flex-wrap">
                          {order.status !== "DELIVERED" && order.status !== "CANCELLED" && order.status !== "AWAITING_CUSTOMER_CONFIRMATION" && (
                            <button
                              onClick={() => updateStatus(order)}
                              disabled={statusMutation.isPending}
                              className="px-3 py-1.5 bg-green-600 text-white text-[11px] font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                              Update → {(() => {
                                const idx = DELIVERY_FLOW.indexOf(order.status);
                                return statusLabels[DELIVERY_FLOW[Math.min(idx + 1, DELIVERY_FLOW.length - 1)]];
                              })()}
                            </button>
                          )}

                          {order.status === "AWAITING_CUSTOMER_CONFIRMATION" && (
                            <button
                              onClick={() => setConfirmModal(order)}
                              className="px-3 py-1.5 bg-green-600 text-white text-[11px] font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Confirm Delivery (Admin)
                            </button>
                          )}

                          <button
                            onClick={() => setContactOrder(order)}
                            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-[11px] font-medium rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1"
                          >
                            <Phone className="w-3.5 h-3.5" /> Contact Customer
                          </button>

                          {order.status !== "CANCELLED" && order.status !== "DELIVERED" && (
                            <button
                              onClick={() => setCancelModal(order)}
                              disabled={statusMutation.isPending}
                              className="px-3 py-1.5 bg-white border border-red-200 text-red-600 text-[11px] font-medium rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                            >
                              Cancel Order
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>

          {!isLoading && !isError && displayOrders.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-sm">No orders match your filters.</div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span>Showing {Math.min(page * PAGE_SIZE, displayOrders.length)} of {displayOrders.length}</span>
            {statusFilter === "all" && (
              <button
                onClick={() => setShowHistory(v => !v)}
                className="flex items-center gap-1 text-slate-500 hover:text-slate-700 transition"
              >
                <History className="w-3.5 h-3.5" />
                {showHistory ? "Hide history" : "Show delivery history"}
              </button>
            )}
          </div>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-2 py-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40">←</button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i + 1} onClick={() => setPage(i + 1)} className={`px-2 py-1 rounded ${page === i + 1 ? "bg-green-600 text-white" : "border border-slate-200 hover:bg-slate-50"}`}>
                {i + 1}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-2 py-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40">→</button>
          </div>
        </div>
      </div>
    </div>
  );
}
