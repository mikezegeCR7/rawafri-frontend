import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock, XCircle, Upload, MoreHorizontal, Eye, ShieldCheck, ShieldAlert, Download, ImageOff, X } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@workspace/api-client-react";
import { getAllPaymentsAdmin, verifyPaymentAdmin, rejectPaymentAdmin } from "@/lib/payments/api";
import type { AdminPaymentListItem } from "@/lib/payments/types";
import { formatNaira } from "@/lib/admin-data";

type PaymentStatus = AdminPaymentListItem["status"];

const statusConfig: Record<PaymentStatus, { label: string; badge: string; icon: React.ReactNode }> = {
  PENDING: { label: "Pending", badge: "bg-slate-100 text-slate-500", icon: <Upload className="w-3 h-3" /> },
  UPLOADED: { label: "Awaiting Review", badge: "bg-amber-50 text-amber-700", icon: <Clock className="w-3 h-3" /> },
  VERIFIED: { label: "Verified", badge: "bg-green-50 text-green-700", icon: <CheckCircle2 className="w-3 h-3" /> },
  REJECTED: { label: "Rejected", badge: "bg-red-50 text-red-600", icon: <XCircle className="w-3 h-3" /> },
};

function apiErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

function PaymentMenu({
  payment,
  onView,
  onVerify,
  onReject,
}: {
  payment: AdminPaymentListItem;
  onView: () => void;
  onVerify: () => void;
  onReject: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const actionable = payment.status === "PENDING" || payment.status === "UPLOADED";

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-50 active:scale-90 transition"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-20 w-48 bg-white rounded-xl border border-slate-200 shadow-lg py-1 text-sm">
          <button
            onClick={() => { setOpen(false); onView(); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50 text-slate-700 text-left"
          >
            <Eye className="w-3.5 h-3.5 text-slate-400" /> View details
          </button>
          {actionable && (
            <>
              <div className="border-t border-slate-100 my-1" />
              <button
                onClick={() => { setOpen(false); onVerify(); }}
                disabled={!payment.proofImageUrl}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-green-50 text-green-700 text-left disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Verify payment
              </button>
              <button
                onClick={() => { setOpen(false); onReject(); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-red-50 text-red-600 text-left"
              >
                <ShieldAlert className="w-3.5 h-3.5" /> Reject payment
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function exportCSV(payments: AdminPaymentListItem[]) {
  const headers = ["Order Ref", "Customer", "Amount (₦)", "Status", "Date"];
  const rows = payments.map((p) => [
    p.order.orderNumber,
    `${p.order.customer.firstName} ${p.order.customer.lastName}`,
    p.amount,
    p.status,
    new Date(p.createdAt).toISOString(),
  ]);
  const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rawafri-payments-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("Payments exported as CSV");
}

export function PaymentsSection({ search }: { search: string }) {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<"all" | PaymentStatus>("all");
  const [viewTarget, setViewTarget] = useState<AdminPaymentListItem | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AdminPaymentListItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: getAllPaymentsAdmin,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
    queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
  };

  const verifyMutation = useMutation({
    mutationFn: verifyPaymentAdmin,
    onSuccess: () => {
      invalidate();
      toast.success("Payment verified");
      setViewTarget(null);
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Couldn't verify this payment")),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectPaymentAdmin(id, reason),
    onSuccess: () => {
      invalidate();
      toast.success("Payment rejected — customer can re-upload proof");
      setRejectTarget(null);
      setRejectReason("");
      setViewTarget(null);
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Couldn't reject this payment")),
  });

  const list = data ?? [];

  const filtered = list.filter((p) => {
    const matchSearch =
      `${p.order.customer.firstName} ${p.order.customer.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      p.order.orderNumber.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalVerified = list.filter((p) => p.status === "VERIFIED").reduce((s, p) => s + Number(p.amount), 0);
  const totalAwaiting = list.filter((p) => p.status === "PENDING" || p.status === "UPLOADED").reduce((s, p) => s + Number(p.amount), 0);
  const totalRejected = list.filter((p) => p.status === "REJECTED").reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="space-y-4">
      {/* View details modal */}
      {viewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4" onClick={() => setViewTarget(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Payment Details</h3>
              <button onClick={() => setViewTarget(null)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div className="flex justify-center">
              {viewTarget.proofImageUrl ? (
                <a href={viewTarget.proofImageUrl} target="_blank" rel="noopener noreferrer">
                  <img src={viewTarget.proofImageUrl} alt="Payment proof" className="max-h-56 rounded-xl ring-1 ring-slate-200 object-contain" />
                </a>
              ) : (
                <div className="w-full h-32 rounded-xl bg-slate-100 flex flex-col items-center justify-center gap-1">
                  <ImageOff className="w-5 h-5 text-slate-400" />
                  <span className="text-xs text-slate-400">No proof uploaded yet</span>
                </div>
              )}
            </div>
            <div className="bg-slate-50 rounded-xl p-4 space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-slate-400">Order</span><span className="font-semibold text-slate-700">{viewTarget.order.orderNumber}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Customer</span><span className="font-semibold text-slate-700">{viewTarget.order.customer.firstName} {viewTarget.order.customer.lastName}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Amount</span><span className="font-semibold text-slate-700">{formatNaira(Number(viewTarget.amount))}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Status</span><span className="font-semibold text-slate-700">{statusConfig[viewTarget.status].label}</span></div>
              {viewTarget.rejectionReason && (
                <div className="pt-1.5 border-t border-slate-200 mt-1.5">
                  <span className="text-slate-400">Rejection reason</span>
                  <p className="text-red-600 font-medium mt-0.5">{viewTarget.rejectionReason}</p>
                </div>
              )}
            </div>
            {(viewTarget.status === "PENDING" || viewTarget.status === "UPLOADED") && (
              <div className="flex gap-2">
                <button
                  onClick={() => verifyMutation.mutate(viewTarget.id)}
                  disabled={verifyMutation.isPending || !viewTarget.proofImageUrl}
                  className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition disabled:opacity-40 flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" /> Verify
                </button>
                <button
                  onClick={() => setRejectTarget(viewTarget)}
                  className="flex-1 py-2.5 bg-white border border-red-200 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition flex items-center justify-center gap-1.5"
                >
                  <ShieldAlert className="w-4 h-4" /> Reject
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject reason modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4" onClick={() => { setRejectTarget(null); setRejectReason(""); }}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-[360px] space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Reject Payment</h3>
              <button onClick={() => { setRejectTarget(null); setRejectReason(""); }}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Reason (the customer will see this) *</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="e.g. The receipt is too blurry to read the amount"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-400/30 resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setRejectTarget(null); setRejectReason(""); }} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition">
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!rejectReason.trim()) { toast.error("Please give a reason"); return; }
                  rejectMutation.mutate({ id: rejectTarget.id, reason: rejectReason.trim() });
                }}
                disabled={rejectMutation.isPending}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition disabled:opacity-50"
              >
                {rejectMutation.isPending ? "Rejecting..." : "Reject Payment"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Verified", value: formatNaira(totalVerified), icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
          { label: "Awaiting Review", value: formatNaira(totalAwaiting), icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Rejected", value: formatNaira(totalRejected), icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
          { label: "Transactions", value: list.length.toString(), icon: Upload, color: "text-blue-600", bg: "bg-blue-50" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg ${item.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-4 h-4 ${item.color}`} />
              </div>
              <div className="min-w-0">
                <p className={`text-base font-bold ${item.color} truncate`}>{item.value}</p>
                <p className="text-slate-500 text-xs mt-0.5">{item.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["all", "PENDING", "UPLOADED", "VERIFIED", "REJECTED"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === s ? "bg-green-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            {s === "all" ? "All" : statusConfig[s].label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3.5">Order</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3.5">Customer</th>
                <th className="text-right text-xs font-semibold text-slate-500 px-4 py-3.5">Amount</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3.5">Status</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3.5 hidden lg:table-cell">Date</th>
                <th className="px-4 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading && (
                <tr><td colSpan={6} className="text-center py-12 text-slate-400 text-sm">Loading payments...</td></tr>
              )}
              {isError && (
                <tr><td colSpan={6} className="text-center py-12 text-red-400 text-sm">Couldn't load payments.</td></tr>
              )}
              {!isLoading && !isError && filtered.map((payment) => {
                const cfg = statusConfig[payment.status];
                return (
                  <tr key={payment.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setViewTarget(payment)}>
                    <td className="px-5 py-3.5">
                      <p className="font-mono text-xs text-slate-700 font-semibold">{payment.order.orderNumber}</p>
                    </td>
                    <td className="px-4 py-3.5 text-slate-800 font-medium whitespace-nowrap">
                      {payment.order.customer.firstName} {payment.order.customer.lastName}
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-slate-900 whitespace-nowrap">
                      {formatNaira(Number(payment.amount))}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full ${cfg.badge}`}>
                        {cfg.icon}
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell text-slate-400 text-xs whitespace-nowrap">
                      {new Date(payment.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" })}
                    </td>
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <PaymentMenu
                        payment={payment}
                        onView={() => setViewTarget(payment)}
                        onVerify={() => verifyMutation.mutate(payment.id)}
                        onReject={() => setRejectTarget(payment)}
                      />
                    </td>
                  </tr>
                );
              })}
              {!isLoading && !isError && filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-slate-400 text-sm">No payments match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {filtered.length} of {list.length} transactions</span>
          <button
            onClick={() => exportCSV(filtered)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>
    </div>
  );
}