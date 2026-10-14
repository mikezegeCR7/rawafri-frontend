import { customFetch } from "@workspace/api-client-react";
import type { CustomerDetail, CustomerListResponse } from "./types";

// Backend pagination has no search/status-filter query params yet, so we
// pull a generously large page and do search/filter/sort client-side —
// fine while the customer base is small; would need real server-side
// filtering if it grows into the thousands.
export function getCustomers(limit = 200) {
  return customFetch<CustomerListResponse>(`/api/v1/users?page=1&limit=${limit}`, {
    method: "GET",
  });
}

export function getCustomerDetail(id: string) {
  return customFetch<CustomerDetail>(`/api/v1/users/${id}`, { method: "GET" });
}

export function toggleCustomerStatus(id: string) {
  return customFetch(`/api/v1/users/${id}/toggle-status`, { method: "PATCH" });
}
export function promoteToAdmin(id: string) {
  return customFetch(`/api/v1/users/${id}/promote`, { method: "PATCH" });
}

export function getAdmins() {
  return customFetch<Customer[]>("/api/v1/users/admins/list", { method: "GET" });
}

export function demoteToCustomer(id: string) {
  return customFetch(`/api/v1/users/${id}/demote`, { method: "PATCH" });
}