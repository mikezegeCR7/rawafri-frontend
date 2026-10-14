import { customFetch } from "@workspace/api-client-react";
import type { PlatformSettings } from "./types";

export function getSettings() {
  return customFetch<PlatformSettings>("/api/v1/settings", { method: "GET" });
}

export function updateSettings(maintenanceMode: boolean) {
  return customFetch<PlatformSettings>("/api/v1/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ maintenanceMode }),
  });
}