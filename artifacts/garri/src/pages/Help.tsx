import { useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, MessageSquareText } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/storefront/SiteHeader";
import { SiteFooter } from "@/components/storefront/SiteFooter";
import { Badge, Eyebrow, Panel, btn, inputClass } from "@/components/storefront/ui";
import { useAuth } from "@/lib/auth/AuthContext";
import { getMyOrders } from "@/lib/orders/api";
import { createComplaint, getMyComplaints, type MyComplaint } from "@/lib/complaints/api";
import { apiErrorMessage } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

// Answers describe only how the platform actually works today.
const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: "How do I pay for my order?",
    a: "We accept bank transfer only. At checkout you'll see our account details and the exact amount to send. After transferring, upload a screenshot or photo of your receipt, either at checkout or later from the order page.",
  },
  {
    q: "When is my payment confirmed?",
    a: "A member of our team checks every receipt by hand. As soon as your payment is confirmed you'll get a notification, and your order moves on to being prepared.",
  },
  {
    q: "What happens if my receipt isn't accepted?",
    a: "You'll see the reason on the order page and in your notifications. Your order stays open, so you can check the transfer and upload a new receipt from the same page.",
  },
  {
    q: "How much is delivery and how long does it take?",
    a: "It depends on your delivery area. When you choose your area at checkout, you'll see its delivery fee and estimated delivery time before you place the order.",
  },
  {
    q: "How do I confirm that my order arrived?",
    a: "When your order is marked as delivered, open it from Orders and confirm receipt. You can confirm with a one-time code we email to you, which proves the order reached the account holder.",
  },
  {
    q: "Can I use a promo code?",
    a: "Yes. Enter it in the order summary at checkout and tap Apply. If the code is valid, the discount comes off your items' subtotal and the total updates before you pay.",
  },
  {
    q: "Something was wrong with my delivery. What should I do?",
    a: "Open the order and choose \"Report a problem\", or send us a message below and pick the order. Our team will reply here on this page.",
  },
  {
    q: "Can I change the email on my account?",
    a: "Not from the app yet. Send us a message below and our team will help.",
  },
];

const STATUS: Record<MyComplaint["status"], { label: string; className: string }> = {
  OPEN: { label: "Received", className: "bg-gold/15 text-[oklch(0.45_0.1_70)] ring-gold/40" },
  IN_PROGRESS: { label: "In progress", className: "bg-secondary text-secondary-foreground ring-border" },
  RESOLVED: { label: "Resolved", className: "bg-brand-muted text-brand ring-brand/20" },
  CLOSED: { label: "Closed", className: "bg-secondary text-muted-foreground ring-border" },
};

export default function Help() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <Eyebrow>Help &amp; support</Eyebrow>
        <h1 className="mt-3 font-display text-4xl leading-tight text-foreground sm:text-5xl">How can we help?</h1>
        <p className="mt-3 max-w-2xl text-[15px] text-muted-foreground">
          Answers to common questions about paying, delivery and your orders. If you can't find what you need, send us a
          message and our team will reply.
        </p>

        <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section aria-labelledby="faq-heading">
            <h2 id="faq-heading" className="font-display text-2xl text-foreground">Common questions</h2>
            <div className="mt-5 divide-y divide-border border-y border-border">
              {FAQS.map((f) => (
                <FaqItem key={f.q} question={f.q} answer={f.a} />
              ))}
            </div>
          </section>

          <section aria-labelledby="contact-heading" className="lg:sticky lg:top-24 lg:self-start">
            <h2 id="contact-heading" className="font-display text-2xl text-foreground">Contact support</h2>
            {isAuthenticated ? (
              <ContactForm />
            ) : (
              <Panel className="mt-5 p-5">
                <p className="text-sm text-muted-foreground">
                  Log in to send us a message. That way we can see your orders and reply to you here.
                </p>
                <div className="mt-5 flex gap-2">
                  <Link href="/login?redirect=/help" className={cn(btn.primary, btn.sm, "flex-1")}>
                    Log in
                  </Link>
                  <Link href="/signup" className={cn(btn.secondary, btn.sm, "flex-1")}>
                    Create account
                  </Link>
                </div>
              </Panel>
            )}
          </section>
        </div>

        {isAuthenticated && <MyRequests />}
      </main>
      <SiteFooter />
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
      >
        <span className="text-[15px] font-semibold text-foreground">{question}</span>
        <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && <p className="pb-5 pr-8 text-sm leading-relaxed text-muted-foreground">{answer}</p>}
    </div>
  );
}

