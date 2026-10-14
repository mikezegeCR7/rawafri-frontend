import type { ReactNode } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getSettings } from "@/lib/settings/api";
import { useAuth } from "@/lib/auth/AuthContext";

function MaintenanceScreen() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="kente-rule h-1" aria-hidden />
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="max-w-md text-center">
          <img src="/rawafri-logo-mark.png" alt="RawAfri" className="mx-auto h-20 w-auto" />
          <h1 className="mt-10 font-display text-4xl text-foreground">We'll be right back</h1>
          <p className="mt-3 text-[15px] text-muted-foreground">
            RawAfri is down for maintenance. Your basket and orders are safe. Please check back shortly.
          </p>
        </div>
      </div>
    </div>
  );
}

export function MaintenanceGate({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user } = useAuth();

  const { data: settings } = useQuery({
    queryKey: ["platform-settings-check"],
    queryFn: getSettings,
    // Not urgent to be instant — avoid hammering this on every navigation.
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const isAdmin = user?.role === "ADMIN";
  // Always let /login through so an admin can authenticate during maintenance
  // and then get past this gate once their ADMIN role is known.
  const isLoginRoute = location === "/login";

  if (settings?.maintenanceMode && !isAdmin && !isLoginRoute) {
    return <MaintenanceScreen />;
  }

  return <>{children}</>;
}