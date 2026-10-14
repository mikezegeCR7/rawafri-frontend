import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, CheckCircle2, ImageIcon, Plus, ShoppingBasket, Tag, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart/CartContext";
import { formatNaira } from "@/lib/products/types";
import { ProductImage } from "@/components/storefront/ProductImage";
import {
  getAddresses,
  createAddress,
  getDeliveryZones,
  getActiveBankAccount,
  createOrder,
  uploadPaymentProof,
  validatePromoCode,
} from "@/lib/checkout/api";
import type { Address, CreatedOrderResponse, DeliveryZone, PromoValidation } from "@/lib/checkout/types";
import { apiErrorMessage } from "@/lib/api/errors";
import { AddressForm } from "@/components/account/AddressForm";
import { BasketLines } from "@/components/account/BasketLines";
import { BankTransferDetails } from "@/components/orders/BankTransferDetails";
import { Badge, EmptyState, Panel, Spinner, btn, inputClass } from "@/components/storefront/ui";
import { cn } from "@/lib/utils";

type Step = "cart" | "address" | "payment" | "processing" | "success" | "failed";

const STEPS = [
  { key: "cart", label: "Basket" },
  { key: "address", label: "Delivery" },
  { key: "payment", label: "Payment" },
] as const;

/** Same rounding the backend uses: discount on the subtotal, to 2 decimal places. */
function discountFor(subtotal: number, promo: PromoValidation | null) {
  if (!promo) return 0;
  return Math.round(subtotal * promo.discountPercent) / 100;
}

