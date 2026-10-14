import { useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { toast } from "sonner";
import { apiErrorMessage } from "@/lib/api/errors";
import { useAuth } from "@/lib/auth/AuthContext";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthField, AuthPasswordField, AuthSubmit } from "@/components/auth/AuthFields";
import beansInHand from "@/assets/market-beans.jpeg";

export default function Login() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form);
      const redirect = new URLSearchParams(search).get("redirect");
      navigate(redirect || (user.role === "ADMIN" ? "/admin" : "/dashboard"));
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      image={beansInHand}
      imagePosition="50% 62%"
      imageAlt="A handful of fresh beans held over the farm they came from"
      statement="Raw foodstuff, sourced with care and brought to your door."
      statementSub="Pay by bank transfer. Our team checks every payment before your order is prepared, and you confirm delivery with a one-time code."
      title="Welcome back"
      subtitle="Sign in to your RawAfri account."
      footer={
        <>
          New to RawAfri?{" "}
          <Link href="/signup" className="font-semibold text-brand hover:underline underline-offset-4">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthField
          label="Email address"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        />
        <AuthPasswordField
          label="Password"
          autoComplete="current-password"
          required
          placeholder="Enter your password"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          aside={
            <Link
              href="/forgot-password"
              className="text-[13px] font-semibold text-terracotta hover:underline underline-offset-4"
            >
              Forgot password?
            </Link>
          }
        />
        <div className="pt-1">
          <AuthSubmit loading={loading} loadingText="Signing in...">
            Sign in
          </AuthSubmit>
        </div>
      </form>
    </AuthLayout>
  );
}
