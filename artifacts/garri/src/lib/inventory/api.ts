import { customFetch } from "@workspace/api-client-react";
import type { InventoryRecord, UpdateInventoryAdminPayload } from "./types";

export function getAllInventory() {
  return customFetch<InventoryRecord[]>("/api/v1/inventory", { method: "GET" });
}

export function updateInventoryAdmin(id: string, payload: UpdateInventoryAdminPayload) {
  return customFetch<InventoryRecord>(`/api/v1/inventory/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}