import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Archive,
  CreditCard,
  Bell,
  BarChart2,
  Settings,
  ChevronRight,
  Menu,
  X,
  Wheat,
  LogOut,
  Store,
} from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth/AuthContext";

export type AdminSection =
  | "overview"
  | "products"
  | "orders"
  | "customers"
  | "inventory"
  | "payments"
  | "notifications"
  | "reports"
  | "store"
  | "settings";

interface NavItem {
  id: AdminSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const navItems: NavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "products", label: "Products", icon: Package },
  { id: "orders", label: "Orders", icon: ShoppingCart, badge: 4 },
  { id: "customers", label: "Customers", icon: Users },
  { id: "inventory", label: "Inventory", icon: Archive },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "notifications", label: "Notifications", icon: Bell, badge: 4 },
  { id: "reports", label: "Reports", icon: BarChart2 },
  { id: "store", label: "Store setup", icon: Store },
  { id: "settings", label: "Settings", icon: Settings },
];

interface AdminSidebarProps {
  active: AdminSection;
  onNavigate: (section: AdminSection) => void;
  open: boolean;
  onClose: () => void;
}

export function AdminSidebar({ active, onNavigate, open, onClose }: AdminSidebarProps) {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const handleNav = (section: AdminSection) => {
    onNavigate(section);
    onClose();
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-slate-900 z-40 flex flex-col transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800">
          <img src="/rawafri-logo.png" alt="RawAfri" className="h-10 w-auto flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-slate-400 text-xs">Super Admin</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto lg:hidden text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${isActive
                    ? "bg-green-600 text-white shadow-sm"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                  }
                `}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && !isActive && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-70" />}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-600/20 border border-green-600/30 flex items-center justify-center">
              <span className="text-green-400 text-xs font-bold">
                {user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : "A"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-200 text-xs font-medium truncate">
                {user ? `${user.firstName} ${user.lastName}` : "Admin"}
              </p>
              <p className="text-slate-500 text-[11px] truncate">{user?.email ?? ""}</p>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}

export function AdminMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
    >
      <Menu className="w-5 h-5" />
    </button>
  );
}