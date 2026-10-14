import { customFetch } from "@workspace/api-client-react";
import type {
  Address,
  BankAccount,
  CreateAddressPayload,
  CreateOrderPayload,
  CreatedOrderResponse,
  DeliveryZone,
  PromoValidation,
} from "./types";

export function getAddresses() {
  return customFetch<Address[]>("/api/v1/addresses", { method: "GET" });
}

export function createAddress(payload: CreateAddressPayload) {
  return customFetch<Address>("/api/v1/addresses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
export function updateAddress(id: string, payload: Partial<CreateAddressPayload>) {
  return customFetch<Address>(`/api/v1/addresses/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function deleteAddress(id: string) {
  return customFetch<{ message: string }>(`/api/v1/addresses/${id}`, {
    method: "DELETE",
  });
}

export function setDefaultAddress(id: string) {
  return customFetch<Address>(`/api/v1/addresses/${id}/set-default`, {
    method: "PATCH",
  });
}

export function getDeliveryZones() {
  return customFetch<DeliveryZone[]>("/api/v1/delivery-zones", { method: "GET" });
}

export function getActiveBankAccount() {
  return customFetch<BankAccount>("/api/v1/bank-accounts/active", { method: "GET" });
}

/** Checks a promo code before the order is placed. The backend re-validates at order creation. */
export function validatePromoCode(code: string) {
  return customFetch<PromoValidation>("/api/v1/promo-codes/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
}

export function createOrder(payload: CreateOrderPayload) {
  return customFetch<CreatedOrderResponse>("/api/v1/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/** file is required by the backend's FileInterceptor even though the UI treats it as optional pre-upload. */
export function uploadPaymentProof(paymentId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  // Deliberately no Content-Type header — the browser sets the correct
  // multipart/form-data boundary itself when body is a FormData instance.
  return customFetch(`/api/v1/payments/${paymentId}/upload-proof`, {
    method: "PATCH",
    body: formData,
  });
}