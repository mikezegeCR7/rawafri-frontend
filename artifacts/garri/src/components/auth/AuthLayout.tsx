import type { ReactNode } from "react";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

interface AuthLayoutProps {
  /** Photo for the brand panel (desktop) and banner (mobile). */
  image: string;
  /** CSS object-position so the subject stays in frame, e.g. "50% 70%". */
  imagePosition?: string;
  imageAlt: string;
  /** Short statement shown over the photo. */
  statement: string;
  statementSub: string;
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  /** Line under the form, e.g. "New to RawAfri? Create an account". */
  footer?: ReactNode;
}

export function AuthLayout({
  image,
  imagePosition = "50% 50%",
  imageAlt,
  statement,
  statementSub,
  title,
  subtitle,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      {/* Brand panel — desktop */}
      <aside className="relative hidden lg:block">
        <div className="sticky top-0 h-screen overflow-hidden">
          <img
            src={image}
            alt={imageAlt}
            className="absolute inset-0 size-full object-cover"
            style={{ objectPosition: imagePosition }}
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-[oklch(0.18_0.03_50/0.92)] via-[oklch(0.18_0.03_50/0.35)] to-transparent"
          />
          <div className="kente-rule absolute inset-x-0 top-0 h-1.5" aria-hidden />
          <div className="absolute inset-x-0 bottom-0 p-12 xl:p-16">
            <p className="font-display text-[2.6rem] xl:text-5xl leading-[1.08] text-[oklch(0.97_0.01_85)] max-w-lg">
              {statement}
            </p>
            <p className="mt-5 text-[15px] leading-relaxed text-[oklch(0.86_0.02_75)] max-w-md">
              {statementSub}
            </p>
          </div>
        </div>
      </aside>

      {/* Form side */}
      <main className="flex min-h-screen flex-col">
        <div className="kente-rule h-1.5 lg:hidden" aria-hidden />

        <header className="flex items-center justify-between px-5 sm:px-10 pt-5 sm:pt-7">
          <Link href="/" aria-label="RawAfri home" className="shrink-0">
            <img src="/rawafri-logo-mark.png" alt="RawAfri" className="h-12 sm:h-14 w-auto" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            Marketplace
          </Link>
        </header>

        {/* Photo banner — mobile */}
        <div className="relative mx-5 sm:mx-10 mt-4 h-36 overflow-hidden rounded-lg lg:hidden">
          <img
            src={image}
            alt=""
            className="absolute inset-0 size-full object-cover"
            style={{ objectPosition: imagePosition }}
          />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[oklch(0.18_0.03_50/0.85)] to-transparent" />
          <p className="absolute inset-x-4 bottom-3 font-display text-lg leading-snug text-[oklch(0.97_0.01_85)]">
            {statement}
          </p>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 sm:px-10 py-10">
          <div className="w-full max-w-[400px] animate-fade-up">
            <h1 className="font-display text-[2rem] leading-tight text-foreground">{title}</h1>
            {subtitle && <p className="mt-2 text-[15px] text-muted-foreground">{subtitle}</p>}
            <div className="mt-8">{children}</div>
            {footer && (
              <p className="mt-8 border-t border-border pt-6 text-sm text-muted-foreground">{footer}</p>
            )}
          </div>
        </div>

        <footer className="px-5 sm:px-10 pb-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} RawAfri · Premium raw African food sourcing
        </footer>
      </main>
    </div>
  );
}
