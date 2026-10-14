import { customFetch } from "@workspace/api-client-react";
import type { PaymentRecord } from "../checkout/types";
import type { AdminPaymentListItem, MyPayment } from "./types";

export function verifyPaymentAdmin(paymentId: string) {
  return customFetch<PaymentRecord>(`/api/v1/payments/admin/${paymentId}/verify`, {
    method: "PATCH",
  });
}

export function rejectPaymentAdmin(paymentId: string, reason: string) {
  return customFetch<PaymentRecord>(`/api/v1/payments/admin/${paymentId}/reject`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
}

export function getAllPaymentsAdmin() {
  return customFetch<AdminPaymentListItem[]>("/api/v1/payments/admin", { method: "GET" });
}

export function getMyPayments() {
  return customFetch<MyPayment[]>("/api/v1/payments", { method: "GET" });
}