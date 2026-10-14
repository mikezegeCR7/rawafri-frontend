import { customFetch } from "@workspace/api-client-react";
import type { BankAccount, DeliveryZone } from "../checkout/types";
import type { Category } from "../products/types";

// Admin "Store setup": bank accounts, delivery zones, categories and promo
// codes. Mirrors backend bank-accounts, delivery-zones, categories and
// promo-codes modules (all admin-only except the public reads).

const json = (method: string, body?: unknown) => ({
  method,
  headers: { "Content-Type": "application/json" },
  ...(body !== undefined && { body: JSON.stringify(body) }),
});

// ─── Bank accounts ──────────────────────────────────────────────────────────
// The first account added becomes active automatically; activating another
// deactivates the rest. Only an inactive account can be deleted.

export type BankAccountInput = { bankName: string; accountName: string; accountNumber: string };

export const getBankAccounts = () => customFetch<BankAccount[]>("/api/v1/bank-accounts", { method: "GET" });
export const createBankAccount = (body: BankAccountInput) =>
  customFetch<BankAccount>("/api/v1/bank-accounts", json("POST", body));
export const updateBankAccount = (id: string, body: Partial<BankAccountInput>) =>
  customFetch<BankAccount>(`/api/v1/bank-accounts/${id}`, json("PATCH", body));
export const activateBankAccount = (id: string) =>
  customFetch<BankAccount>(`/api/v1/bank-accounts/${id}/activate`, { method: "PATCH" });
export const deleteBankAccount = (id: string) =>
  customFetch<{ message: string }>(`/api/v1/bank-accounts/${id}`, { method: "DELETE" });

// ─── Delivery zones ─────────────────────────────────────────────────────────
// Listing returns active zones only; "remove" deactivates.

export type DeliveryZoneInput = { name: string; fee: number; estimatedTime: string };

export const getZones = () => customFetch<DeliveryZone[]>("/api/v1/delivery-zones", { method: "GET" });
export const createZone = (body: DeliveryZoneInput) =>
  customFetch<DeliveryZone>("/api/v1/delivery-zones", json("POST", body));
export const updateZone = (id: string, body: Partial<DeliveryZoneInput>) =>
  customFetch<DeliveryZone>(`/api/v1/delivery-zones/${id}`, json("PATCH", body));
export const removeZone = (id: string) =>
  customFetch<{ message: string }>(`/api/v1/delivery-zones/${id}`, { method: "DELETE" });

// ─── Categories ─────────────────────────────────────────────────────────────

export type CategoryInput = { name: string; slug: string; description?: string; sortOrder?: number };

export const getCategoriesAdmin = () => customFetch<Category[]>("/api/v1/categories", { method: "GET" });
export const createCategory = (body: CategoryInput) =>
  customFetch<Category>("/api/v1/categories", json("POST", body));
export const updateCategory = (id: string, body: Partial<CategoryInput>) =>
  customFetch<Category>(`/api/v1/categories/${id}`, json("PATCH", body));
export const removeCategory = (id: string) =>
  customFetch<{ message: string }>(`/api/v1/categories/${id}`, { method: "DELETE" });

// ─── Promo codes ────────────────────────────────────────────────────────────

export type PromoCode = {
  id: string;
  code: string;
  label: string;
  discountPercent: string;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
};

export type PromoCodeInput = {
  code: string;
  label: string;
  discountPercent: number;
  maxUses: number;
  expiresAt: string;
  isActive?: boolean;
};

export const getPromoCodesAdmin = () => customFetch<PromoCode[]>("/api/v1/promo-codes/admin", { method: "GET" });
export const createPromoCode = (body: PromoCodeInput) =>
  customFetch<PromoCode>("/api/v1/promo-codes", json("POST", body));
export const updatePromoCode = (id: string, body: Partial<PromoCodeInput>) =>
  customFetch<PromoCode>(`/api/v1/promo-codes/${id}`, json("PATCH", body));
export const deactivatePromoCode = (id: string) =>
  customFetch<{ message: string }>(`/api/v1/promo-codes/${id}`, { method: "DELETE" });

/** "Lagos Island" -> "lagos-island" for category slugs. */
export const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