export default function Checkout() {
  const [, navigate] = useLocation();
  const { items, subtotal, clearCart } = useCart();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>("cart");
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [promo, setPromo] = useState<PromoValidation | null>(null);
  const [failedError, setFailedError] = useState("");
  const [result, setResult] = useState<{ order: CreatedOrderResponse; proofUploaded: boolean } | null>(null);

  const { data: addresses, isLoading: addressesLoading } = useQuery({ queryKey: ["addresses"], queryFn: getAddresses });
  const { data: zones, isLoading: zonesLoading } = useQuery({ queryKey: ["delivery-zones"], queryFn: getDeliveryZones });
  const { data: bankAccount } = useQuery({ queryKey: ["bank-account-active"], queryFn: getActiveBankAccount, retry: false });

  // Pre-select the default address once addresses arrive.
  useEffect(() => {
    if (!selectedAddressId && addresses?.length) {
      setSelectedAddressId((addresses.find((a) => a.isDefault) ?? addresses[0]).id);
    }
  }, [addresses, selectedAddressId]);

  // Open the address form straight away for a customer with no saved addresses —
  // only on the first load, so saving one doesn't re-open it.
  const autoOpenedForm = useRef(false);
  useEffect(() => {
    if (!autoOpenedForm.current && addresses) {
      autoOpenedForm.current = true;
      if (addresses.length === 0) setShowAddressForm(true);
    }
  }, [addresses]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

  const addAddressMutation = useMutation({
    mutationFn: createAddress,
    onSuccess: (newAddress) => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      setSelectedAddressId(newAddress.id);
      setShowAddressForm(false);
      toast.success("Address saved");
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Couldn't save that address")),
  });

  const selectedZone = zones?.find((z) => z.id === selectedZoneId) ?? null;
  const selectedAddress = addresses?.find((a) => a.id === selectedAddressId) ?? null;
  const deliveryFee = selectedZone ? Number(selectedZone.fee) : 0;
  const discount = discountFor(subtotal, promo);
  const total = Math.round((subtotal + deliveryFee - discount) * 100) / 100;

  const handlePlaceOrder = async () => {
    if (!selectedAddressId || !selectedZoneId) return;
    setStep("processing");
    try {
      const res = await createOrder({
        addressId: selectedAddressId,
        deliveryZoneId: selectedZoneId,
        promoCode: promo?.code,
        items: items.map((i) => ({ productId: i.id, quantity: i.quantity })),
      });

      let proofUploaded = false;
      if (proofFile) {
        try {
          await uploadPaymentProof(res.payment.id, proofFile);
          proofUploaded = true;
        } catch {
          // The order exists at this point — a failed upload shouldn't hide that.
          toast.error("Your order was placed, but the receipt didn't upload. You can add it from the order page.");
        }
      }

      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
      queryClient.invalidateQueries({ queryKey: ["my-payments"] });
      queryClient.invalidateQueries({ queryKey: ["unread-notification-count"] });
      setResult({ order: res, proofUploaded });
      clearCart();
      setStep("success");
    } catch (error) {
      setFailedError(apiErrorMessage(error, "Something went wrong placing your order."));
      setStep("failed");
    }
  };

  if (step === "processing") return <ProcessingScreen />;
  if (step === "success" && result) return <SuccessScreen result={result} zone={selectedZone} />;
  if (step === "failed") {
    return <FailedScreen message={failedError} onRetry={() => setStep("payment")} onHome={() => navigate("/")} />;
  }

  const stepIndex = STEPS.findIndex((s) => s.key === step);
  const goBack = () => (step === "cart" ? navigate("/") : setStep(step === "address" ? "cart" : "address"));

  return (
    <div className="min-h-screen bg-background">
      <CheckoutHeader stepIndex={stepIndex} onBack={goBack} />

      {items.length === 0 ? (
        <main className="mx-auto max-w-xl px-4 py-16">
          <EmptyState
            icon={ShoppingBasket}
            title="Your basket is empty"
            description="Add something from the market to check out."
            action={<Link href="/" className={btn.primary}>Browse the market</Link>}
          />
        </main>
      ) : (
        <main className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10 lg:px-8 lg:py-10">
          <div className="min-w-0 space-y-6">
            {step === "cart" && (
              <>
                <h1 className="font-display text-3xl text-foreground">Your basket</h1>
                <Panel>
                  <BasketLines />
                </Panel>
                <button onClick={() => setStep("address")} className={cn(btn.primary, "w-full sm:w-auto")}>
                  Continue to delivery
                </button>
              </>
            )}

            {step === "address" && (
              <>
                <h1 className="font-display text-3xl text-foreground">Delivery details</h1>

                <Panel className="p-5 sm:p-6">
                  <h2 className="text-base font-bold text-foreground">Delivery address</h2>
                  {addressesLoading && <div className="mt-4 h-20 animate-pulse rounded-md bg-muted" />}

                  {!addressesLoading && !!addresses?.length && !showAddressForm && (
                    <div className="mt-4 space-y-2" role="radiogroup" aria-label="Delivery address">
                      {addresses.map((addr) => (
                        <AddressOption
                          key={addr.id}
                          address={addr}
                          selected={selectedAddressId === addr.id}
                          onSelect={() => setSelectedAddressId(addr.id)}
                        />
                      ))}
                      <button
                        onClick={() => setShowAddressForm(true)}
                        className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline underline-offset-4"
                      >
                        <Plus className="size-4" /> Add a new address
                      </button>
                    </div>
                  )}

                  {showAddressForm && (
                    <div className="mt-5">
                      <AddressForm
                        saving={addAddressMutation.isPending}
                        submitLabel="Save address"
                        onSubmit={(payload) => addAddressMutation.mutate(payload)}
                        onCancel={addresses?.length ? () => setShowAddressForm(false) : undefined}
                      />
                    </div>
                  )}
                </Panel>

                <Panel className="p-5 sm:p-6">
                  <h2 className="text-base font-bold text-foreground">Delivery area</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Choose the area your address is in. The fee and estimated time are set by area.</p>
                  {zonesLoading && <div className="mt-4 h-20 animate-pulse rounded-md bg-muted" />}
                  {!zonesLoading && zones?.length === 0 && (
                    <p className="mt-4 text-sm text-muted-foreground">No delivery areas are available right now. Please contact support.</p>
                  )}
                  <div className="mt-4 space-y-2" role="radiogroup" aria-label="Delivery area">
                    {zones?.map((zone) => (
                      <ZoneOption key={zone.id} zone={zone} selected={selectedZoneId === zone.id} onSelect={() => setSelectedZoneId(zone.id)} />
                    ))}
                  </div>
                </Panel>

                <button
                  onClick={() => {
                    if (!selectedAddressId || showAddressForm) {
                      toast.error("Please choose or save a delivery address");
                      return;
                    }
                    if (!selectedZoneId) {
                      toast.error("Please choose your delivery area");
                      return;
                    }
                    setStep("payment");
                  }}
                  className={cn(btn.primary, "w-full sm:w-auto")}
                >
                  Continue to payment
                </button>
              </>
            )}

            {step === "payment" && (
              <>
                <h1 className="font-display text-3xl text-foreground">Payment</h1>

                <Panel className="flex items-start justify-between gap-4 p-5">
                  <div className="text-sm">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Delivering to</p>
                    <p className="mt-1.5 font-semibold text-foreground">{selectedAddress?.contactName}</p>
                    <p className="text-foreground">
                      {selectedAddress?.line1}, {selectedAddress?.city}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      {selectedZone?.name} · {selectedZone?.estimatedTime}
                    </p>
                  </div>
                  <button onClick={() => setStep("address")} className="text-sm font-semibold text-brand hover:underline underline-offset-4">
                    Change
                  </button>
                </Panel>

                <Panel className="p-5 sm:p-6">
                  <h2 className="text-base font-bold text-foreground">Pay by bank transfer</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Transfer exactly <span className="font-bold text-foreground">{formatNaira(total)}</span> to the account below.
                  </p>
                  <div className="mt-5">
                    <BankTransferDetails amount={total} />
                  </div>

                  <div className="mt-6">
                    <p className="text-sm font-semibold text-foreground">
                      Transfer receipt <span className="font-normal text-muted-foreground">(you can also add it later)</span>
                    </p>
                    <label className="mt-2 flex h-12 cursor-pointer items-center gap-2 rounded-md border border-dashed border-input bg-background px-4 text-sm text-muted-foreground transition-colors hover:border-brand hover:text-foreground">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setProofFile(file);
                        }}
                      />
                      {proofFile ? <ImageIcon className="size-4 text-brand" /> : <Upload className="size-4" />}
                      <span className="flex-1 truncate">{proofFile ? proofFile.name : "Choose a screenshot or photo of your receipt"}</span>
                      {proofFile && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setProofFile(null);
                          }}
                          aria-label="Remove receipt"
                          className="grid size-7 place-items-center rounded text-muted-foreground hover:text-foreground"
                        >
                          <X className="size-4" />
                        </button>
                      )}
                    </label>
                  </div>
                </Panel>

                <div>
                  <button onClick={handlePlaceOrder} disabled={!bankAccount} className={cn(btn.primary, "w-full sm:w-auto sm:px-8")}>
                    Place order · {formatNaira(total)}
                  </button>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Your order is prepared once our team confirms your payment. We'll notify you at each step.
                  </p>
                </div>
              </>
            )}
          </div>

          <OrderSummaryPanel
            subtotal={subtotal}
            deliveryFee={deliveryFee}
            zoneChosen={!!selectedZone}
            discount={discount}
            total={total}
            promo={promo}
            onPromoChange={setPromo}
          />
        </main>
      )}
    </div>
  );
}

