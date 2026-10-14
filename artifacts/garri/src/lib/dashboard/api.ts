import { customFetch } from "@workspace/api-client-react";
import type { AdminDashboard } from "./types";

export function getAdminDashboard() {
  return customFetch<AdminDashboard>("/api/v1/dashboard/admin", { method: "GET" });
}