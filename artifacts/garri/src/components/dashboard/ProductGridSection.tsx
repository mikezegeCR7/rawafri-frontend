import type { ComponentType, ReactNode } from "react";
import { ProductCard, ProductCardSkeleton, type CardProduct } from "@/components/marketplace/ProductCard";
import { EmptyState, PageHeading } from "@/components/storefront/ui";

/** Layout shared by Wishlist, Recently viewed and Recommended. */
export function ProductGridSection({
  title,
  description,
  products,
  isLoading,
  empty,
}: {
  title: string;
  description?: ReactNode;
  products: (CardProduct & { key: string })[] | undefined;
  isLoading: boolean;
  empty: { icon: ComponentType<{ className?: string }>; title: string; description: string; action?: ReactNode };
}) {
  return (
    <div className="space-y-8">
      <PageHeading title={title} description={!isLoading && products?.length ? description : undefined} />
      {isLoading ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : !products || products.length === 0 ? (
        <EmptyState {...empty} />
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 xl:grid-cols-4">
          {products.map(({ key, ...product }) => (
            <ProductCard key={key} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
