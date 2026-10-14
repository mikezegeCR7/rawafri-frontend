import { useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const authInputClass =
  "w-full h-11 rounded-md border border-input bg-card px-3.5 text-[15px] text-foreground placeholder:text-muted-foreground/70 transition focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/15";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /** Rendered on the right of the label row, e.g. a "Forgot password?" link. */
  aside?: ReactNode;
}

export function AuthField({ label, aside, className, ...input }: FieldProps) {
  const id = useId();
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <label htmlFor={id} className="text-[13px] font-semibold text-foreground">
          {label}
        </label>
        {aside}
      </div>
      <input id={id} className={cn(authInputClass, className)} {...input} />
    </div>
  );
}

export function AuthPasswordField({ label, aside, className, ...input }: Omit<FieldProps, "type">) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <label htmlFor={id} className="text-[13px] font-semibold text-foreground">
          {label}
        </label>
        {aside}
      </div>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          className={cn(authInputClass, "pr-11", className)}
          {...input}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted-foreground hover:text-foreground transition-colors"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </div>
  );
}

export function AuthSubmit({
  loading,
  loadingText,
  children,
  type = "submit",
  onClick,
}: {
  loading: boolean;
  loadingText: string;
  children: ReactNode;
  type?: "submit" | "button";
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading}
      className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-brand text-[15px] font-semibold text-brand-foreground transition hover:bg-brand/90 active:scale-[0.99] disabled:opacity-60"
    >
      {loading ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}
