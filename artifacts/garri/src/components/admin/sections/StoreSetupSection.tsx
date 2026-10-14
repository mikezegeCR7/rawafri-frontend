import { useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Landmark, Pencil, Plus, Tag, Trash2, Truck, Layers } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { apiErrorMessage } from "@/lib/api/errors";
import { formatNaira } from "@/lib/products/types";
import type { BankAccount, DeliveryZone } from "@/lib/checkout/types";
import type { Category } from "@/lib/products/types";
import {
  activateBankAccount,
  createBankAccount,
  createCategory,
  createPromoCode,
  createZone,
  deactivatePromoCode,
  deleteBankAccount,
  getBankAccounts,
  getCategoriesAdmin,
  getPromoCodesAdmin,
  getZones,
  removeCategory,
  removeZone,
  slugify,
  updateBankAccount,
  updateCategory,
  updatePromoCode,
  updateZone,
  type PromoCode,
} from "@/lib/store-setup/api";

type Tab = "bank" | "zones" | "categories" | "promos";

const TABS: { id: Tab; label: string; icon: typeof Landmark }[] = [
  { id: "bank", label: "Bank account", icon: Landmark },
  { id: "zones", label: "Delivery zones", icon: Truck },
  { id: "categories", label: "Categories", icon: Layers },
  { id: "promos", label: "Promo codes", icon: Tag },
];

// ─── Shared admin UI pieces (match the existing admin sections) ─────────────

const input =
  "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-500";
const primaryBtn =
  "inline-flex items-center gap-1.5 bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50";
const ghostBtn =
  "inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:pointer-events-none";
const dangerBtn =
  "inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:pointer-events-none";

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-slate-700 mb-1">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-slate-400 mt-1">{hint}</span>}
    </label>
  );
}

function FormCard({ title, onCancel, onSubmit, saving, children }: {
  title: string;
  onCancel: () => void;
  onSubmit: () => void;
  saving: boolean;
  children: ReactNode;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="bg-white rounded-xl border border-green-200 p-5 space-y-4"
    >
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
      <div className="flex gap-2 justify-end pt-1">
        <button type="button" onClick={onCancel} className={ghostBtn}>
          Cancel
        </button>
        <button type="submit" disabled={saving} className={primaryBtn}>
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}

function Notice({ tone, children }: { tone: "warn" | "info"; children: ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4 flex items-start gap-3 text-sm",
        tone === "warn" ? "border-amber-300 bg-amber-50 text-amber-800" : "border-slate-200 bg-slate-50 text-slate-600",
      )}
    >
      {tone === "warn" ? <AlertTriangle className="size-4 mt-0.5 shrink-0" /> : <CheckCircle2 className="size-4 mt-0.5 shrink-0 text-green-600" />}
      <div>{children}</div>
    </div>
  );
}

function ListCard({ children }: { children: ReactNode }) {
  return <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">{children}</div>;
}

const useInvalidate = () => {
  const qc = useQueryClient();
  return (...keys: string[][]) => keys.forEach((queryKey) => qc.invalidateQueries({ queryKey }));
};

// ─── Section ────────────────────────────────────────────────────────────────

export function StoreSetupSection() {
  const [tab, setTab] = useState<Tab>("bank");

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Store setup</h2>
        <p className="text-sm text-slate-500">
          The payment account, delivery areas, product categories and promo codes customers see.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              tab === id ? "bg-green-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300",
            )}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "bank" && <BankAccountsTab />}
      {tab === "zones" && <DeliveryZonesTab />}
      {tab === "categories" && <CategoriesTab />}
      {tab === "promos" && <PromoCodesTab />}
    </div>
  );
}

// ─── Bank accounts ──────────────────────────────────────────────────────────

const emptyBank = { bankName: "", accountName: "", accountNumber: "" };

