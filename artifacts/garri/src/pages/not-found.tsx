import { Link } from "wouter";
import { SiteHeader } from "@/components/storefront/SiteHeader";
import { SiteFooter } from "@/components/storefront/SiteFooter";
import { btn } from "@/components/storefront/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-24 text-center">
        <p className="font-display text-7xl text-gold">404</p>
        <h1 className="mt-4 font-display text-3xl text-foreground">We couldn't find that page</h1>
        <p className="mt-2 text-[15px] text-muted-foreground">The link may be broken, or the page may have moved.</p>
        <Link href="/" className={`${btn.primary} mt-8`}>
          Back to the market
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
