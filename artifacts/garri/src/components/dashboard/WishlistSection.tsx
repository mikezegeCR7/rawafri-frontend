import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Heart } from "lucide-react";
import { getWishlist } from "@/lib/wishlist/api";
import { btn } from "@/components/storefront/ui";
import { ProductGridSection } from "./ProductGridSection";

export function WishlistSection() {
  const { data: items, isLoading } = useQuery({ queryKey: ["wishlist"], queryFn: getWishlist });

  return (
    <ProductGridSection
      title="Wishlist"
      description={`${items?.length ?? 0} saved item${items?.length === 1 ? "" : "s"}. Tap the heart to remove one.`}
      isLoading={isLoading}
      products={items?.map((i) => ({ key: i.id, ...i.product }))}
      empty={{
        icon: Heart,
        title: "Nothing saved yet",
        description: "Tap the heart on any product to keep it here for later.",
        action: <Link href="/" className={btn.primary}>Browse the market</Link>,
      }}
    />
  );
}
