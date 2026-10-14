import { Router, Route, Switch } from "wouter";
import { Toaster } from "sonner";
import Index from "@/pages/Index";
import Dashboard from "@/pages/Dashboard";
import Admin from "@/pages/Admin";
import Orders from "@/pages/Orders";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import ProductDetail from "@/pages/ProductDetail";

export default function App() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return (
    <Router base={base}>
      <Switch>
        <Route path="/admin" component={Admin} />
        <Route path="/dashboard/:section?" component={Dashboard} />
        <Route path="/orders" component={Orders} />
        <Route path="/login" component={Login} />
        <Route path="/signup" component={Signup} />
        <Route path="/product/:id" component={ProductDetail} />
        <Route path="/" component={Index} />
      </Switch>
      <Toaster richColors position="top-center" />
    </Router>
  );
}