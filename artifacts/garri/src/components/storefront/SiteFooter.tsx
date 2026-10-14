import { Link } from "wouter";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-secondary/60">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div>
          <img src="/rawafri-logo-mark.png" alt="RawAfri" className="h-12 w-auto" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Premium raw African foodstuff, sourced and delivered by RawAfri. Pay by bank transfer and follow your order
            until it reaches your door.
          </p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-foreground">Shop</p>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            <li><Link href="/" className="hover:text-foreground">All products</Link></li>
            <li><a href="/#how-it-works" className="hover:text-foreground">How it works</a></li>
            <li><Link href="/checkout" className="hover:text-foreground">Your basket</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-foreground">Account</p>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            <li><Link href="/dashboard" className="hover:text-foreground">My account</Link></li>
            <li><Link href="/orders" className="hover:text-foreground">Track an order</Link></li>
            <li><Link href="/help" className="hover:text-foreground">Help &amp; support</Link></li>
          </ul>
        </div>
      </div>
      <div className="kente-rule h-1" aria-hidden />
      <div className="mx-auto max-w-7xl px-4 py-5 text-xs text-muted-foreground sm:px-6 lg:px-8">
        © {new Date().getFullYear()} RawAfri. All rights reserved.
      </div>
    </footer>
  );
}
