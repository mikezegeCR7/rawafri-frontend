import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Mirrors the backend rule (users/validators/account-rules.ts).
export const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "An uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "A lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "A number or symbol", test: (p: string) => /[\d\W]/.test(p) },
];

export const isStrongPassword = (p: string) => PASSWORD_RULES.every((r) => r.test(p));

/** Live checklist under a new-password field. */
export function PasswordRules({ password }: { password: string }) {
  return (
    <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1" aria-label="Password requirements">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(password);
        return (
          <li
            key={rule.label}
            className={cn("flex items-center gap-1.5 text-xs transition-colors", met ? "text-brand" : "text-muted-foreground")}
          >
            <span
              className={cn(
                "grid size-3.5 shrink-0 place-items-center rounded-full border",
                met ? "border-brand bg-brand text-brand-foreground" : "border-input",
              )}
            >
              {met && <Check className="size-2.5" strokeWidth={3} />}
            </span>
            {rule.label}
            <span className="sr-only">{met ? "(done)" : "(not yet)"}</span>
          </li>
        );
      })}
    </ul>
  );
}
