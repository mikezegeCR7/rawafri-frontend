import { useQuery } from "@tanstack/react-query";
import { Clock } from "lucide-react";
import { getRecentlyViewed } from "@/lib/products/api";
import { ProductGridSection } from "./ProductGridSection";

export function RecentlyViewedSection() {
  const { data: views, isLoading } = useQuery({ queryKey: ["recently-viewed"], queryFn: getRecentlyViewed });

  return (
    <ProductGridSection
      title="Recently viewed"
      description="Products you've looked at, newest first."
      isLoading={isLoading}
      products={views?.map((v) => ({ key: v.id, ...v.product }))}
      empty={{
        icon: Clock,
        title: "No recently viewed items",
        description: "Products you open will show up here so you can find them again.",
      }}
    />
  );
}
