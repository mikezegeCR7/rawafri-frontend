import { customFetch } from "@workspace/api-client-react";
import type { WishlistItem } from "./types";

export function getWishlist() {
  return customFetch<WishlistItem[]>("/api/v1/wishlist", { method: "GET" });
}

export function addToWishlist(productId: string) {
  return customFetch<WishlistItem>(`/api/v1/wishlist/${productId}`, {
    method: "POST",
  });
}

export function removeFromWishlist(productId: string) {
  return customFetch<{ message: string }>(`/api/v1/wishlist/${productId}`, {
    method: "DELETE",
  });
}