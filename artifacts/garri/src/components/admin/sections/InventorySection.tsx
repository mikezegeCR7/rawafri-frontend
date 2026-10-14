import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, XCircle, CheckCircle2, RefreshCw, PackagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@workspace/api-client-react";
import { getAllInventory, updateInventoryAdmin } from "@/lib/inventory/api";
import type { InventoryRecord } from "@/lib/inventory/types";
import { formatNaira, PRODUCT_IMAGE_FALLBACK } from "@/lib/products/types";

function apiErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

function stockStatus(item: InventoryRecord): "healthy" | "low" | "out" {
  if (item.stockQuantity <= 0) return "out";
  if (item.isLowStock) return "low";
  return "healthy";
}

export function InventorySection({ search }: { search: string }) {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");
  const [editTarget, setEditTarget] = useState<InventoryRecord | null>(null);
  const [stockInput, setStockInput] = useState("");
  const [thresholdInput, setThresholdInput] = useState("");

  const { data: items, isLoading, isError } = useQuery({
    queryKey: ["admin-inventory"],
    queryFn: getAllInventory,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { stockQuantity: number; lowStockThreshold: number } }) =>
      updateInventoryAdmin(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(`${editTarget?.product.name} stock updated`);
      setEditTarget(null);
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, "Couldn't update stock"));
    },
  });

  const list = items ?? [];

  const filtered = list.filter((item) => {
    const matchSearch = item.product.name.toLowerCase().includes(search.toLowerCase());
    const status = stockStatus(item);
    const matchFilter =
      filter === "all" ||
      (filter === "low" && status === "low") ||
      (filter === "out" && status === "out");
    return matchSearch && matchFilter;
  });

  const healthy = list.filter((i) => stockStatus(i) === "healthy").length;
  const lowStock = list.filter((i) => stockStatus(i) === "low").length;
  const outOfStock = list.filter((i) => stockStatus(i) === "out").length;
  const totalValue = list.reduce((sum, i) => sum + i.stockQuantity * Number(i.product.price), 0);

  const openEdit = (item: InventoryRecord) => {
    setEditTarget(item);
    setStockInput(String(item.stockQuantity));
    setThresholdInput(String(item.lowStockThreshold));
  };

  const submitEdit = () => {
    if (!editTarget) return;
    const stockQuantity = Number(stockInput);
    const lowStockThreshold = Number(thresholdInput);
    if (isNaN(stockQuantity) || stockQuantity < 0) {
      toast.error("Enter a valid stock quantity");
      return;
    }
    if (isNaN(lowStockThreshold) || lowStockThreshold < 0) {
      toast.error("Enter a valid low-stock threshold");
      return;
    }
    updateMutation.mutate({ id: editTarget.id, payload: { stockQuantity, lowStockThreshold } });
  };

  return (
    <div className="space-y-4">
      {/* Adjust stock modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4" onClick={() => setEditTarget(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-80 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Adjust Stock</h3>
              <button onClick={() => setEditTarget(null)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div className="flex items-center gap-3">
              <img
                src={editTarget.product.imageUrl || PRODUCT_IMAGE_FALLBACK}
                alt={editTarget.product.name}
                className="w-10 h-10 rounded-lg object-cover ring-1 ring-slate-200"
              />
              <p className="text-sm font-medium text-slate-800">{editTarget.product.name}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Stock quantity</label>
              <input
                type="number"
                value={stockInput}
                onChange={(e) => setStockInput(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500/20"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Low stock alert threshold</label>
              <input
                type="number"
                value={thresholdInput}
                onChange={(e) => setThresholdInput(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500/20"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditTarget(null)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={submitEdit}
                disabled={updateMutation.isPending}
                className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {updateMutation.isPending ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Healthy Stock", value: healthy, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
          { label: "Low Stock", value: lowStock, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Out of Stock", value: outOfStock, icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
          { label: "Stock Value", value: formatNaira(totalValue), icon: RefreshCw, color: "text-blue-600", bg: "bg-blue-50" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg ${item.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-4 h-4 ${item.color}`} />
              </div>
              <div>
                <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
                <p className="text-slate-500 text-xs mt-0.5">{item.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {(outOfStock > 0 || lowStock > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <span className="font-semibold text-amber-800">Stock Alert: </span>
            <span className="text-amber-700">
              {outOfStock} product{outOfStock !== 1 ? "s" : ""} out of stock and {lowStock} running low.
              Click a row's "Adjust Stock" button to restock.
            </span>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {[
          { key: "all" as const, label: "All Products" },
          { key: "low" as const, label: `Low Stock (${lowStock})` },
          { key: "out" as const, label: `Out of Stock (${outOfStock})` },
        ].map((opt) => (
          <button
            key={opt.key}
            onClick={() => setFilter(opt.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === opt.key ? "bg-green-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3.5">Product</th>
                <th className="text-right text-xs font-semibold text-slate-500 px-4 py-3.5">In Stock</th>
                <th className="text-right text-xs font-semibold text-slate-500 px-4 py-3.5 hidden md:table-cell">Low Stock At</th>
                <th className="text-right text-xs font-semibold text-slate-500 px-4 py-3.5 hidden sm:table-cell">Stock Value</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading && (
                <tr><td colSpan={6} className="text-center py-12 text-slate-400 text-sm">Loading inventory...</td></tr>
              )}
              {isError && (
                <tr><td colSpan={6} className="text-center py-12 text-red-400 text-sm">Couldn't load inventory.</td></tr>
              )}
              {!isLoading && !isError && filtered.map((item) => {
                const status = stockStatus(item);
                const stockValue = item.stockQuantity * Number(item.product.price);
                return (
                  <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${status !== "healthy" ? "bg-red-50/30" : ""}`}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.product.imageUrl || PRODUCT_IMAGE_FALLBACK}
                          alt={item.product.name}
                          className="w-9 h-9 rounded-lg object-cover ring-1 ring-slate-200 shrink-0"
                        />
                        <div>
                          <p className="text-slate-800 font-medium">{item.product.name}</p>
                          <p className="text-slate-400 text-[11px]">{item.product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className={`font-bold text-sm ${status === "out" ? "text-red-600" : status === "low" ? "text-amber-600" : "text-slate-800"}`}>
                        {item.stockQuantity.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right hidden md:table-cell text-slate-500 text-xs">
                      {item.lowStockThreshold.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-right hidden sm:table-cell text-slate-700 text-xs font-medium">
                      {formatNaira(stockValue)}
                    </td>
                    <td className="px-4 py-3.5">
                      {status === "out" && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600">
                          <XCircle className="w-2.5 h-2.5" /> Out of stock
                        </span>
                      )}
                      {status === "low" && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
                          <AlertTriangle className="w-2.5 h-2.5" /> Low
                        </span>
                      )}
                      {status === "healthy" && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Healthy
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => openEdit(item)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-[11px] font-medium rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <PackagePlus className="w-3.5 h-3.5 text-green-600" /> Adjust Stock
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!isLoading && !isError && filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-slate-400 text-sm">No inventory records match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}