function BankAccountsTab() {
  const invalidate = useInvalidate();
  const { data: accounts, isLoading } = useQuery({ queryKey: ["store-bank-accounts"], queryFn: getBankAccounts });
  const [editing, setEditing] = useState<BankAccount | "new" | null>(null);
  const [form, setForm] = useState(emptyBank);

  const refresh = () => invalidate(["store-bank-accounts"], ["bank-account-active"]);
  const onError = (err: unknown) => toast.error(apiErrorMessage(err, "Couldn't save the bank account"));

  const save = useMutation({
    mutationFn: () => {
      const body = { ...form, accountNumber: form.accountNumber.replace(/\D/g, "") };
      return editing && editing !== "new" ? updateBankAccount(editing.id, body) : createBankAccount(body);
    },
    onSuccess: () => {
      refresh();
      setEditing(null);
      toast.success("Bank account saved");
    },
    onError,
  });
  const activate = useMutation({
    mutationFn: activateBankAccount,
    onSuccess: () => {
      refresh();
      toast.success("This account is now shown to customers");
    },
    onError,
  });
  const remove = useMutation({
    mutationFn: deleteBankAccount,
    onSuccess: () => {
      refresh();
      toast.success("Bank account deleted");
    },
    onError,
  });

  const startEdit = (target: BankAccount | "new") => {
    setForm(target === "new" ? emptyBank : { bankName: target.bankName, accountName: target.accountName, accountNumber: target.accountNumber });
    setEditing(target);
  };

  return (
    <div className="space-y-4">
      {!isLoading && !accounts?.length && (
        <Notice tone="warn">
          <strong>Checkout is blocked until you add a bank account.</strong> Customers pay by transferring to the active
          account, so they can't place orders without one.
        </Notice>
      )}
      {!!accounts?.length && (
        <Notice tone="info">
          Customers see the <strong>active</strong> account at checkout and on any order still waiting for payment. Only
          one account is active at a time.
        </Notice>
      )}

      {editing && (
        <FormCard
          title={editing === "new" ? "Add bank account" : "Edit bank account"}
          onCancel={() => setEditing(null)}
          onSubmit={() => save.mutate()}
          saving={save.isPending}
        >
          <Field label="Bank name">
            <input required className={input} placeholder="e.g. First Bank" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} />
          </Field>
          <Field label="Account name" hint="Exactly as it appears on the account">
            <input required className={input} value={form.accountName} onChange={(e) => setForm({ ...form, accountName: e.target.value })} />
          </Field>
          <Field label="Account number" hint="10 digits (NUBAN)">
            <input
              required
              inputMode="numeric"
              // No maxLength: it would count pasted spaces/dashes before they're
              // stripped below; the onChange keeps the first 10 digits instead.
              className={cn(input, "font-mono tracking-wide")}
              value={form.accountNumber}
              onChange={(e) => setForm({ ...form, accountNumber: e.target.value.replace(/\D/g, "").slice(0, 10) })}
            />
          </Field>
        </FormCard>
      )}

      {isLoading && <div className="h-24 bg-slate-100 rounded-xl animate-pulse" />}

      {!!accounts?.length && (
        <ListCard>
          {accounts.map((a) => (
            <div key={a.id} className="p-4 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-800">{a.bankName}</p>
                  {a.isActive && (
                    <span className="text-[10px] font-bold uppercase tracking-wide bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {a.accountName} · <span className="font-mono">{a.accountNumber}</span>
                </p>
              </div>
              {!a.isActive && (
                <button onClick={() => activate.mutate(a.id)} disabled={activate.isPending} className={ghostBtn}>
                  <CheckCircle2 className="size-3.5" /> Make active
                </button>
              )}
              <button onClick={() => startEdit(a)} className={ghostBtn}>
                <Pencil className="size-3.5" /> Edit
              </button>
              <button
                onClick={() => confirm(`Delete the ${a.bankName} account ${a.accountNumber}? This can't be undone.`) && remove.mutate(a.id)}
                disabled={a.isActive || remove.isPending}
                title={a.isActive ? "Make another account active before deleting this one" : undefined}
                className={dangerBtn}
              >
                <Trash2 className="size-3.5" /> Delete
              </button>
            </div>
          ))}
        </ListCard>
      )}

      {!editing && (
        <button onClick={() => startEdit("new")} className={primaryBtn}>
          <Plus className="size-4" /> Add bank account
        </button>
      )}
    </div>
  );
}

// ─── Delivery zones ─────────────────────────────────────────────────────────

const emptyZone = { name: "", fee: "", estimatedTime: "" };

function DeliveryZonesTab() {
  const invalidate = useInvalidate();
  const { data: zones, isLoading } = useQuery({ queryKey: ["delivery-zones"], queryFn: getZones });
  const [editing, setEditing] = useState<DeliveryZone | "new" | null>(null);
  const [form, setForm] = useState(emptyZone);
  const onError = (err: unknown) => toast.error(apiErrorMessage(err, "Couldn't save the delivery zone"));

  const save = useMutation({
    mutationFn: () => {
      const body = { name: form.name.trim(), fee: Number(form.fee), estimatedTime: form.estimatedTime.trim() };
      return editing && editing !== "new" ? updateZone(editing.id, body) : createZone(body);
    },
    onSuccess: () => {
      invalidate(["delivery-zones"]);
      setEditing(null);
      toast.success("Delivery zone saved");
    },
    onError,
  });
  const remove = useMutation({
    mutationFn: removeZone,
    onSuccess: () => {
      invalidate(["delivery-zones"]);
      toast.success("Delivery zone removed");
    },
    onError,
  });

  const startEdit = (target: DeliveryZone | "new") => {
    setForm(target === "new" ? emptyZone : { name: target.name, fee: String(Number(target.fee)), estimatedTime: target.estimatedTime });
    setEditing(target);
  };

  return (
    <div className="space-y-4">
      {!isLoading && !zones?.length && (
        <Notice tone="warn">
          <strong>Checkout is blocked until you add at least one delivery zone.</strong> Customers choose their zone at
          checkout, and it sets the delivery fee and estimated time.
        </Notice>
      )}

      {editing && (
        <FormCard
          title={editing === "new" ? "Add delivery zone" : "Edit delivery zone"}
          onCancel={() => setEditing(null)}
          onSubmit={() => save.mutate()}
          saving={save.isPending}
        >
          <Field label="Zone name" hint="What customers pick at checkout, e.g. Lagos Island">
            <input required maxLength={100} className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Delivery fee (₦)">
            <input required type="number" min="1" step="0.01" inputMode="decimal" className={input} value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} />
          </Field>
          <Field label="Estimated delivery time" hint="Shown to customers, e.g. Same day or 1–2 days">
            <input required maxLength={100} className={input} value={form.estimatedTime} onChange={(e) => setForm({ ...form, estimatedTime: e.target.value })} />
          </Field>
        </FormCard>
      )}

      {isLoading && <div className="h-24 bg-slate-100 rounded-xl animate-pulse" />}

      {!!zones?.length && (
        <ListCard>
          {zones.map((z) => (
            <div key={z.id} className="p-4 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px]">
                <p className="text-sm font-semibold text-slate-800">{z.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {formatNaira(Number(z.fee))} · {z.estimatedTime}
                </p>
              </div>
              <button onClick={() => startEdit(z)} className={ghostBtn}>
                <Pencil className="size-3.5" /> Edit
              </button>
              <button
                onClick={() => confirm(`Remove "${z.name}"? Customers will no longer be able to choose it. Existing orders keep their delivery details.`) && remove.mutate(z.id)}
                disabled={remove.isPending}
                className={dangerBtn}
              >
                <Trash2 className="size-3.5" /> Remove
              </button>
            </div>
          ))}
        </ListCard>
      )}

      {!editing && (
        <button onClick={() => startEdit("new")} className={primaryBtn}>
          <Plus className="size-4" /> Add delivery zone
        </button>
      )}
    </div>
  );
}

// ─── Categories ─────────────────────────────────────────────────────────────

const emptyCategory = { name: "", slug: "", description: "", sortOrder: "0" };

function CategoriesTab() {
  const invalidate = useInvalidate();
  const { data: categories, isLoading } = useQuery({ queryKey: ["categories"], queryFn: getCategoriesAdmin });
  const [editing, setEditing] = useState<Category | "new" | null>(null);
  const [form, setForm] = useState(emptyCategory);
  const [slugTouched, setSlugTouched] = useState(false);
  const onError = (err: unknown) => toast.error(apiErrorMessage(err, "Couldn't save the category"));

  const save = useMutation({
    mutationFn: () => {
      const body = {
        name: form.name.trim(),
        slug: slugify(form.slug || form.name),
        description: form.description.trim() || undefined,
        sortOrder: Number(form.sortOrder) || 0,
      };
      return editing && editing !== "new" ? updateCategory(editing.id, body) : createCategory(body);
    },
    onSuccess: () => {
      invalidate(["categories"], ["products"]);
      setEditing(null);
      toast.success("Category saved");
    },
    onError,
  });
  const remove = useMutation({
    mutationFn: removeCategory,
    onSuccess: () => {
      invalidate(["categories"], ["products"]);
      toast.success("Category removed");
    },
    onError,
  });

  const startEdit = (target: Category | "new") => {
    setForm(
      target === "new"
        ? emptyCategory
        : { name: target.name, slug: target.slug, description: target.description ?? "", sortOrder: String(target.sortOrder) },
    );
    setSlugTouched(target !== "new");
    setEditing(target);
  };

  return (
    <div className="space-y-4">
      {!isLoading && !categories?.length && (
        <Notice tone="warn">
          <strong>Add categories before adding products.</strong> Every product belongs to a category, e.g. Grains,
          Beans, Tubers, Vegetables.
        </Notice>
      )}

      {editing && (
        <FormCard
          title={editing === "new" ? "Add category" : "Edit category"}
          onCancel={() => setEditing(null)}
          onSubmit={() => save.mutate()}
          saving={save.isPending}
        >
          <Field label="Name">
            <input
              required
              maxLength={100}
              className={input}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value, slug: slugTouched ? form.slug : slugify(e.target.value) })}
            />
          </Field>
          <Field label="Web address name" hint="Used in links; filled in from the name">
            <input
              required
              maxLength={100}
              className={cn(input, "font-mono")}
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setForm({ ...form, slug: e.target.value });
              }}
            />
          </Field>
          <Field label="Description (optional)">
            <input maxLength={500} className={input} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <Field label="Display order" hint="Lower numbers show first in the shop">
            <input type="number" min="0" step="1" className={input} value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
          </Field>
        </FormCard>
      )}

      {isLoading && <div className="h-24 bg-slate-100 rounded-xl animate-pulse" />}

      {!!categories?.length && (
        <ListCard>
          {categories.map((c) => (
            <div key={c.id} className="p-4 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px]">
                <p className="text-sm font-semibold text-slate-800">{c.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Order {c.sortOrder}
                  {c.description ? ` · ${c.description}` : ""}
                </p>
              </div>
              <button onClick={() => startEdit(c)} className={ghostBtn}>
                <Pencil className="size-3.5" /> Edit
              </button>
              <button
                onClick={() => confirm(`Remove "${c.name}"? It disappears from the shop's category filters. Move its products to another category first.`) && remove.mutate(c.id)}
                disabled={remove.isPending}
                className={dangerBtn}
              >
                <Trash2 className="size-3.5" /> Remove
              </button>
            </div>
          ))}
        </ListCard>
      )}

      {!editing && (
        <button onClick={() => startEdit("new")} className={primaryBtn}>
          <Plus className="size-4" /> Add category
        </button>
      )}
    </div>
  );
}