function ContactForm() {
  const queryClient = useQueryClient();
  const { data: orders } = useQuery({ queryKey: ["my-orders"], queryFn: getMyOrders });
  const [orderId, setOrderId] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      createComplaint({
        orderId: orderId || undefined,
        subject: subject.trim(),
        message: message.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-complaints"] });
      setOrderId("");
      setSubject("");
      setMessage("");
      toast.success("Message sent. We'll reply here on this page.");
    },
    onError: (err) => toast.error(apiErrorMessage(err, "Couldn't send your message. Please try again.")),
  });

  return (
    <Panel className="mt-5 p-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!subject.trim() || !message.trim()) {
            toast.error("Please add a subject and a message");
            return;
          }
          mutation.mutate();
        }}
        className="space-y-4"
      >
        <div>
          <label htmlFor="c-order" className="mb-1.5 block text-[13px] font-semibold text-foreground">
            Related order <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <select id="c-order" value={orderId} onChange={(e) => setOrderId(e.target.value)} className={cn(inputClass, "appearance-auto")}>
            <option value="">Not about a specific order</option>
            {orders?.map((o) => (
              <option key={o.id} value={o.id}>
                {o.orderNumber}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="c-subject" className="mb-1.5 block text-[13px] font-semibold text-foreground">Subject</label>
          <input id="c-subject" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={150} className={inputClass} />
        </div>
        <div>
          <label htmlFor="c-message" className="mb-1.5 block text-[13px] font-semibold text-foreground">Message</label>
          <textarea
            id="c-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            maxLength={3000}
            className={cn(inputClass, "h-auto resize-none py-3")}
          />
        </div>
        <button type="submit" disabled={mutation.isPending} className={cn(btn.primary, "w-full")}>
          {mutation.isPending ? "Sending..." : "Send message"}
        </button>
      </form>
    </Panel>
  );
}

function MyRequests() {
  const { data: requests, isLoading } = useQuery({ queryKey: ["my-complaints"], queryFn: getMyComplaints });

  if (isLoading || !requests || requests.length === 0) return null;

  const sorted = [...requests].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <section aria-labelledby="requests-heading" className="mt-16">
      <h2 id="requests-heading" className="font-display text-2xl text-foreground">Your messages</h2>
      <div className="mt-5 space-y-3">
        {sorted.map((r) => {
          const status = STATUS[r.status];
          return (
            <Panel key={r.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-foreground">{r.subject}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {new Date(r.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" })}
                    {r.order && (
                      <>
                        {" · "}
                        <Link href={`/orders/${r.order.id}`} className="font-semibold text-brand hover:underline underline-offset-4">
                          {r.order.orderNumber}
                        </Link>
                      </>
                    )}
                  </p>
                </div>
                <Badge className={status.className}>{status.label}</Badge>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">{r.message}</p>
              {r.adminResponse ? (
                <div className="mt-4 rounded-md border-l-2 border-brand bg-brand-muted/50 px-4 py-3">
                  <p className="flex items-center gap-1.5 text-xs font-bold text-brand">
                    <MessageSquareText className="size-3.5" /> RawAfri support
                  </p>
                  <p className="mt-1 whitespace-pre-line text-sm text-foreground">{r.adminResponse}</p>
                </div>
              ) : (
                <p className="mt-4 text-xs text-muted-foreground">No reply yet. You'll see our response here.</p>
              )}
            </Panel>
          );
        })}
      </div>
    </section>
  );
}
