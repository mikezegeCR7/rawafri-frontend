import { useQuery } from "@tanstack/react-query";
import { Wallet, ShoppingCart, Users, Package, AlertTriangle, Clock, CheckCircle2, XCircle } from "lucide-react";
import { getAdminDashboard } from "@/lib/dashboard/api";
import { getAllInventory } from "@/lib/inventory/api";
import { formatNaira, statusColors, statusLabels } from "@/lib/admin-data";
import { PRODUCT_IMAGE_FALLBACK } from "@/lib/products/types";
import type { OrderStatus } from "@/lib/order-data";
import type { AdminSection } from "../layout/AdminSidebar";

const paymentStatusBadge: Record<string, string> = {
  PENDING: "bg-slate-100 text-slate-500",
  UPLOADED: "bg-amber-50 text-amber-700",
  VERIFIED: "bg-green-50 text-green-700",
  REJECTED: "bg-red-50 text-red-600",
};

export function OverviewSection({ search, onNavigate }: { search: string; onNavigate: (s: AdminSection) => void }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: getAdminDashboard,
  });

  const { data: inventory } = useQuery({
    queryKey: ["admin-inventory"],
    queryFn: getAllInventory,
  });

  const needsAttention = (inventory ?? [])
    .filter((i) => i.stockQuantity <= i.lowStockThreshold)
    .sort((a, b) => a.stockQuantity - b.stockQuantity)
    .slice(0, 6);

  if (isLoading) {
    return <div className="text-center py-16 text-slate-400 text-sm">Loading dashboard...</div>;
  }

  if (isError || !data) {
    return <div className="text-center py-16 text-red-400 text-sm">Couldn't load the dashboard.</div>;
  }

  const stats = [
    { label: "Total Revenue (Verified)", value: formatNaira(data.totalRevenue), icon: Wallet, color: "text-green-600", bg: "bg-green-50" },
    { label: "Total Orders", value: data.totalOrders.toLocaleString(), icon: ShoppingCart, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Customers", value: data.totalCustomers.toLocaleString(), icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Products Listed", value: data.totalProducts.toLocaleString(), icon: Package, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Payments Awaiting Review", value: data.pendingPayments.toLocaleString(), icon: Clock, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Low Stock Products", value: data.lowStockProducts.toLocaleString(), icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50" },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <p className="text-xl font-bold text-slate-900 leading-none">{stat.value}</p>
              <p className="text-slate-500 text-xs mt-1.5 leading-tight">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <h3 className="text-slate-900 font-semibold text-sm">Recent Orders</h3>
              <p className="text-slate-400 text-xs mt-0.5">Latest activity across the platform</p>
            </div>
            <button
              onClick={() => onNavigate("orders")}
              className="text-green-600 text-xs font-medium hover:text-green-700 transition-colors"
            >
              View all →
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {data.recentOrders.length === 0 && (
              <p className="text-center py-10 text-slate-400 text-sm">No orders yet.</p>
            )}
            {data.recentOrders
              .filter((o) => o.customerName.toLowerCase().includes(search.toLowerCase()) || o.orderNumber.toLowerCase().includes(search.toLowerCase()))
              .map((order) => (
                <div key={order.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-900 text-sm font-medium font-mono">{order.orderNumber}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[order.status as OrderStatus] ?? "bg-slate-100 text-slate-500"}`}>
                        {statusLabels[order.status as OrderStatus] ?? order.status}
                      </span>
                    </div>
                    <p className="text-slate-500 text-xs mt-0.5 truncate">{order.customerName}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-slate-900 text-sm font-semibold">{formatNaira(order.totalAmount)}</p>
                    <p className="text-slate-400 text-[11px]">{new Date(order.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" })}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Needs Attention (real low-stock list, replacing fake top-sellers) */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-slate-900 font-semibold text-sm">Needs Attention</h3>
            <p className="text-slate-400 text-xs mt-0.5">Low & out of stock products</p>
          </div>
          <div className="divide-y divide-slate-50">
            {needsAttention.length === 0 && (
              <p className="text-center py-10 text-slate-400 text-sm">All stock levels look healthy.</p>
            )}
            {needsAttention.map((item) => {
              const isOut = item.stockQuantity <= 0;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate("inventory")}
                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors text-left"
                >
                  <img
                    src={item.product.imageUrl || PRODUCT_IMAGE_FALLBACK}
                    alt={item.product.name}
                    className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200 shrink-0"
                  />
                  <p className="text-sm text-slate-700 flex-1 truncate">{item.product.name}</p>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${isOut ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"}`}>
                    {isOut ? <XCircle className="w-2.5 h-2.5" /> : <AlertTriangle className="w-2.5 h-2.5" />}
                    {item.stockQuantity} left
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Payments */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-slate-900 font-semibold text-sm">Recent Payments</h3>
            <p className="text-slate-400 text-xs mt-0.5">Latest transactions submitted by customers</p>
          </div>
          <button
            onClick={() => onNavigate("payments")}
            className="text-green-600 text-xs font-medium hover:text-green-700 transition-colors"
          >
            View all →
          </button>
        </div>
        <div className="divide-y divide-slate-50">
          {data.recentPayments.length === 0 && (
            <p className="text-center py-10 text-slate-400 text-sm">No payments yet.</p>
          )}
          {data.recentPayments.map((payment) => (
            <div key={payment.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                {payment.status === "VERIFIED" ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : payment.status === "REJECTED" ? <XCircle className="w-4 h-4 text-red-500" /> : <Clock className="w-4 h-4 text-amber-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-900 text-sm font-medium font-mono">{payment.orderNumber}</p>
                <p className="text-slate-500 text-xs mt-0.5 truncate">{payment.customerName}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-slate-900 text-sm font-semibold">{formatNaira(payment.amount)}</p>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${paymentStatusBadge[payment.status] ?? "bg-slate-100 text-slate-500"}`}>
                  {payment.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}