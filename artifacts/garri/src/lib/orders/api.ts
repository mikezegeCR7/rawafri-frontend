import { customFetch } from "@workspace/api-client-react";
import type { AdminFullOrder, FullOrder, UpdateOrderStatusPayload } from "./types";

export function getMyOrders() {
  return customFetch<FullOrder[]>("/api/v1/orders", { method: "GET" });
}

export function getMyOrder(id: string) {
  return customFetch<FullOrder>(`/api/v1/orders/${id}`, { method: "GET" });
}

export function confirmDelivery(orderId: string) {
  return customFetch<FullOrder>(`/api/v1/orders/${orderId}/confirm-delivery`, {
    method: "POST",
  });
}

export function sendDeliveryOtp(orderId: string) {
  return customFetch<{ message: string }>(`/api/v1/orders/${orderId}/send-delivery-otp`, {
    method: "POST",
  });
}

export function confirmDeliveryOtp(orderId: string, otp: string) {
  return customFetch<FullOrder>(`/api/v1/orders/${orderId}/confirm-delivery-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ otp }),
  });
}

// ─── Admin ──────────────────────────────────────────────────────────────────

export function getAllOrdersAdmin() {
  return customFetch<AdminFullOrder[]>("/api/v1/admin/orders", { method: "GET" });
}

export function getOrderAdmin(id: string) {
  return customFetch<AdminFullOrder>(`/api/v1/admin/orders/${id}`, { method: "GET" });
}

export function updateOrderStatusAdmin(id: string, payload: UpdateOrderStatusPayload) {
  return customFetch<AdminFullOrder>(`/api/v1/admin/orders/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}