import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X, ArrowRight, ShoppingBasket, Landmark, PackageCheck, KeyRound } from "lucide-react";
import { ProductCard, ProductCardSkeleton } from "@/components/marketplace/ProductCard";
import { SiteHeader } from "@/components/storefront/SiteHeader";
import { SiteFooter } from "@/components/storefront/SiteFooter";
import { Eyebrow, btn, Panel } from "@/components/storefront/ui";
import { cn } from "@/lib/utils";
import { getCategories, getProducts } from "@/lib/products/api";
import type { Product } from "@/lib/products/types";

import rice from "@/assets/rice.jpeg";
import onions from "@/assets/bulk-onions.jpeg";
import sweetPotato from "@/assets/sweet-potato.jpeg";

export default function Index() {
  const [query, setQuery] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

  const goToShop = () => document.getElementById("shop")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <Hero
        query={query}
        onQueryChange={setQuery}
        onSearch={goToShop}
      />
      <HowItWorks />
      <Shop
        query={query}
        onQueryChange={setQuery}
        activeCategoryId={activeCategoryId}
        onCategoryChange={setActiveCategoryId}
      />
      <SiteFooter />
    </div>
  );
}

function Hero({
  query,
  onQueryChange,
  onSearch,
}: {
  query: string;
  onQueryChange: (q: string) => void;
  onSearch: () => void;
}) {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:px-8 lg:py-20">
        <div className="animate-fade-up">
          <Eyebrow>Premium raw African food sourcing</Eyebrow>
          <h1 className="mt-4 font-display text-[2.6rem] leading-[1.05] text-foreground sm:text-6xl lg:text-[4.1rem]">
            Raw foodstuff, brought <span className="italic text-brand">straight</span> to your kitchen.
          </h1>
          <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-muted-foreground">
            Grains, tubers, beans and more. Order online, pay by bank transfer, and follow every step until your order
            reaches your door.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSearch();
            }}
            className="mt-8 flex max-w-xl items-center gap-2 rounded-lg border border-input bg-card p-1.5 shadow-[0_10px_30px_-18px_oklch(0.3_0.05_50/0.35)] focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/15"
          >
            <Search className="ml-2.5 size-5 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search rice, beans, yam…"
              aria-label="Search products"
              className="min-w-0 flex-1 bg-transparent py-2.5 text-[15px] text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
            />
            <button type="submit" className={cn(btn.primary, "h-10 px-5")}>
              Search
            </button>
          </form>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <button onClick={onSearch} className={btn.link}>
              Browse all products <ArrowRight className="size-4" />
            </button>
            <a href="#how-it-works" className="inline-flex items-center gap-1 font-semibold text-muted-foreground hover:text-foreground">
              How ordering works
            </a>
          </div>
        </div>

        {/* Photo collage — real market photos */}
        <div className="relative grid h-[420px] grid-cols-[1.25fr_1fr] grid-rows-2 gap-3 sm:h-[520px]">
          <figure className="row-span-2 overflow-hidden rounded-lg">
            <img src={rice} alt="Grains of rice" className="size-full object-cover" loading="eager" />
          </figure>
          <figure className="overflow-hidden rounded-lg">
            <img src={onions} alt="Bags of onions" className="size-full object-cover" />
          </figure>
          <figure className="overflow-hidden rounded-lg">
            <img src={sweetPotato} alt="Sweet potatoes" className="size-full object-cover" />
          </figure>
          <div className="kente-rule absolute -bottom-3 left-6 right-6 h-1.5 rounded-full" aria-hidden />
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  {
    icon: ShoppingBasket,
    title: "Fill your basket",
    body: "Choose from the products we have in stock today. Prices are shown up front.",
  },
  {
    icon: Landmark,
    title: "Pay by bank transfer",
    body: "Transfer to the account shown at checkout and upload your receipt.",
  },
  {
    icon: PackageCheck,
    title: "We confirm and prepare",
    body: "Our team checks your payment, then prepares your order. You're notified at each step.",
  },
  {
    icon: KeyRound,
    title: "Receive and confirm",
    body: "When your order arrives, confirm delivery with a one-time code sent to your email.",
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 border-b border-border bg-secondary/50">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="max-w-2xl">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="mt-3 font-display text-3xl leading-tight text-foreground sm:text-4xl">
            Simple ordering, with a person checking every payment.
          </h2>
        </div>
        <ol className="mt-12 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <li key={title} className="flex flex-col bg-background p-6 lg:p-7">
              <div className="flex items-center justify-between">
                <span className="font-display text-4xl text-gold">{String(i + 1).padStart(2, "0")}</span>
                <Icon className="size-5 text-brand" />
              </div>
              <h3 className="mt-6 text-base font-bold text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function matches(product: Product, q: string) {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return [product.name, product.category?.name, product.description]
    .filter(Boolean)
    .some((field) => field!.toLowerCase().includes(needle));
}

