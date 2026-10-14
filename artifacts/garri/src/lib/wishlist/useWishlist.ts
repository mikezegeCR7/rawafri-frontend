import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { getWishlist, addToWishlist, removeFromWishlist } from "./api";

export function useWishlist() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data: items } = useQuery({
    queryKey: ["wishlist"],
    queryFn: getWishlist,
    enabled: isAuthenticated,
  });

  const wishlistedIds = new Set(items?.map((i) => i.productId) ?? []);

  const addMutation = useMutation({
    mutationFn: addToWishlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success("Added to wishlist");
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "Couldn't add to wishlist");
    },
  });

  const removeMutation = useMutation({
    mutationFn: removeFromWishlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success("Removed from wishlist");
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "Couldn't remove item");
    },
  });

  const toggle = (productId: string) => {
    if (!isAuthenticated) {
      toast.message("Log in to save items to your wishlist");
      return;
    }
    if (wishlistedIds.has(productId)) {
      removeMutation.mutate(productId);
    } else {
      addMutation.mutate(productId);
    }
  };

  return {
    isWishlisted: (productId: string) => wishlistedIds.has(productId),
    toggle,
    isPending: addMutation.isPending || removeMutation.isPending,
  };
}