function CheckoutHeader({ stepIndex, onBack }: { stepIndex: number; onBack: () => void }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="kente-rule h-1" aria-hidden />
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <button onClick={onBack} aria-label="Go back" className="grid size-10 place-items-center rounded-md hover:bg-accent">
          <ArrowLeft className="size-5" />
        </button>
        <Link href="/" aria-label="RawAfri home" className="hidden sm:block">
          <img src="/rawafri-logo-compact.png" alt="RawAfri" className="h-10 w-auto" />
        </Link>
        <ol className="ml-auto flex items-center gap-2 sm:gap-3">
          {STEPS.map((s, i) => (
            <li key={s.key} className="flex items-center gap-2 sm:gap-3">
              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    "grid size-6 place-items-center rounded-full text-[11px] font-bold",
                    i < stepIndex && "bg-brand text-brand-foreground",
                    i === stepIndex && "bg-cocoa text-background",
                    i > stepIndex && "bg-secondary text-muted-foreground",
                  )}
                >
                  {i < stepIndex ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
                </span>
                <span className={cn("hidden text-sm font-semibold sm:inline", i === stepIndex ? "text-foreground" : "text-muted-foreground")}>
                  {s.label}
                </span>
              </span>
              {i < STEPS.length - 1 && <span className="h-px w-4 bg-border sm:w-8" />}
            </li>
          ))}
        </ol>
      </div>
    </header>
  );
}

