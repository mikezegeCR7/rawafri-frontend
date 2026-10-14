import { clearTokens, getRefreshToken, setTokens } from "./storage";

/** Dispatched on window when the session can't be recovered (refresh token
 * missing, invalid, or expired) — AuthContext listens for this to clear
 * the logged-in user and redirect, since this can happen outside of any
 * React event (e.g. mid-background-request). */
export const SESSION_EXPIRED_EVENT = "rawafri:session-expired";

// Deliberately a raw fetch, not customFetch — this call must never itself
// be subject to the 401-retry interceptor (that would recurse).
async function exchangeRefreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string } | null> {
  const apiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, "") ?? "";

  try {
    const res = await fetch(`${apiUrl}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (typeof data?.accessToken !== "string" || typeof data?.refreshToken !== "string") return null;
    return { accessToken: data.accessToken, refreshToken: data.refreshToken };
  } catch {
    return null;
  }
}

let inFlight: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearTokens();
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    return null;
  }

  const result = await exchangeRefreshToken(refreshToken);
  if (!result) {
    clearTokens();
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    return null;
  }

  setTokens(result.accessToken, result.refreshToken);
  return result.accessToken;
}

/** Registered as the api-client-react unauthorized handler. If several
 * requests 401 around the same time, they all await the same in-flight
 * refresh instead of each triggering their own. */
export function refreshSession(): Promise<string | null> {
  if (!inFlight) {
    inFlight = doRefresh().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}