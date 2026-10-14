import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Download, Wallet, ShoppingBag, Users, Package, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { getSalesReport, getOrdersReport, getProductsReport, getCustomersReport, getPaymentsReport } from "@/lib/reports/api";
import { statusLabels } from "@/lib/admin-data";
import { formatNaira } from "@/lib/products/types";
import type { OrderStatus } from "@/lib/order-data";

const ORDER_STATUS_KEYS: { key: keyof Awaited<ReturnType<typeof getOrdersReport>>; status: OrderStatus }[] = [
  { key: "receivedOrders", status: "ORDER_RECEIVED" },
  { key: "awaitingPayment", status: "AWAITING_PAYMENT" },
  { key: "paymentConfirmed", status: "PAYMENT_CONFIRMED" },
  { key: "preparingOrders", status: "PREPARING_ORDER" },
  { key: "outForDelivery", status: "OUT_FOR_DELIVERY" },
  { key: "awaitingCustomerConfirmation", status: "AWAITING_CUSTOMER_CONFIRMATION" },
  { key: "deliveredOrders", status: "DELIVERED" },
  { key: "cancelledOrders", status: "CANCELLED" },
];

function csvEscape(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

export function ReportsSection() {
  const sales = useQuery({ queryKey: ["report-sales"], queryFn: getSalesReport });
  const orders = useQuery({ queryKey: ["report-orders"], queryFn: getOrdersReport });
  const products = useQuery({ queryKey: ["report-products"], queryFn: getProductsReport });
  const customers = useQuery({ queryKey: ["report-customers"], queryFn: getCustomersReport });
  const payments = useQuery({ queryKey: ["report-payments"], queryFn: getPaymentsReport });

  const isLoading = sales.isLoading || orders.isLoading || products.isLoading || customers.isLoading || payments.isLoading;
  const isError = sales.isError || orders.isError || products.isError || customers.isError || payments.isError;

  const refetchAll = () => {
    sales.refetch();
    orders.refetch();
    products.refetch();
    customers.refetch();
    payments.refetch();
  };

  const orderStatusData = orders.data
    ? ORDER_STATUS_KEYS.map(({ key, status }) => ({
        name: statusLabels[status],
        count: orders.data![key] as number,
        status,
      }))
    : [];

  const statusBarColor: Record<OrderStatus, string> = {
    ORDER_RECEIVED: "#3b82f6",
    AWAITING_PAYMENT: "#f59e0b",
    PAYMENT_CONFIRMED: "#10b981",
    PREPARING_ORDER: "#f59e0b",
    OUT_FOR_DELIVERY: "#f97316",
    AWAITING_CUSTOMER_CONFIRMATION: "#a855f7",
    DELIVERED: "#16a34a",
    CANCELLED: "#ef4444",
  };

  const exportSummary = () => {
    if (!sales.data || !orders.data || !products.data || !customers.data || !payments.data) return;
    const rows: [string, string | number][] = [
      ["Total Revenue (verified)", sales.data.totalRevenue],
      ["Total Orders", sales.data.totalOrders],
      ["Average Order Value", sales.data.averageOrderValue],
      ["Verified Payments", sales.data.verifiedPayments],
      ["Pending Payments", sales.data.pendingPayments],
      ["Rejected Payments", sales.data.rejectedPayments],
      ...ORDER_STATUS_KEYS.map(({ key, status }) => [`Orders — ${statusLabels[status]}`, orders.data![key] as number] as [string, number]),
      ["Total Products", products.data.totalProducts],
      ["Active Products", products.data.activeProducts],
      ["Low Stock Products", products.data.lowStockProducts],
      ["Out of Stock Products", products.data.outOfStockProducts],
      ["Total Customers", customers.data.totalCustomers],
      ["Active Customers", customers.data.activeCustomers],
      ["Inactive Customers", customers.data.inactiveCustomers],
      ["Total Payments", payments.data.totalPayments],
      ["Verified Payment Amount", payments.data.totalVerifiedAmount],
    ];
    const csv = ["Metric,Value", ...rows.map(([k, v]) => `${csvEscape(k)},${csvEscape(v)}`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rawafri-report-summary-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report summary exported");
  };

  if (isLoading) {
    return <div className="text-center py-16 text-slate-400 text-sm">Loading reports...</div>;
  }

  if (isError || !sales.data || !orders.data || !products.data || !customers.data || !payments.data) {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-red-400 text-sm">Couldn't load one or more reports.</p>
        <button onClick={refetchAll} className="text-xs font-medium text-green-600 hover:underline">Try again</button>
      </div>
    );
  }

  const metrics = [
    { label: "Total Revenue (Verified)", value: formatNaira(sales.data.totalRevenue), icon: Wallet, color: "text-green-600", bg: "bg-green-50" },
    { label: "Total Orders", value: sales.data.totalOrders.toLocaleString(), icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Avg Order Value", value: formatNaira(sales.data.averageOrderValue), icon: Wallet, color: "text-slate-700", bg: "bg-slate-100" },
    { label: "Total Customers", value: customers.data.totalCustomers.toLocaleString(), icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Active Products", value: products.data.activeProducts.toLocaleString(), icon: Package, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Payments Awaiting Review", value: (payments.data.pendingPayments).toLocaleString(), icon: Wallet, color: "text-red-500", bg: "bg-red-50" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">Live snapshot as of {new Date().toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</p>
        <button onClick={refetchAll} className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 transition">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className={`w-8 h-8 rounded-lg ${m.bg} flex items-center justify-center mb-2`}>
                <Icon className={`w-4 h-4 ${m.color}`} />
              </div>
              <p className="text-lg font-bold text-slate-900">{m.value}</p>
              <p className="text-slate-500 text-xs mt-0.5 leading-tight">{m.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Orders by status — real distribution, not a fake trend over time */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-slate-900 font-semibold text-sm mb-1">Orders by Status</h3>
          <p className="text-slate-500 text-xs mb-4">Current snapshot across all orders</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={orderStatusData} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {orderStatusData.map((entry) => (
                  <Cell key={entry.status} fill={statusBarColor[entry.status]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Products & customers health */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-slate-900 font-semibold text-sm mb-3">Product Health</h3>
            <div className="space-y-2.5">
              {[
                { label: "Active", value: products.data.activeProducts, color: "bg-green-500" },
                { label: "Low Stock", value: products.data.lowStockProducts, color: "bg-amber-500" },
                { label: "Out of Stock", value: products.data.outOfStockProducts, color: "bg-red-500" },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${row.color} shrink-0`} />
                  <span className="text-xs text-slate-600 flex-1">{row.label}</span>
                  <span className="text-sm font-semibold text-slate-800">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-slate-900 font-semibold text-sm mb-3">Customers</h3>
            <div className="space-y-2.5">
              {[
                { label: "Active", value: customers.data.activeCustomers, color: "bg-green-500" },
                { label: "Inactive", value: customers.data.inactiveCustomers, color: "bg-slate-400" },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${row.color} shrink-0`} />
                  <span className="text-xs text-slate-600 flex-1">{row.label}</span>
                  <span className="text-sm font-semibold text-slate-800">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-slate-900 font-semibold text-sm">Payments Breakdown</h3>
            <p className="text-slate-500 text-xs mt-0.5">{payments.data.totalPayments} total transactions</p>
          </div>
          <button
            onClick={exportSummary}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export Summary CSV
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-100">
          {[
            { label: "Verified", value: payments.data.verifiedPayments, color: "text-green-600" },
            { label: "Pending Review", value: payments.data.pendingPayments, color: "text-amber-600" },
            { label: "Rejected", value: payments.data.rejectedPayments, color: "text-red-600" },
            { label: "Verified Amount", value: formatNaira(payments.data.totalVerifiedAmount), color: "text-slate-800" },
          ].map((row) => (
            <div key={row.label} className="px-5 py-4 text-center">
              <p className={`text-lg font-bold ${row.color}`}>{row.value}</p>
              <p className="text-slate-500 text-xs mt-0.5">{row.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}