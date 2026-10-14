import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { apiErrorMessage } from "@/lib/api/errors";
import { useAuth } from "@/lib/auth/AuthContext";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthField, AuthPasswordField, AuthSubmit } from "@/components/auth/AuthFields";
import { PasswordRules, isStrongPassword } from "@/components/auth/PasswordRules";
import yamHeap from "@/assets/yam.jpeg";

export default function Signup() {
  const [, navigate] = useLocation();
  const { register } = useAuth();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStrongPassword(form.password)) {
      toast.error("Please choose a password that meets all four requirements.");
      return;
    }
    setLoading(true);
    try {
      await register(form);
      navigate("/dashboard");
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <AuthLayout
      image={yamHeap}
      imageAlt="Tubers of yam stacked at the market"
      statement="Stock your kitchen without the market run."
      statementSub="Order grains, tubers, beans and more, then follow every order from payment to delivery in one place."
      title="Create your account"
      subtitle="It takes less than a minute."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-brand hover:underline underline-offset-4">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <AuthField
            label="First name"
            autoComplete="given-name"
            required
            value={form.firstName}
            onChange={set("firstName")}
          />
          <AuthField
            label="Last name"
            autoComplete="family-name"
            required
            value={form.lastName}
            onChange={set("lastName")}
          />
        </div>
        <AuthField
          label="Email address"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          value={form.email}
          onChange={set("email")}
        />
        <AuthField
          label="Phone number"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          placeholder="0801 234 5678"
          value={form.phone}
          onChange={set("phone")}
          aside={<span className="text-xs text-muted-foreground">Nigerian number</span>}
        />
        <div>
          <AuthPasswordField
            label="Password"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="Create a strong password"
            value={form.password}
            onChange={set("password")}
          />
          <PasswordRules password={form.password} />
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">
          By creating an account you agree to our{" "}
          <a href="#" className="font-semibold text-foreground hover:underline underline-offset-4">Terms of Service</a>{" "}
          and{" "}
          <a href="#" className="font-semibold text-foreground hover:underline underline-offset-4">Privacy Policy</a>.
        </p>

        <AuthSubmit loading={loading} loadingText="Creating account...">
          Create account
        </AuthSubmit>
      </form>
    </AuthLayout>
  );
}
