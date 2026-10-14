import { useLayoutEffect } from "react";
import { Router, Route, Switch, useLocation } from "wouter";
import { Toaster } from "sonner";
import Index from "@/pages/Index";
import Dashboard from "@/pages/Dashboard";
import Admin from "@/pages/Admin";
import Orders from "@/pages/Orders";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Checkout from "@/pages/Checkout";
import ForgotPassword from "@/pages/ForgotPassword";
import Help from "@/pages/Help";
import ProductDetail from "@/pages/ProductDetail";
import NotFound from "@/pages/not-found";
import { RequireAdmin, RequireAuth } from "@/lib/auth/RequireAuth";
import { MaintenanceGate } from "@/components/MaintenanceGate";

// The admin panel keeps its original theme; everything else uses the storefront theme.
// The class goes on <html> so portaled dialogs and toasts follow it too.
function ThemeScope() {
  const [location] = useLocation();
  useLayoutEffect(() => {
    document.documentElement.classList.toggle("admin-theme", location.startsWith("/admin"));
  }, [location]);
  return null;
}

export default function App() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return (
        <Router base={base}>
      <ThemeScope />
      <MaintenanceGate>
      <Switch>
        <Route path="/admin">
          <RequireAdmin>
            <Admin />
          </RequireAdmin>
        </Route>
        <Route path="/dashboard/:section?">
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        </Route>
                <Route path="/orders/:id?">
          <RequireAuth>
            <Orders />
          </RequireAuth>
        </Route>
        <Route path="/login" component={Login} />
        <Route path="/signup" component={Signup} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/help" component={Help} />
        <Route path="/checkout">
          <RequireAuth>
            <Checkout />
          </RequireAuth>
        </Route>
        <Route path="/product/:id" component={ProductDetail} />
        <Route path="/" component={Index} />
        <Route component={NotFound} />
            </Switch>
      </MaintenanceGate>
      <Toaster richColors position="top-center" />
    </Router>
  );
}