function Shop({
  query,
  onQueryChange,
  activeCategoryId,
  onCategoryChange,
}: {
  query: string;
  onQueryChange: (q: string) => void;
  activeCategoryId: string | null;
  onCategoryChange: (id: string | null) => void;
}) {
  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: getCategories });
  const { data: products, isLoading, isError, refetch } = useQuery({ queryKey: ["products"], queryFn: getProducts });

  const visible = useMemo(
    () =>
      (products ?? []).filter(
        (p) => (!activeCategoryId || p.categoryId === activeCategoryId) && matches(p, query),
      ),
    [products, activeCategoryId, query],
  );

  // Only show categories that actually have products for sale.
  const stockedCategories = useMemo(() => {
    const withProducts = new Set((products ?? []).map((p) => p.categoryId));
    return (categories ?? []).filter((c) => withProducts.has(c.id));
  }, [categories, products]);

  const filtering = Boolean(query.trim() || activeCategoryId);
  const activeCategory = stockedCategories.find((c) => c.id === activeCategoryId);

  return (
    <section id="shop" className="scroll-mt-16">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Eyebrow>The market</Eyebrow>
            <h2 className="mt-3 font-display text-3xl text-foreground sm:text-4xl">
              {activeCategory ? activeCategory.name : "Shop all products"}
            </h2>
          </div>
          <label className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search products"
              aria-label="Search products"
              className="h-10 w-full rounded-md border border-input bg-card pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
            />
            {query && (
              <button
                onClick={() => onQueryChange("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </label>
        </div>

        {/* Category filter */}
        {stockedCategories.length > 0 && (
          <div className="scrollbar-hide -mx-4 mt-8 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
            <CategoryPill active={!activeCategoryId} onClick={() => onCategoryChange(null)}>
              All
            </CategoryPill>
            {stockedCategories.map((cat) => (
              <CategoryPill
                key={cat.id}
                active={activeCategoryId === cat.id}
                onClick={() => onCategoryChange(activeCategoryId === cat.id ? null : cat.id)}
              >
                {cat.name}
              </CategoryPill>
            ))}
          </div>
        )}

        <div className="mt-10">
          {isLoading && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          )}

          {isError && (
            <Panel className="px-6 py-14 text-center">
              <p className="font-display text-xl text-foreground">We couldn't load the market right now.</p>
              <p className="mt-1.5 text-sm text-muted-foreground">Check your connection and try again.</p>
              <button onClick={() => refetch()} className={cn(btn.secondary, "mt-6")}>
                Try again
              </button>
            </Panel>
          )}

          {!isLoading && !isError && visible.length === 0 && (
            <Panel className="px-6 py-14 text-center">
              <p className="font-display text-xl text-foreground">
                {filtering ? "Nothing matches that search." : "No products are available right now."}
              </p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {filtering ? "Try a different word, or clear the filters." : "Please check back soon."}
              </p>
              {filtering && (
                <button
                  onClick={() => {
                    onQueryChange("");
                    onCategoryChange(null);
                  }}
                  className={cn(btn.secondary, "mt-6")}
                >
                  Clear filters
                </button>
              )}
            </Panel>
          )}

          {!isLoading && !isError && visible.length > 0 && (
            <>
              {filtering && (
                <p className="mb-6 text-sm text-muted-foreground">
                  {visible.length} product{visible.length === 1 ? "" : "s"}
                  {query.trim() && (
                    <>
                      {" "}for <span className="font-semibold text-foreground">"{query.trim()}"</span>
                    </>
                  )}
                </p>
              )}
              <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
                {visible.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function CategoryPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-9 shrink-0 whitespace-nowrap rounded-full border px-4 text-sm font-semibold transition-colors",
        active
          ? "border-cocoa bg-cocoa text-background"
          : "border-input bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
