import { customFetch } from "@workspace/api-client-react";
import type {
  AuthResponse,
  ForgotPasswordPayload,
  LoginPayload,
  MessageResponse,
  RegisterPayload,
  ResetPasswordPayload,
  SafeUser,
  UpdateProfilePayload,
  VerifyOtpPayload,
} from "./types";

// All paths are relative — customFetch prepends the backend origin set via
// setBaseUrl() in src/lib/api/bootstrap.ts. The /api/v1 segment matches the
// backend's global prefix (see backend src/main.ts: setGlobalPrefix('api/v1')).

export function registerRequest(payload: RegisterPayload) {
  return customFetch<AuthResponse>("/api/v1/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function loginRequest(payload: LoginPayload) {
  return customFetch<AuthResponse>("/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function forgotPasswordRequest(payload: ForgotPasswordPayload) {
  return customFetch<MessageResponse>("/api/v1/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function verifyOtpRequest(payload: VerifyOtpPayload) {
  return customFetch<MessageResponse>("/api/v1/auth/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function resetPasswordRequest(payload: ResetPasswordPayload) {
  return customFetch<MessageResponse>("/api/v1/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function getMeRequest() {
  return customFetch<SafeUser>("/api/v1/users/me", { method: "GET" });
}

export function updateMeRequest(payload: UpdateProfilePayload) {
  return customFetch<SafeUser>("/api/v1/users/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/** Revokes the stored refresh token server-side, so it can't be used to
 * silently refresh a session again even if someone else has a copy of it. */
export function logoutRequest() {
  return customFetch<MessageResponse>("/api/v1/auth/logout", { method: "POST" });
}