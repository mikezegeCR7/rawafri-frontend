import { useState } from "react";
import { Link } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { type Order } from "@/lib/order-data";
import { createComplaint } from "@/lib/complaints/api";
import { apiErrorMessage } from "@/lib/api/errors";
import { Panel, btn, inputClass } from "@/components/storefront/ui";
import { cn } from "@/lib/utils";

type Props = {
  order: Order;
  onConfirmed: (orderId: string) => Promise<void>;
  onSendOtp: (orderId: string) => Promise<void>;
  onConfirmWithOtp: (orderId: string, otp: string) => Promise<void>;
};

export function DeliveryConfirmationCard({ order, onConfirmed, onSendOtp, onConfirmWithOtp }: Props) {
  const queryClient = useQueryClient();
  const [view, setView] = useState<"main" | "otp" | "issue" | "success" | "reported">("main");
  const [otp, setOtp] = useState("");
  const [issueText, setIssueText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  const reportMutation = useMutation({
    mutationFn: () =>
      createComplaint({
        orderId: order.id,
        subject: `Delivery issue — ${order.reference}`,
        message: issueText.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-complaints"] });
      setIssueText("");
      setView("reported");
    },
    onError: (err) => toast.error(apiErrorMessage(err, "Couldn't send your report. Please try again.")),
  });

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirmed(order.id);
      setView("success");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't confirm delivery. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartOtp = async () => {
    setSendingOtp(true);
    try {
      await onSendOtp(order.id);
      setOtp("");
      setView("otp");
      toast.success("We've emailed you a 6-digit code");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't send a confirmation code");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleOtpConfirm = async () => {
    if (otp.length !== 6) {
      toast.error("Enter the 6-digit code from your email");
      return;
    }
    setLoading(true);
    try {
      await onConfirmWithOtp(order.id, otp);
      setView("success");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "That code is invalid or has expired");
    } finally {
      setLoading(false);
    }
  };

  if (view === "success") {
    return (
      <Panel className="border-brand/30 p-6 text-center">
        <CheckCircle2 className="mx-auto size-10 text-brand" />
        <h2 className="mt-3 font-display text-xl text-foreground">Delivery confirmed</h2>
        <p className="mt-1 text-sm text-muted-foreground">Thank you. Order {order.reference} is now complete.</p>
      </Panel>
    );
  }

  if (view === "reported") {
    return (
      <Panel className="p-6">
        <h2 className="font-display text-xl text-foreground">Thanks, we've got your report</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Our team will look into it and reply to you. You can follow the conversation under{" "}
          <Link href="/help" className={btn.link}>Help &amp; support</Link>.
        </p>
        <button onClick={() => setView("main")} className={cn(btn.secondary, btn.sm, "mt-5")}>
          Back to confirmation
        </button>
      </Panel>
    );
  }

  if (view === "otp") {
    return (
      <Panel className="p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <MailCheck className="mt-0.5 size-5 shrink-0 text-brand" />
          <div>
            <h2 className="font-display text-xl text-foreground">Enter your code</h2>
            <p className="mt-1 text-sm text-muted-foreground">We emailed a 6-digit code to you. It confirms that you, the account holder, received the order.</p>
          </div>
        </div>
        <input
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="000000"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
          aria-label="6-digit confirmation code"
          className={cn(inputClass, "mt-5 h-14 text-center font-display text-3xl tracking-[0.5em]")}
        />
        <div className="mt-4 flex gap-2">
          <button onClick={() => setView("main")} className={cn(btn.secondary, "flex-1")}>
            Back
          </button>
          <button onClick={handleOtpConfirm} disabled={loading} className={cn(btn.primary, "flex-1")}>
            {loading ? "Checking..." : "Confirm delivery"}
          </button>
        </div>
        <button
          onClick={handleStartOtp}
          disabled={sendingOtp}
          className="mt-4 w-full text-sm font-semibold text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          {sendingOtp ? "Sending..." : "Didn't get it? Send a new code"}
        </button>
      </Panel>
    );
  }

  if (view === "issue") {
    return (
      <Panel className="p-5 sm:p-6">
        <h2 className="font-display text-xl text-foreground">Report a problem</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell us what went wrong with order {order.reference}. Our team will reply to you.
        </p>
        <textarea
          placeholder="For example: an item was missing, or something arrived damaged."
          value={issueText}
          onChange={(e) => setIssueText(e.target.value)}
          rows={4}
          maxLength={3000}
          className={cn(inputClass, "mt-5 h-auto resize-none py-3")}
        />
        <div className="mt-4 flex gap-2">
          <button onClick={() => setView("main")} className={cn(btn.secondary, "flex-1")}>
            Back
          </button>
          <button
            onClick={() => (issueText.trim() ? reportMutation.mutate() : toast.error("Please describe the problem"))}
            disabled={reportMutation.isPending}
            className={cn(btn.primary, "flex-1")}
          >
            {reportMutation.isPending ? "Sending..." : "Send report"}
          </button>
        </div>
      </Panel>
    );
  }

  return (
    <Panel className="border-terracotta/40 p-5 sm:p-6">
      <h2 className="font-display text-xl text-foreground">Has your order arrived?</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Please confirm once you've received everything in order {order.reference}.
      </p>
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <button onClick={handleStartOtp} disabled={sendingOtp} className={btn.primary}>
          <MailCheck className="size-4" />
          {sendingOtp ? "Sending code..." : "Confirm with email code"}
        </button>
        <button onClick={handleConfirm} disabled={loading} className={btn.secondary}>
          {loading ? "Confirming..." : "Confirm without a code"}
        </button>
      </div>
      <p className="mt-5 border-t border-border pt-4 text-sm text-muted-foreground">
        Something wrong with the delivery?{" "}
        <button onClick={() => setView("issue")} className="font-semibold text-terracotta hover:underline underline-offset-4">
          Report a problem
        </button>
      </p>
    </Panel>
  );
}
