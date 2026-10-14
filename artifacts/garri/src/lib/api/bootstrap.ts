import { setAuthTokenGetter, setBaseUrl, setUnauthorizedHandler } from "@workspace/api-client-react";
import { ACCESS_TOKEN_KEY } from "../auth/storage";
import { refreshSession } from "../auth/refreshSession";

// Runs once, before React renders (see src/main.tsx).
export function bootstrapApiClient() {
  const apiUrl = import.meta.env.VITE_API_URL as string | undefined;

  if (!apiUrl) {
    // eslint-disable-next-line no-console
    console.warn(
      "[api] VITE_API_URL is not set — requests will be sent to the current origin, which is wrong unless the frontend and backend are served together. Copy .env.example to .env.local and set VITE_API_URL to the backend URL.",
    );
  }

  setBaseUrl(apiUrl ?? null);

  // customFetch checks localStorage itself (rather than React state) so it
  // always has the latest token, even for requests fired outside a React
  // render (e.g. from a plain event handler before context updates).
  setAuthTokenGetter(() => localStorage.getItem(ACCESS_TOKEN_KEY));

  // On a 401 from a token-bearing request, silently exchange the refresh
  // token for a new access token and retry — the person never notices
  // their 15-minute access token expired mid-session.
  setUnauthorizedHandler(refreshSession);
}