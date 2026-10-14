import { customFetch } from "@workspace/api-client-react";
import type { AdminComplaint, AdminNotification, UpdateComplaintPayload } from "./types";

export function getMyNotifications() {
  return customFetch<AdminNotification[]>("/api/v1/notifications", { method: "GET" });
}

export function getUnreadNotificationCount() {
  return customFetch<{ count: number }>("/api/v1/notifications/unread-count", { method: "GET" });
}

export function markNotificationRead(id: string) {
  return customFetch<AdminNotification>(`/api/v1/notifications/${id}/read`, { method: "PATCH" });
}

export function markAllNotificationsRead() {
  return customFetch<{ message: string }>("/api/v1/notifications/read-all", { method: "PATCH" });
}

// ─── Admin complaints ───────────────────────────────────────────────────────

export function getAllComplaintsAdmin() {
  return customFetch<AdminComplaint[]>("/api/v1/complaints/admin", { method: "GET" });
}

export function updateComplaintAdmin(id: string, payload: UpdateComplaintPayload) {
  return customFetch<AdminComplaint>(`/api/v1/complaints/admin/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}