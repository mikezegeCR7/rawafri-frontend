import { useEffect, useRef, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Package,
  ShoppingBasket,
  Heart,
  Sparkles,
  Clock,
  CreditCard,
  MapPin,
  Bell,
  UserRound,
  LifeBuoy,
  LogOut,
} from "lucide-react";
import { SiteHeader } from "@/components/storefront/SiteHeader";
import { initials } from "@/components/storefront/ui";
import { useAuth } from "@/lib/auth/AuthContext";
import { useCart } from "@/lib/cart/CartContext";
import { getUnreadNotificationCount } from "@/lib/notifications/api";
import { getMyOrders } from "@/lib/orders/api";
import { cn } from "@/lib/utils";

export const ACCOUNT_NAV = [
  { key: "overview", label: "Overview", href: "/dashboard", icon: LayoutDashboard, group: "shop" },
  { key: "orders", label: "Orders", href: "/orders", icon: Package, group: "shop" },
  { key: "cart", label: "Basket", href: "/dashboard/cart", icon: ShoppingBasket, group: "shop" },
  { key: "wishlist", label: "Wishlist", href: "/dashboard/wishlist", icon: Heart, group: "shop" },
  { key: "recommended", label: "Recommended", href: "/dashboard/recommended", icon: Sparkles, group: "shop" },
  { key: "recent", label: "Recently viewed", href: "/dashboard/recent", icon: Clock, group: "shop" },
  { key: "payments", label: "Payments", href: "/dashboard/payments", icon: CreditCard, group: "account" },
  { key: "addresses", label: "Addresses", href: "/dashboard/addresses", icon: MapPin, group: "account" },
  { key: "notifications", label: "Notifications", href: "/dashboard/notifications", icon: Bell, group: "account" },
  { key: "profile", label: "Profile", href: "/dashboard/profile", icon: UserRound, group: "account" },
] as const;

export type AccountNavKey = (typeof ACCOUNT_NAV)[number]["key"];

export function accountHref(key: AccountNavKey) {
  return ACCOUNT_NAV.find((i) => i.key === key)!.href;
}

/** Real counts for the nav badges — basket from the cart, unread from the API,
 * orders = deliveries waiting for the customer's confirmation. */
function useNavBadges(): Partial<Record<AccountNavKey, number>> {
  const { itemCount } = useCart();
  const { data: unread } = useQuery({
    queryKey: ["unread-notification-count"],
    queryFn: getUnreadNotificationCount,
    refetchInterval: 60_000,
  });
  const { data: orders } = useQuery({ queryKey: ["my-orders"], queryFn: getMyOrders });
  const awaitingConfirmation = (orders ?? []).filter((o) => o.status === "AWAITING_CUSTOMER_CONFIRMATION").length;
  return {
    cart: itemCount,
    notifications: unread?.count ?? 0,
    orders: awaitingConfirmation,
  };
}

export function AccountLayout({ active, children }: { active: AccountNavKey; children: ReactNode }) {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const badges = useNavBadges();
  const tabsRef = useRef<HTMLDivElement>(null);

  // Keep the active tab visible in the mobile tab strip.
  useEffect(() => {
    tabsRef.current?.querySelector<HTMLElement>("[data-active=true]")?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [active]);

  const signOut = () => {
    logout();
    navigate("/");
  };

  const group = (name: "shop" | "account") => ACCOUNT_NAV.filter((i) => i.group === name);

  const item = (nav: (typeof ACCOUNT_NAV)[number]) => {
    const isActive = nav.key === active;
    const badge = badges[nav.key];
    const Icon = nav.icon;
    return (
      <Link
        key={nav.key}
        href={nav.href}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors",
          isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground",
        )}
      >
        <Icon className={cn("size-4 shrink-0", isActive && "text-brand")} />
        <span className="flex-1">{nav.label}</span>
        {!!badge && (
          <span
            className={cn(
              "grid min-w-5 h-5 place-items-center rounded-full px-1.5 text-[10px] font-bold",
              nav.key === "orders" ? "bg-terracotta text-white" : "bg-cocoa text-background",
            )}
          >
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      {/* Mobile tab strip */}
      <div className="border-b border-border bg-background lg:hidden">
        <div ref={tabsRef} className="scrollbar-hide flex gap-1 overflow-x-auto px-4 py-2">
          {ACCOUNT_NAV.map((nav) => {
            const isActive = nav.key === active;
            const badge = badges[nav.key];
            return (
              <Link
                key={nav.key}
                href={nav.href}
                data-active={isActive}
                className={cn(
                  "flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition-colors",
                  isActive ? "bg-cocoa text-background" : "text-muted-foreground hover:bg-accent",
                )}
              >
                {nav.label}
                {!!badge && (
                  <span
                    className={cn(
                      "grid min-w-4 h-4 place-items-center rounded-full px-1 text-[9px] font-bold",
                      isActive ? "bg-background text-cocoa" : nav.key === "orders" ? "bg-terracotta text-white" : "bg-cocoa text-background",
                    )}
                  >
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-10 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-24 space-y-6">
            {user && (
              <div className="flex items-center gap-3 px-1">
                <span className="grid size-11 place-items-center rounded-full bg-cocoa text-sm font-bold text-background">
                  {initials(user.firstName, user.lastName)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-foreground">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
            )}
            <nav className="space-y-0.5">
              <p className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground/80">Shopping</p>
              {group("shop").map(item)}
            </nav>
            <nav className="space-y-0.5">
              <p className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground/80">Account</p>
              {group("account").map(item)}
            </nav>
            <div className="space-y-0.5 border-t border-border pt-4">
              <Link
                href="/help"
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <LifeBuoy className="size-4" /> Help &amp; support
              </Link>
              <button
                onClick={signOut}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/5"
              >
                <LogOut className="size-4" /> Sign out
              </button>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 animate-fade-up">{children}</main>
      </div>
    </div>
  );
}
