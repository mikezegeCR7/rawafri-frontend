// Mirrors backend/src/auth/dto/*.ts and backend/src/users/dto/safe-user-response.dto.ts
//
// The generated client in @workspace/api-client-react currently types these
// as `void` / `{ [key: string]: unknown }` because the backend's Swagger
// plugin wasn't enabled when openapi.json was last generated (now fixed —
// see nest-cli.json). Once someone reruns `pnpm orval` against a live
// backend, the generated hooks (useAuthControllerLogin, etc.) will carry
// these same shapes and this file can be deleted in favor of the generated
// types. Until then, this is the source of truth for the auth wiring.

export type Role = "CUSTOMER" | "ADMIN";

export interface SafeUser {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: SafeUser;
}

export interface MessageResponse {
  message: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  newPassword: string;
}

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
}
