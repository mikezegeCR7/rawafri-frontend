import { ApiError } from "@workspace/api-client-react";

/**
 * Customer-facing text for a failed request.
 *
 * ApiError.message is built for logs ("HTTP 401 Unauthorized: …"), so this reads
 * the backend's own `message` instead. NestJS validation errors send an array of
 * messages; the first one is shown.
 */
export function apiErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (!(error instanceof ApiError)) return fallback;
  const data = error.data as { message?: unknown } | null;
  const message = Array.isArray(data?.message) ? data.message[0] : data?.message;
  if (typeof message === "string" && message.trim()) {
    return message.charAt(0).toUpperCase() + message.slice(1);
  }
  return fallback;
}