// ─── Promo codes ────────────────────────────────────────────────────────────

const emptyPromo = { code: "", label: "", discountPercent: "", maxUses: "", expiresOn: "" };

/** yyyy-mm-dd in local time, for <input type="date">. */
const toDateInput = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function promoStatus(p: PromoCode): { label: string; className: string } {
  if (!p.isActive) return { label: "Off", className: "bg-slate-100 text-slate-500" };
  if (new Date(p.expiresAt) < new Date()) return { label: "Expired", className: "bg-amber-100 text-amber-700" };
  if (p.usedCount >= p.maxUses) return { label: "Used up", className: "bg-amber-100 text-amber-700" };
  return { label: "Live", className: "bg-green-100 text-green-700" };
}

function PromoCodesTab() {
  const invalidate = useInvalidate();
  const { data: promos, isLoading } = useQuery({ queryKey: ["store-promo-codes"], queryFn: getPromoCodesAdmin });
  const [editing, setEditing] = useState<PromoCode | "new" | null>(null);
  const [form, setForm] = useState(emptyPromo);
  const onError = (err: unknown) => toast.error(apiErrorMessage(err, "Couldn't save the promo code"));

  const save = useMutation({
    mutationFn: () => {
      const body = {
        code: form.code.trim().toUpperCase(),
        label: form.label.trim(),
        discountPercent: Number(form.discountPercent),
        maxUses: Number(form.maxUses),
        // End of the chosen day, local time.
        expiresAt: new Date(`${form.expiresOn}T23:59:59`).toISOString(),
      };
      return editing && editing !== "new" ? updatePromoCode(editing.id, body) : createPromoCode(body);
    },
    onSuccess: () => {
      invalidate(["store-promo-codes"]);
      setEditing(null);
      toast.success("Promo code saved");
    },
    onError,
  });
  const toggle = useMutation({
    mutationFn: async (p: PromoCode): Promise<void> => {
      if (p.isActive) await deactivatePromoCode(p.id);
      else await updatePromoCode(p.id, { isActive: true });
    },
    onSuccess: (_, p) => {
      invalidate(["store-promo-codes"]);
      toast.success(p.isActive ? `${p.code} turned off` : `${p.code} turned on`);
    },
    onError,
  });

  const startEdit = (target: PromoCode | "new") => {
    setForm(
      target === "new"
        ? emptyPromo
        : {
            code: target.code,
            label: target.label,
            discountPercent: String(Number(target.discountPercent)),
            maxUses: String(target.maxUses),
            expiresOn: toDateInput(target.expiresAt),
          },
    );
    setEditing(target);
  };

  return (
    <div className="space-y-4">
      <Notice tone="info">
        Customers enter a code at checkout. The discount comes off the items subtotal (not the delivery fee). Each code
        stops working when it expires or reaches its usage limit.
      </Notice>

      {editing && (
        <FormCard
          title={editing === "new" ? "Add promo code" : "Edit promo code"}
          onCancel={() => setEditing(null)}
          onSubmit={() => save.mutate()}
          saving={save.isPending}
        >
          <Field label="Code" hint="Letters and numbers, e.g. WELCOME10">
            <input
              required
              maxLength={50}
              className={cn(input, "font-mono uppercase")}
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s/g, "") })}
            />
          </Field>
          <Field label="Label" hint="For your reference, e.g. Welcome offer">
            <input required maxLength={100} className={input} value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          </Field>
          <Field label="Discount (%)">
            <input required type="number" min="0.01" max="100" step="0.01" className={input} value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: e.target.value })} />
          </Field>
          <Field label="Maximum uses" hint="Total orders that can use this code">
            <input required type="number" min="1" step="1" className={input} value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} />
          </Field>
          <Field label="Last day valid">
            <input required type="date" min={toDateInput(new Date().toISOString())} className={input} value={form.expiresOn} onChange={(e) => setForm({ ...form, expiresOn: e.target.value })} />
          </Field>
        </FormCard>
      )}

      {isLoading && <div className="h-24 bg-slate-100 rounded-xl animate-pulse" />}

      {!!promos?.length && (
        <ListCard>
          {promos.map((p) => {
            const status = promoStatus(p);
            return (
              <div key={p.id} className="p-4 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[220px]">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold font-mono text-slate-800">{p.code}</p>
                    <span className={cn("text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full", status.className)}>
                      {status.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {Number(p.discountPercent)}% off · {p.label} · used {p.usedCount}/{p.maxUses} · until{" "}
                    {new Date(p.expiresAt).toLocaleDateString("en-NG", { dateStyle: "medium" })}
                  </p>
                </div>
                <button onClick={() => startEdit(p)} className={ghostBtn}>
                  <Pencil className="size-3.5" /> Edit
                </button>
                <button onClick={() => toggle.mutate(p)} disabled={toggle.isPending} className={p.isActive ? dangerBtn : ghostBtn}>
                  {p.isActive ? "Turn off" : "Turn on"}
                </button>
              </div>
            );
          })}
        </ListCard>
      )}

      {!isLoading && !promos?.length && !editing && <p className="text-sm text-slate-400">No promo codes yet.</p>}

      {!editing && (
        <button onClick={() => startEdit("new")} className={primaryBtn}>
          <Plus className="size-4" /> Add promo code
        </button>
      )}
    </div>
  );
}
