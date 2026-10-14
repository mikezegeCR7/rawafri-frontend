import { ApiError } from "@workspace/api-client-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getMeRequest, loginRequest, logoutRequest, registerRequest } from "./api";
import { clearTokens, getAccessToken, setTokens } from "./storage";
import { SESSION_EXPIRED_EVENT } from "./refreshSession";
import type { LoginPayload, RegisterPayload, SafeUser } from "./types";

interface AuthContextValue {
  user: SafeUser | null;
  /** True while the initial session hydration (on page load) is in flight. */
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<SafeUser>;
  register: (payload: RegisterPayload) => Promise<SafeUser>;
  logout: () => void;
  /** Re-fetch the current user from the backend (e.g. after profile edits). */
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      if (!getAccessToken()) {
        setIsLoading(false);
        return;
      }
      try {
        const me = await getMeRequest();
        if (!cancelled) setUser(me);
      } catch (error) {
        // Token missing/expired/invalid — treat as logged out.
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          clearTokens();
        }
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fired by the silent-refresh logic (see refreshSession.ts) when a 401
  // couldn't be recovered — e.g. the refresh token itself expired. This can
  // happen from a background request outside any user click, so we listen
  // globally rather than relying on a component catching the error.
  useEffect(() => {
    function handleSessionExpired() {
      setUser(null);
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const res = await loginRequest(payload);
    setTokens(res.accessToken, res.refreshToken);
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const res = await registerRequest(payload);
    setTokens(res.accessToken, res.refreshToken);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(() => {
    // Best-effort server-side revoke of the stored refresh token — must not
    // block or fail local logout even if this request fails (offline,
    // already-expired token, etc).
    logoutRequest().catch(() => {});
    clearTokens();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const me = await getMeRequest();
    setUser(me);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}