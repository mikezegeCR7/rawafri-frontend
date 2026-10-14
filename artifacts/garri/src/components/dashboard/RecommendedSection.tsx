import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { getRecommended } from "@/lib/products/api";
import { ProductGridSection } from "./ProductGridSection";

export function RecommendedSection() {
  const { data: products, isLoading } = useQuery({ queryKey: ["recommended"], queryFn: getRecommended });

  return (
    <ProductGridSection
      title="Recommended"
      description="Picked from the categories you've ordered from, plus our newest products."
      isLoading={isLoading}
      products={products?.map((p) => ({ key: p.id, ...p }))}
      empty={{
        icon: Sparkles,
        title: "Nothing to recommend yet",
        description: "Check back once more products are available.",
      }}
    />
  );
}
