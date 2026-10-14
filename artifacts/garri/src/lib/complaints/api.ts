import { customFetch } from "@workspace/api-client-react";
import type { AdminComplaint } from "../notifications/types";

// Customer side of the backend complaints module. Same record shape the admin
// panel reads, minus the customer relation.
export type MyComplaint = Omit<AdminComplaint, "customer">;

export type CreateComplaintPayload = {
  orderId?: string;
  subject: string;
  message: string;
};

export function getMyComplaints() {
  return customFetch<MyComplaint[]>("/api/v1/complaints", { method: "GET" });
}

export function createComplaint(payload: CreateComplaintPayload) {
  return customFetch<MyComplaint>("/api/v1/complaints", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
