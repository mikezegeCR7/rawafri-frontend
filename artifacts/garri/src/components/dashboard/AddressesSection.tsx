import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Plus } from "lucide-react";
import { toast } from "sonner";
import { getAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress } from "@/lib/checkout/api";
import type { Address, CreateAddressPayload } from "@/lib/checkout/types";
import { apiErrorMessage } from "@/lib/api/errors";
import { AddressForm } from "@/components/account/AddressForm";
import { Badge, EmptyState, PageHeading, Panel, btn } from "@/components/storefront/ui";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

const TYPE_LABEL = { HOME: "Home", WORK: "Work", OTHER: "Other" } as const;

export function AddressesSection() {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"list" | "new" | Address>("list");
  const [toDelete, setToDelete] = useState<Address | null>(null);

  const { data: addresses, isLoading } = useQuery({ queryKey: ["addresses"], queryFn: getAddresses });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["addresses"] });

  const createMutation = useMutation({
    mutationFn: createAddress,
    onSuccess: () => {
      invalidate();
      setMode("list");
      toast.success("Address added");
    },
    onError: (err) => toast.error(apiErrorMessage(err, "Couldn't save that address")),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CreateAddressPayload }) => updateAddress(id, payload),
    onSuccess: () => {
      invalidate();
      setMode("list");
      toast.success("Address updated");
    },
    onError: (err) => toast.error(apiErrorMessage(err, "Couldn't update that address")),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAddress,
    onSuccess: () => {
      invalidate();
      toast.success("Address removed");
    },
    onError: (err) => toast.error(apiErrorMessage(err, "Couldn't remove that address")),
  });

  const setDefaultMutation = useMutation({
    mutationFn: setDefaultAddress,
    onSuccess: () => {
      invalidate();
      toast.success("Default address updated");
    },
    onError: (err) => toast.error(apiErrorMessage(err, "Couldn't set as default")),
  });

  const editing = typeof mode === "object" ? mode : null;

  return (
    <div className="space-y-8">
      <PageHeading
        title="Addresses"
        description="Where we deliver your orders."
        action={
          mode === "list" &&
          !!addresses?.length && (
            <button onClick={() => setMode("new")} className={cn(btn.primary, btn.sm)}>
              <Plus className="size-4" /> Add address
            </button>
          )
        }
      />

      {mode !== "list" && (
        <Panel className="max-w-2xl p-5 sm:p-6">
          <h2 className="mb-5 font-display text-xl text-foreground">{editing ? "Edit address" : "New address"}</h2>
          <AddressForm
            key={editing?.id ?? "new"}
            initial={editing}
            saving={createMutation.isPending || updateMutation.isPending}
            submitLabel={editing ? "Save changes" : "Save address"}
            onCancel={() => setMode("list")}
            onSubmit={(payload) =>
              editing ? updateMutation.mutate({ id: editing.id, payload }) : createMutation.mutate(payload)
            }
          />
        </Panel>
      )}

      {isLoading && <Panel className="h-32 animate-pulse" />}

      {!isLoading && mode === "list" && (!addresses || addresses.length === 0) && (
        <EmptyState
          icon={MapPin}
          title="No addresses yet"
          description="Add the address you'd like your orders delivered to."
          action={
            <button onClick={() => setMode("new")} className={btn.primary}>
              <Plus className="size-4" /> Add address
            </button>
          }
        />
      )}

      {!isLoading && addresses && addresses.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {addresses.map((address) => (
            <Panel key={address.id} className={cn("flex flex-col p-5", address.isDefault && "border-brand/40")}>
              <div className="flex items-center gap-2">
                <p className="font-bold text-foreground">{address.label}</p>
                <span className="text-xs text-muted-foreground">· {TYPE_LABEL[address.type]}</span>
                {address.isDefault && <Badge className="ml-auto bg-brand-muted text-brand ring-brand/20">Default</Badge>}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-foreground">
                {address.line1}
                <br />
                {address.city}, {address.state}
              </p>
              {address.landmark && <p className="mt-1 text-xs text-muted-foreground">Near {address.landmark}</p>}
              <p className="mt-3 text-sm text-muted-foreground">
                {address.contactName} · {address.phone}
              </p>
              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-4 text-sm font-semibold">
                <button onClick={() => setMode(address)} className="text-foreground hover:underline underline-offset-4">
                  Edit
                </button>
                {!address.isDefault && (
                  <button
                    onClick={() => setDefaultMutation.mutate(address.id)}
                    disabled={setDefaultMutation.isPending}
                    className="text-brand hover:underline underline-offset-4 disabled:opacity-50"
                  >
                    Make default
                  </button>
                )}
                <button
                  onClick={() => setToDelete(address)}
                  className="ml-auto text-destructive hover:underline underline-offset-4"
                >
                  Remove
                </button>
              </div>
            </Panel>
          ))}
        </div>
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this address?</AlertDialogTitle>
            <AlertDialogDescription>
              "{toDelete?.label}" will be removed from your saved addresses. Past orders keep their delivery details.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => toDelete && deleteMutation.mutate(toDelete.id)}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
