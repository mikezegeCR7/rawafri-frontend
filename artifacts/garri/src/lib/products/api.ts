import { customFetch } from "@workspace/api-client-react";
import type {
  Category,
  CreateInventoryPayload,
  CreateProductPayload,
  Inventory,
  Product,
  UpdateInventoryPayload,
  UpdateProductPayload,
} from "./types";
import type { ProductView } from "./recentlyViewed.types";
import type { RecommendedProduct } from "./recommended.types";

export function getProducts() {
  return customFetch<Product[]>("/api/v1/products", { method: "GET" });
}

export function getProduct(id: string) {
  return customFetch<Product>(`/api/v1/products/${id}`, { method: "GET" });
}

export function getProductsByCategory(categoryId: string) {
  return customFetch<Product[]>(`/api/v1/products/category/${categoryId}`, {
    method: "GET",
  });
}

export function getCategories() {
  return customFetch<Category[]>("/api/v1/categories", { method: "GET" });
}

/** Admin-only: returns every product including unpublished/inactive ones.
 * The public getProducts() above only returns active products, which would
 * make an unpublished product disappear from the admin's own list too. */
export function getAllProductsAdmin() {
  return customFetch<Product[]>("/api/v1/admin/products", { method: "GET" });
}

// ─── Admin: product CRUD ────────────────────────────────────────────────────

export function createProduct(payload: CreateProductPayload) {
  return customFetch<Product>("/api/v1/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function updateProduct(id: string, payload: UpdateProductPayload) {
  return customFetch<Product>(`/api/v1/products/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function deleteProduct(id: string) {
  return customFetch<void>(`/api/v1/products/${id}`, { method: "DELETE" });
}

/** Uploads an image file and returns its public URL, for use as a
 * product's imageUrl. Doesn't touch any product record itself. */
export function uploadProductImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  // No Content-Type header — browser sets the multipart boundary itself.
  return customFetch<{ imageUrl: string }>("/api/v1/products/upload-image", {
    method: "POST",
    body: formData,
  });
}

// ─── Admin: inventory ───────────────────────────────────────────────────────

export function createInventory(payload: CreateInventoryPayload) {
  return customFetch<Inventory>("/api/v1/inventory", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function updateInventory(id: string, payload: UpdateInventoryPayload) {
  return customFetch<Inventory>(`/api/v1/inventory/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function logProductView(id: string) {
  return customFetch<{ message: string }>(`/api/v1/products/${id}/view`, {
    method: "POST",
  });
}

export function getRecentlyViewed() {
  return customFetch<ProductView[]>("/api/v1/products/recently-viewed", {
    method: "GET",
  });
}

export function getRecommended() {
  return customFetch<RecommendedProduct[]>("/api/v1/products/recommended", {
    method: "GET",
  });
}