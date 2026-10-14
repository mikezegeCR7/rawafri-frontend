import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, UserCheck, UserX, Eye, Ban, X, Package, ShieldPlus } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@workspace/api-client-react";
import { getCustomers, getCustomerDetail, toggleCustomerStatus, promoteToAdmin } from "@/lib/customers/api";
import type { Customer, CustomerDetail } from "@/lib/customers/types";
import { formatNaira } from "@/lib/admin-data";
import { statusLabels } from "@/lib/admin-data";
import { type OrderStatus } from "@/lib/order-data";

function apiErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

const statusBadge = (isActive: boolean) => (isActive ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500");
const statusIcon = (isActive: boolean) => (isActive ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />);

function initials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

function CustomerMenu({
  customer,
  onView,
  onToggle,
  onPromote,
}: {
  customer: Customer;
  onView: () => void;
  onToggle: () => void;
  onPromote: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
            <Eye className="w-3.5 h-3.5 text-slate-400" /> View profile
          </button>
          <div className="border-t border-slate-100 my-1" />
          <button
            onClick={() => { setOpen(false); onToggle(); }}
            className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left ${customer.isActive ? "hover:bg-red-50 text-red-600" : "hover:bg-green-50 text-green-700"}`}
          >
            <Ban className="w-3.5 h-3.5" />
            {customer.isActive ? "Suspend account" : "Reactivate account"}
          </button>
          <div className="border-t border-slate-100 my-1" />
          <button
            onClick={() => {
              setOpen(false);
              if (confirm(`Promote ${customer.firstName} ${customer.lastName} to admin? They will gain full admin access.`)) {
                onPromote();
              }
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left hover:bg-brand/5 text-brand"
          >
            <ShieldPlus className="w-3.5 h-3.5" />
            Promote to admin
          </button>
        </div>
      )}
    </div>
  );
}

const PAGE_SIZE = 10;

export function CustomersSection({ search }: { search: string }) {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [sort, setSort] = useState<"newest" | "name">("newest");
  const [page, setPage] = useState(1);
  const [profileId, setProfileId] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-customers"],
    queryFn: () => getCustomers(),
  });

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["admin-customer-detail", profileId],
    queryFn: () => getCustomerDetail(profileId as string),
    enabled: !!profileId,
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => toggleCustomerStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
      toast.success("Customer account updated");
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, "Couldn't update this customer"));
    },
  });

  const promoteMutation = useMutation({
    mutationFn: (id: string) => promoteToAdmin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
      toast.success("Customer promoted to admin");
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, "Couldn't promote this customer"));
    },
  });

  const allCustomers = data?.data ?? [];

  const filtered = allCustomers
    .filter((c) => {
      const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
      const matchSearch =
        fullName.includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search);
      const matchStatus = statusFilter === "all" || (statusFilter === "active" ? c.isActive : !c.isActive);
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (sort === "name") return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const now = new Date();
  const summary = {
    total: data?.meta.total ?? allCustomers.length,
    active: allCustomers.filter((c) => c.isActive).length,
    inactive: allCustomers.filter((c) => !c.isActive).length,
    newThisMonth: allCustomers.filter((c) => {
      const d = new Date(c.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length,
  };

  return (
    <div className="space-y-4">
      {/* Profile modal */}
      {profileId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4" onClick={() => setProfileId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md max-h-[85vh] overflow-y-auto space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Customer Profile</h3>
              <button onClick={() => setProfileId(null)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>

            {profileLoading && <p className="text-sm text-slate-400 py-6 text-center">Loading...</p>}

            {profile && (
              <ProfileContent profile={profile} />
            )}
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Customers", value: summary.total.toLocaleString(), color: "text-slate-800" },
          { label: "Active", value: summary.active.toString(), color: "text-green-600" },
          { label: "Inactive", value: summary.inactive.toString(), color: "text-slate-500" },
          { label: "New This Month", value: summary.newThisMonth.toString(), color: "text-blue-600" },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
            <p className="text-slate-500 text-xs mt-1">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          {(["all", "active", "inactive"] as const).map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                statusFilter === s ? "bg-green-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Sort by:</span>
          {([
            { key: "newest", label: "Newest" },
            { key: "name", label: "Name" },
          ] as const).map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSort(opt.key)}
              className={`px-2 py-1 rounded ${sort === opt.key ? "bg-slate-100 text-slate-800 font-medium" : "text-slate-500 hover:bg-slate-50"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3.5">Customer</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3.5 hidden sm:table-cell">Contact</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3.5">Status</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3.5 hidden lg:table-cell">Joined</th>
                <th className="px-4 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading && (
                <tr><td colSpan={5} className="text-center py-12 text-slate-400 text-sm">Loading customers...</td></tr>
              )}
              {isError && (
                <tr><td colSpan={5} className="text-center py-12 text-red-400 text-sm">Couldn't load customers.</td></tr>
              )}
              {!isLoading && !isError && paginated.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-[11px] font-bold">{initials(customer.firstName, customer.lastName)}</span>
                      </div>
                      <div>
                        <p className="text-slate-800 font-medium whitespace-nowrap">{customer.firstName} {customer.lastName}</p>
                        <p className="text-slate-400 text-[11px]">{customer.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 hidden sm:table-cell">
                    <p className="text-slate-600 text-xs">{customer.phone}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full capitalize ${statusBadge(customer.isActive)}`}>
                      {statusIcon(customer.isActive)}
                      {customer.isActive ? "active" : "inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 hidden lg:table-cell text-slate-400 text-xs">
                    {new Date(customer.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" })}
                  </td>
                  <td className="px-4 py-3.5">
                    <CustomerMenu
                      customer={customer}
                      onView={() => setProfileId(customer.id)}
                      onToggle={() => toggleMutation.mutate(customer.id)}
                      onPromote={() => promoteMutation.mutate(customer.id)}
                    />
                  </td>
                </tr>
              ))}
              {!isLoading && !isError && paginated.length === 0 && (
                <tr><td colSpan={5} className="text-center py-12 text-slate-400 text-sm">No customers match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} customers</span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2 py-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >←</button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => setPage(i + 1)}
                className={`px-2 py-1 rounded ${page === i + 1 ? "bg-green-600 text-white" : "border border-slate-200 hover:bg-slate-50"}`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-2 py-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >→</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileContent({ profile }: { profile: CustomerDetail }) {
  const { user, recentOrders } = profile;
  const recentTotal = recentOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-sm font-bold">{initials(user.firstName, user.lastName)}</span>
        </div>
        <div>
          <p className="font-semibold text-slate-900">{user.firstName} {user.lastName}</p>
          <p className="text-xs text-slate-500">{user.email} · {user.phone}</p>
        </div>
        <span className={`ml-auto text-[11px] font-semibold px-2 py-1 rounded-full capitalize ${statusBadge(user.isActive)}`}>
          {user.isActive ? "active" : "inactive"}
        </span>
      </div>

      <div className="bg-slate-50 rounded-xl p-4 grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-slate-400">Joined</p>
          <p className="font-semibold text-slate-700 mt-0.5">{new Date(user.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" })}</p>
        </div>
        <div>
          <p className="text-slate-400">Recent orders shown</p>
          <p className="font-semibold text-slate-700 mt-0.5">{recentOrders.length} (total {formatNaira(recentTotal)})</p>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <Package className="w-3.5 h-3.5" /> Last {recentOrders.length} orders
        </p>
        {recentOrders.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No orders yet.</p>
        ) : (
          <div className="space-y-2">
            {recentOrders.map((o) => (
              <div key={o.id} className="flex items-center justify-between bg-white ring-1 ring-slate-100 rounded-lg px-3 py-2">
                <div>
                  <p className="text-xs font-semibold text-slate-700">{o.orderNumber}</p>
                  <p className="text-[11px] text-slate-400">{new Date(o.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" })}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-slate-800">{formatNaira(Number(o.totalAmount))}</p>
                  <p className="text-[11px] text-slate-400">{statusLabels[o.status as OrderStatus] ?? o.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}