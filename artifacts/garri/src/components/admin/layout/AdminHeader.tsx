import { useState } from "react";
import { Bell, Search, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { AdminMenuButton, type AdminSection } from "./AdminSidebar";
import { notifications } from "@/lib/admin-data";

const sectionTitles: Record<AdminSection, { title: string; subtitle: string }> = {
  overview: { title: "Dashboard Overview", subtitle: "Platform operations at a glance" },
  products: { title: "Products", subtitle: "Manage your marketplace product catalog" },
  orders: { title: "Orders", subtitle: "Track and manage all customer orders" },
  customers: { title: "Customers", subtitle: "Customer accounts and activity" },
  inventory: { title: "Inventory", subtitle: "Stock levels and restock alerts" },
  payments: { title: "Payments", subtitle: "Transaction monitoring and reconciliation" },
  notifications: { title: "Notifications", subtitle: "System alerts and activity feed" },
  reports: { title: "Reports & Analytics", subtitle: "Revenue, growth, and platform metrics" },
  settings: { title: "Settings", subtitle: "Platform configuration and preferences" },
};

interface AdminHeaderProps {
  section: AdminSection;
  onMenuOpen: () => void;
  search: string;
  onSearch: (v: string) => void;
  onNavigate: (s: AdminSection) => void;
}

export function AdminHeader({ section, onMenuOpen, search, onSearch, onNavigate }: AdminHeaderProps) {
  const { title, subtitle } = sectionTitles[section];
  const unread = notifications.filter((n) => !n.read).length;
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    toast.success("Dashboard refreshed", { description: "All data is up to date" });
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleBell = () => {
    onNavigate("notifications");
  };

  return (
    <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4 flex items-center gap-4">
      <AdminMenuButton onClick={onMenuOpen} />

      <div className="flex-1 min-w-0">
        <h1 className="text-slate-900 font-semibold text-base sm:text-lg leading-none">{title}</h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-0.5 hidden sm:block">{subtitle}</p>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-56">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Quick search…"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none flex-1 min-w-0"
          />
        </div>

        <button
          onClick={handleRefresh}
          title="Refresh dashboard"
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 transition-transform ${refreshing ? "animate-spin" : ""}`} />
        </button>

        <button
          onClick={handleBell}
          title="View notifications"
          className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <Bell className="w-4 h-4" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </button>

        <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center ml-1">
          <span className="text-white text-xs font-bold">SA</span>
        </div>
      </div>
    </header>
  );
}
