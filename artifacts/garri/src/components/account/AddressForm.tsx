import { useId, useState } from "react";
import { Home, Briefcase, MapPin } from "lucide-react";
import { toast } from "sonner";
import type { Address, AddressType, CreateAddressPayload } from "@/lib/checkout/types";
import { btn, inputClass } from "@/components/storefront/ui";
import { cn } from "@/lib/utils";

type FormState = {
  label: string;
  type: AddressType;
  contactName: string;
  phone: string;
  line1: string;
  city: string;
  state: string;
  landmark: string;
};

const EMPTY: FormState = { label: "", type: "HOME", contactName: "", phone: "", line1: "", city: "", state: "", landmark: "" };

const TYPES: { value: AddressType; label: string; icon: typeof Home }[] = [
  { value: "HOME", label: "Home", icon: Home },
  { value: "WORK", label: "Work", icon: Briefcase },
  { value: "OTHER", label: "Other", icon: MapPin },
];

/** Shared by Checkout and Account → Addresses so both behave the same. */
export function AddressForm({
  initial,
  saving,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: Address | null;
  saving: boolean;
  submitLabel: string;
  onSubmit: (payload: CreateAddressPayload) => void;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState<FormState>(
    initial
      ? {
          label: initial.label,
          type: initial.type,
          contactName: initial.contactName,
          phone: initial.phone,
          line1: initial.line1,
          city: initial.city,
          state: initial.state,
          landmark: initial.landmark ?? "",
        }
      : EMPTY,
  );
  const id = useId();
  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const required: (keyof FormState)[] = ["label", "contactName", "phone", "line1", "city", "state"];
    if (required.some((k) => !form[k].trim())) {
      toast.error("Please fill in all required fields");
      return;
    }
    onSubmit({
      label: form.label.trim(),
      type: form.type,
      contactName: form.contactName.trim(),
      phone: form.phone.trim(),
      line1: form.line1.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      landmark: form.landmark.trim() || undefined,
    });
  };

  const field = (key: keyof FormState, label: string, opts: { placeholder?: string; optional?: boolean; type?: string; autoComplete?: string } = {}) => (
    <div>
      <label htmlFor={`${id}-${key}`} className="mb-1.5 block text-[13px] font-semibold text-foreground">
        {label} {opts.optional && <span className="font-normal text-muted-foreground">(optional)</span>}
      </label>
      <input
        id={`${id}-${key}`}
        type={opts.type ?? "text"}
        value={form[key]}
        onChange={set(key)}
        placeholder={opts.placeholder}
        autoComplete={opts.autoComplete}
        className={inputClass}
      />
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-4">
      <div role="radiogroup" aria-label="Address type" className="grid grid-cols-3 gap-2">
        {TYPES.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={form.type === value}
            onClick={() => setForm((f) => ({ ...f, type: value }))}
            className={cn(
              "flex h-10 items-center justify-center gap-1.5 rounded-md border text-sm font-semibold transition-colors",
              form.type === value ? "border-cocoa bg-cocoa text-background" : "border-input bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" /> {label}
          </button>
        ))}
      </div>
      {field("label", "Address name", { placeholder: "e.g. Home, Office, Mum's place" })}
      <div className="grid gap-4 sm:grid-cols-2">
        {field("contactName", "Recipient's name", { autoComplete: "name" })}
        {field("phone", "Phone number", { type: "tel", placeholder: "0801 234 5678", autoComplete: "tel" })}
      </div>
      {field("line1", "Street address", { placeholder: "House number and street", autoComplete: "street-address" })}
      <div className="grid gap-4 sm:grid-cols-2">
        {field("city", "City / Area", { autoComplete: "address-level2" })}
        {field("state", "State", { autoComplete: "address-level1" })}
      </div>
      {field("landmark", "Nearest landmark", { optional: true, placeholder: "Helps the rider find you" })}
      <div className="flex gap-2 pt-1">
        {onCancel && (
          <button type="button" onClick={onCancel} className={cn(btn.secondary, "flex-1")}>
            Cancel
          </button>
        )}
        <button type="submit" disabled={saving} className={cn(btn.primary, "flex-1")}>
          {saving ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
