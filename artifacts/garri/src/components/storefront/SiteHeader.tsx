import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  ShoppingBasket,
  Menu,
  LayoutDashboard,
  Package,
  Heart,
  LogOut,
  ShieldCheck,
  LifeBuoy,
  UserRound,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useCart } from "@/lib/cart/CartContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { btn, initials } from "./ui";

const NAV = [
  { href: "/", label: "Shop" },
  { href: "/#how-it-works", label: "How it works", anchor: true },
  { href: "/help", label: "Help" },
];

export function SiteHeader() {
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();
  const [location, navigate] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const signOut = () => {
    logout();
    navigate("/");
  };

  const navLink = (item: (typeof NAV)[number], className: string, onClick?: () => void) =>
    item.anchor ? (
      <a key={item.href} href={item.href} className={className} onClick={onClick}>
        {item.label}
      </a>
    ) : (
      <Link key={item.href} href={item.href} className={className} onClick={onClick}>
        {item.label}
      </Link>
    );

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="kente-rule h-1" aria-hidden />
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="RawAfri home" className="shrink-0">
          <img src="/rawafri-logo-compact.png" alt="RawAfri" className="h-11 w-auto" />
        </Link>

        <nav className="ml-6 hidden items-center gap-1 md:flex">
          {NAV.map((item) =>
            navLink(
              item,
              cn(
                "rounded-md px-3 py-2 text-sm font-semibold transition-colors hover:bg-accent",
                !item.anchor && location === item.href ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              ),
            ),
          )}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <Link
            href="/checkout"
            aria-label={`Basket, ${itemCount} item${itemCount === 1 ? "" : "s"}`}
            className="relative grid size-10 place-items-center rounded-md text-foreground transition-colors hover:bg-accent"
          >
            <ShoppingBasket className="size-5" />
            {itemCount > 0 && (
              <span className="absolute right-0.5 top-0.5 grid min-w-[18px] h-[18px] place-items-center rounded-full bg-terracotta px-1 text-[10px] font-bold text-white">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </Link>

          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="ml-1 hidden items-center gap-2 rounded-full py-1 pl-1 pr-3 transition-colors hover:bg-accent md:flex"
                aria-label="Account menu"
              >
                <span className="grid size-8 place-items-center rounded-full bg-cocoa text-[12px] font-bold text-background">
                  {initials(user.firstName, user.lastName)}
                </span>
                <span className="text-sm font-semibold text-foreground">{user.firstName}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-semibold text-foreground">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => navigate("/dashboard")}>
                  <LayoutDashboard className="size-4" /> My account
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate("/orders")}>
                  <Package className="size-4" /> Orders
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate("/dashboard/wishlist")}>
                  <Heart className="size-4" /> Wishlist
                </DropdownMenuItem>
                {user.role === "ADMIN" && (
                  <DropdownMenuItem onSelect={() => navigate("/admin")}>
                    <ShieldCheck className="size-4" /> Admin panel
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={signOut} className="text-destructive focus:text-destructive">
                  <LogOut className="size-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden items-center gap-1.5 md:flex">
              <Link href="/login" className={btn.ghost}>
                Log in
              </Link>
              <Link href="/signup" className={cn(btn.primary, btn.sm)}>
                Create account
              </Link>
            </div>
          )}

          {/* Mobile menu */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger
              className="grid size-10 place-items-center rounded-md transition-colors hover:bg-accent md:hidden"
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] bg-background p-0">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <div className="kente-rule h-1" aria-hidden />
              <div className="flex h-full flex-col p-5">
                {isAuthenticated && user ? (
                  <div className="mb-5 flex items-center gap-3 border-b border-border pb-5 pr-8">
                    <span className="grid size-10 place-items-center rounded-full bg-cocoa text-sm font-bold text-background">
                      {initials(user.firstName, user.lastName)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                ) : (
                  <img src="/rawafri-logo-mark.png" alt="RawAfri" className="mb-6 h-12 w-auto self-start" />
                )}

                <nav className="flex flex-col">
                  {NAV.map((item) =>
                    navLink(
                      item,
                      "rounded-md px-3 py-3 text-[15px] font-semibold text-foreground hover:bg-accent",
                      () => setMenuOpen(false),
                    ),
                  )}
                </nav>

                {isAuthenticated && user && (
                  <nav className="mt-3 flex flex-col border-t border-border pt-3">
                    {[
                      { href: "/dashboard", label: "My account", icon: UserRound },
                      { href: "/orders", label: "Orders", icon: Package },
                      { href: "/dashboard/wishlist", label: "Wishlist", icon: Heart },
                      { href: "/help", label: "Support", icon: LifeBuoy },
                      ...(user.role === "ADMIN" ? [{ href: "/admin", label: "Admin panel", icon: ShieldCheck }] : []),
                    ].map(({ href, label, icon: Icon }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 rounded-md px-3 py-3 text-[15px] font-medium text-foreground hover:bg-accent"
                      >
                        <Icon className="size-4 text-muted-foreground" /> {label}
                      </Link>
                    ))}
                  </nav>
                )}

                <div className="mt-auto pt-6">
                  {isAuthenticated ? (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        signOut();
                      }}
                      className={cn(btn.secondary, "w-full text-destructive")}
                    >
                      <LogOut className="size-4" /> Sign out
                    </button>
                  ) : (
                    <div className="grid gap-2">
                      <Link href="/signup" onClick={() => setMenuOpen(false)} className={cn(btn.primary, "w-full")}>
                        Create account
                      </Link>
                      <Link href="/login" onClick={() => setMenuOpen(false)} className={cn(btn.secondary, "w-full")}>
                        Log in
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
