import { useState } from "react";
import { Link } from "wouter";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { apiErrorMessage } from "@/lib/api/errors";
import { forgotPasswordRequest, resetPasswordRequest, verifyOtpRequest } from "@/lib/auth/api";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthField, AuthPasswordField, AuthSubmit } from "@/components/auth/AuthFields";
import { PasswordRules, isStrongPassword } from "@/components/auth/PasswordRules";
import marketBeans from "@/assets/honey-beans.jpeg";

type Step = "email" | "otp" | "reset" | "done";

const errorMessage = apiErrorMessage;

const STEP_COPY: Record<Step, { title: string; subtitle?: string }> = {
  email: { title: "Reset your password", subtitle: "Enter your email and we'll send you a 6-digit reset code." },
  otp: { title: "Check your email" },
  reset: { title: "Choose a new password", subtitle: "Make it one you don't use anywhere else." },
  done: { title: "Password updated", subtitle: "You can now sign in with your new password." },
};

export default function ForgotPassword() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const res = await forgotPasswordRequest({ email });
      setStep("otp");
      toast.success(res.message);
    } catch (error) {
      toast.error(errorMessage(error, "Couldn't send the reset code. Try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const code = otp.join("");
    if (code.length < 6) { toast.error("Enter the full 6-digit OTP"); return; }
    setLoading(true);
    try {
      await verifyOtpRequest({ email, otp: code });
      setStep("reset");
    } catch (error) {
      toast.error(errorMessage(error, "That code is invalid or has expired."));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { toast.error("Passwords don't match"); return; }
    if (!isStrongPassword(password)) { toast.error("Please choose a password that meets all four requirements."); return; }
    setLoading(true);
    try {
      await resetPasswordRequest({ email, otp: otp.join(""), newPassword: password });
      setStep("done");
    } catch (error) {
      toast.error(errorMessage(error, "Couldn't reset your password. Try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) {
      document.getElementById(`otp-${i + 1}`)?.focus();
    }
  };

  const copy = STEP_COPY[step];

  return (
    <AuthLayout
      image={marketBeans}
      imageAlt="Beans being measured out at the market"
      statement="Your account, back in a few steps."
      statementSub="We'll email you a one-time code to confirm it's you, then you can set a new password."
      title={copy.title}
      subtitle={
        step === "otp" ? (
          <>We sent a 6-digit code to <span className="font-semibold text-foreground">{email}</span>.</>
        ) : (
          copy.subtitle
        )
      }
      footer={
        step !== "done" ? (
          <>
            Remember your password?{" "}
            <Link href="/login" className="font-semibold text-brand hover:underline underline-offset-4">
              Sign in
            </Link>
          </>
        ) : undefined
      }
    >
      {step === "email" && (
        <form onSubmit={handleSendOtp} className="space-y-5">
          <AuthField
            label="Email address"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <AuthSubmit loading={loading} loadingText="Sending...">
            Send reset code
          </AuthSubmit>
        </form>
      )}

      {step === "otp" && (
        <div>
          <div className="mb-6 flex gap-2">
            {otp.map((d, i) => (
              <input
                key={i}
                id={`otp-${i}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                aria-label={`Digit ${i + 1}`}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => e.key === "Backspace" && !otp[i] && i > 0 && document.getElementById(`otp-${i - 1}`)?.focus()}
                className="h-13 w-full min-w-0 rounded-md border border-input bg-card text-center font-display text-2xl text-foreground transition focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
              />
            ))}
          </div>
          <AuthSubmit type="button" onClick={handleVerifyOtp} loading={loading} loadingText="Verifying...">
            Verify code
          </AuthSubmit>
          <button
            onClick={async () => {
              try {
                const res = await forgotPasswordRequest({ email });
                toast.success(res.message);
              } catch (error) {
                toast.error(errorMessage(error, "Couldn't resend the code. Try again."));
              }
            }}
            className="mt-4 w-full text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            Didn't get it? Resend code
          </button>
        </div>
      )}

      {step === "reset" && (
        <form onSubmit={handleReset} className="space-y-5">
          <div>
            <AuthPasswordField
              label="New password"
              autoComplete="new-password"
              required
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <PasswordRules password={password} />
          </div>
          <AuthPasswordField
            label="Confirm password"
            autoComplete="new-password"
            required
            placeholder="Type it again"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <AuthSubmit loading={loading} loadingText="Updating...">
            Reset password
          </AuthSubmit>
        </form>
      )}

      {step === "done" && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 rounded-md border border-brand/20 bg-brand-muted px-4 py-3 text-sm font-medium text-brand">
            <CheckCircle2 className="size-5 shrink-0" />
            Your password has been changed.
          </div>
          <Link
            href="/login"
            className="flex h-11 w-full items-center justify-center rounded-md bg-brand text-[15px] font-semibold text-brand-foreground transition hover:bg-brand/90"
          >
            Back to sign in
          </Link>
        </div>
      )}
    </AuthLayout>
  );
}