function OrderSummaryPanel({
  subtotal,
  deliveryFee,
  zoneChosen,
  discount,
  total,
  promo,
  onPromoChange,
}: {
  subtotal: number;
  deliveryFee: number;
  zoneChosen: boolean;
  discount: number;
  total: number;
  promo: PromoValidation | null;
  onPromoChange: (p: PromoValidation | null) => void;
}) {
  const { items, itemCount } = useCart();
  const [code, setCode] = useState("");

  const validateMutation = useMutation({
    mutationFn: (c: string) => validatePromoCode(c),
    onSuccess: (res) => {
      onPromoChange(res);
      setCode("");
      toast.success(`${res.code} applied: ${res.discountPercent}% off`);
    },
    onError: (err) => toast.error(apiErrorMessage(err, "That promo code can't be used")),
  });

  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <Panel>
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-display text-lg text-foreground">
            Order summary <span className="text-muted-foreground">({itemCount})</span>
          </h2>
        </div>
        <ul className="max-h-64 divide-y divide-border overflow-y-auto">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 px-5 py-3">
              <div className="relative shrink-0">
                <ProductImage src={item.imageUrl} alt={item.name} className="size-12 rounded-md object-cover" />
                <span className="absolute -right-1.5 -top-1.5 grid min-w-5 h-5 place-items-center rounded-full bg-cocoa px-1 text-[10px] font-bold text-background">
                  {item.quantity}
                </span>
              </div>
              <p className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{item.name}</p>
              <p className="text-sm font-semibold text-foreground">{formatNaira(item.price * item.quantity)}</p>
            </li>
          ))}
        </ul>

        {/* Promo code — checked against the backend before it counts */}
        <div className="border-t border-border px-5 py-4">
          {promo ? (
            <div className="flex items-center justify-between gap-3 rounded-md bg-brand-muted px-3 py-2.5">
              <div className="flex items-center gap-2 text-sm">
                <Tag className="size-4 text-brand" />
                <span className="font-bold text-brand">{promo.code}</span>
                <span className="text-brand/80">{promo.discountPercent}% off</span>
              </div>
              <button onClick={() => onPromoChange(null)} className="text-xs font-semibold text-muted-foreground hover:text-foreground">
                Remove
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (code.trim()) validateMutation.mutate(code.trim());
              }}
              className="flex gap-2"
            >
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Promo code"
                aria-label="Promo code"
                className={cn(inputClass, "h-10 text-sm uppercase placeholder:normal-case")}
              />
              <button type="submit" disabled={!code.trim() || validateMutation.isPending} className={cn(btn.secondary, "h-10 px-4 text-sm")}>
                {validateMutation.isPending ? "…" : "Apply"}
              </button>
            </form>
          )}
        </div>

        <dl className="space-y-2 border-t border-border px-5 py-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="text-foreground">{formatNaira(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Delivery</dt>
            <dd className="text-foreground">{zoneChosen ? formatNaira(deliveryFee) : <span className="text-muted-foreground">Choose an area</span>}</dd>
          </div>
          {discount > 0 && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Promo discount</dt>
              <dd className="font-semibold text-brand">−{formatNaira(discount)}</dd>
            </div>
          )}
          <div className="flex items-baseline justify-between border-t border-border pt-3">
            <dt className="font-bold text-foreground">Total</dt>
            <dd className="font-display text-2xl text-foreground">{formatNaira(total)}</dd>
          </div>
        </dl>
      </Panel>
    </aside>
  );
}

function AddressOption({ address, selected, onSelect }: { address: Address; selected: boolean; onSelect: () => void }) {
  return (
    <button
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex w-full items-start gap-3 rounded-md border p-4 text-left transition-colors",
        selected ? "border-brand bg-brand-muted/50" : "border-input hover:border-foreground/30",
      )}
    >
      <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2", selected ? "border-brand" : "border-input")}>
        {selected && <span className="size-2.5 rounded-full bg-brand" />}
      </span>
      <div className="min-w-0 flex-1 text-sm">
        <div className="flex items-center gap-2">
          <p className="font-bold text-foreground">{address.label}</p>
          {address.isDefault && <Badge className="bg-secondary text-secondary-foreground ring-border">Default</Badge>}
        </div>
        <p className="mt-1 text-foreground">
          {address.line1}, {address.city}, {address.state}
        </p>
        <p className="text-muted-foreground">
          {address.contactName} · {address.phone}
        </p>
      </div>
    </button>
  );
}

