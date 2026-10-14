import { useQuery } from "@tanstack/react-query";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { getActiveBankAccount } from "@/lib/checkout/api";
import { formatNaira } from "@/lib/products/types";

/** The live RawAfri account to transfer to, with copy buttons. Used at checkout
 * and on any order still waiting for payment. */
export function BankTransferDetails({ amount }: { amount: number }) {
  const { data: bankAccount, isLoading, isError } = useQuery({
    queryKey: ["bank-account-active"],
    queryFn: getActiveBankAccount,
    retry: false,
  });

  if (isLoading) return <div className="h-40 animate-pulse rounded-md bg-muted" />;

  if (isError || !bankAccount) {
    return (
      <div className="rounded-md border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-foreground">
        Payment details aren't available right now. Please contact support before paying.
      </div>
    );
  }

  const rows = [
    { label: "Bank", value: bankAccount.bankName, copy: false },
    { label: "Account name", value: bankAccount.accountName, copy: false },
    { label: "Account number", value: bankAccount.accountNumber, copy: true, mono: true },
    { label: "Amount", value: formatNaira(amount), copyValue: String(amount), copy: true, strong: true },
  ];

  return (
    <dl className="divide-y divide-border overflow-hidden rounded-md border border-border bg-background">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between gap-3 px-4 py-3">
          <dt className="text-sm text-muted-foreground">{row.label}</dt>
          <dd className="flex items-center gap-1.5">
            <span
              className={[
                "text-right text-sm text-foreground",
                "mono" in row && row.mono ? "font-mono tracking-wide" : "",
                "strong" in row && row.strong ? "text-base font-bold" : "font-semibold",
              ].join(" ")}
            >
              {row.value}
            </span>
            {row.copy && (
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(("copyValue" in row && row.copyValue) || row.value);
                  toast.success(`${row.label} copied`);
                }}
                aria-label={`Copy ${row.label.toLowerCase()}`}
                className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Copy className="size-3.5" />
              </button>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
