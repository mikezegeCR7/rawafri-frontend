import type { ComponentType, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Shared building blocks for every customer-facing page, so the storefront
// reads as one system. Admin has its own components and never uses these.

export const btn = {
  primary:
    "inline-flex items-center justify-center gap-2 rounded-md bg-brand px-5 h-11 text-[15px] font-semibold text-brand-foreground transition hover:bg-brand/90 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none",
  secondary:
    "inline-flex items-center justify-center gap-2 rounded-md border border-input bg-card px-5 h-11 text-[15px] font-semibold text-foreground transition hover:bg-accent active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none",
  ghost:
    "inline-flex items-center justify-center gap-1.5 rounded-md px-3 h-9 text-sm font-semibold text-foreground transition hover:bg-accent disabled:opacity-50",
  link: "inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline underline-offset-4",
  sm: "!h-9 !px-3.5 !text-sm",
};

export const inputClass =
  "w-full h-11 rounded-md border border-input bg-card px-3.5 text-[15px] text-foreground placeholder:text-muted-foreground/70 transition focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/15";

export function Panel({ className, children }: { className?: string; children?: ReactNode }) {
  return <div className={cn("rounded-lg border border-border bg-card", className)}>{children}</div>;
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("text-[11px] font-bold uppercase tracking-[0.14em] text-terracotta", className)}>
      {children}
    </p>
  );
}

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <Eyebrow className="mb-2">{eyebrow}</Eyebrow>}
        <h1 className="font-display text-[1.75rem] sm:text-3xl leading-tight text-foreground">{title}</h1>
        {description && <p className="mt-1.5 text-[15px] text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Panel className="px-6 py-14 text-center">
      <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-secondary">
        <Icon className="size-5 text-muted-foreground" />
      </div>
      <h3 className="font-display text-xl text-foreground">{title}</h3>
      {description && <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </Panel>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("size-5 animate-spin text-brand", className)} />;
}

export function Badge({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ring-inset",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Initials for an avatar, from the real user record. */
export function initials(first?: string, last?: string) {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "?";
}