function ZoneOption({ zone, selected, onSelect }: { zone: DeliveryZone; selected: boolean; onSelect: () => void }) {
  return (
    <button
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-md border p-4 text-left transition-colors",
        selected ? "border-brand bg-brand-muted/50" : "border-input hover:border-foreground/30",
      )}
    >
      <span className={cn("grid size-5 shrink-0 place-items-center rounded-full border-2", selected ? "border-brand" : "border-input")}>
        {selected && <span className="size-2.5 rounded-full bg-brand" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-foreground">{zone.name}</p>
        <p className="text-xs text-muted-foreground">{zone.estimatedTime}</p>
      </div>
      <span className="text-sm font-bold text-foreground">{formatNaira(Number(zone.fee))}</span>
    </button>
  );
}

function ProcessingScreen() {
  return (
    <div className="grid min-h-screen place-items-center bg-background p-6">
      <div className="text-center">
        <Spinner className="mx-auto size-8" />
        <p className="mt-4 font-display text-xl text-foreground">Placing your order…</p>
        <p className="mt-1 text-sm text-muted-foreground">Please keep this page open.</p>
      </div>
    </div>
  );
}

function SuccessScreen({
  result,
  zone,
}: {
  result: { order: CreatedOrderResponse; proofUploaded: boolean };
  zone: DeliveryZone | null;
}) {
  const { order } = result.order;
  // The backend's total is the amount to pay — it already includes delivery and any promo.
  const amount = Number(order.totalAmount);

  return (
    <div className="min-h-screen bg-background">
      <div className="kente-rule h-1" aria-hidden />
      <main className="mx-auto max-w-xl px-4 py-14 sm:py-20">
        <CheckCircle2 className="size-12 text-brand" />
        <h1 className="mt-5 font-display text-4xl leading-tight text-foreground">Thank you. Your order is in.</h1>
        <p className="mt-3 text-[15px] text-muted-foreground">
          Order <span className="font-bold text-foreground">{order.orderNumber}</span>
          {zone?.estimatedTime && <> · Estimated delivery: {zone.estimatedTime}</>}
        </p>

        <Panel className="mt-8 p-5 sm:p-6">
          {result.proofUploaded ? (
            <>
              <h2 className="font-display text-xl text-foreground">We're checking your payment</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Your receipt for {formatNaira(amount)} has been sent to our team. You'll get a notification once it's confirmed
                and your order is being prepared.
              </p>
            </>
          ) : (
            <>
              <h2 className="font-display text-xl text-foreground">Next: pay {formatNaira(amount)}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Transfer the exact amount below, then upload your receipt from the order page.
              </p>
              <div className="mt-5">
                <BankTransferDetails amount={amount} />
              </div>
            </>
          )}
        </Panel>

        <div className="mt-8 flex flex-col gap-2 sm:flex-row">
          <Link href={`/orders/${order.id}`} className={cn(btn.primary, "flex-1")}>
            {result.proofUploaded ? "Track your order" : "Go to order to upload receipt"}
          </Link>
          <Link href="/" className={cn(btn.secondary, "flex-1")}>
            Continue shopping
          </Link>
        </div>
      </main>
    </div>
  );
}

function FailedScreen({ message, onRetry, onHome }: { message: string; onRetry: () => void; onHome: () => void }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="kente-rule h-1" aria-hidden />
      <main className="mx-auto max-w-xl px-4 py-14 sm:py-20">
        <h1 className="font-display text-4xl text-foreground">We couldn't place your order</h1>
        <p className="mt-4 rounded-md border border-destructive/20 bg-destructive/[0.06] px-4 py-3 text-sm text-destructive">{message}</p>
        <p className="mt-4 text-sm text-muted-foreground">Your basket is still saved, so you can try again.</p>
        <div className="mt-8 flex flex-col gap-2 sm:flex-row">
          <button onClick={onRetry} className={cn(btn.primary, "flex-1")}>
            Try again
          </button>
          <button onClick={onHome} className={cn(btn.secondary, "flex-1")}>
            Back to the market
          </button>
        </div>
      </main>
    </div>
  );
}
