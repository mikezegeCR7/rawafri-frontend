import { useState } from "react";
import { Upload, ImageIcon } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { uploadPaymentProof } from "@/lib/checkout/api";
import { apiErrorMessage } from "@/lib/api/errors";
import { type Order } from "@/lib/order-data";
import { Panel, btn } from "@/components/storefront/ui";
import { BankTransferDetails } from "./BankTransferDetails";
import { cn } from "@/lib/utils";

export function PaymentReviewCard({ order }: { order: Order }) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);

  const uploadMutation = useMutation({
    mutationFn: (f: File) => {
      if (!order.paymentId) throw new Error("No payment on this order yet");
      return uploadPaymentProof(order.paymentId, f);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
      queryClient.invalidateQueries({ queryKey: ["my-payments"] });
      toast.success("Receipt uploaded. We'll let you know once it's checked.");
      setFile(null);
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Couldn't upload that receipt")),
  });

  // Nothing to show once a payment is verified, or for a cancelled order.
  if (!order.paymentStatus || order.paymentStatus === "VERIFIED" || order.status === "CANCELLED") return null;

  const isRejected = order.paymentStatus === "REJECTED";
  const isUploaded = order.paymentStatus === "UPLOADED";

  return (
    <Panel className={cn("p-5 sm:p-6", isRejected ? "border-destructive/30" : !isUploaded && "border-gold/50")}>
      <h2 className="font-display text-xl text-foreground">
        {isRejected ? "Your receipt wasn't accepted" : isUploaded ? "We're checking your payment" : "Complete your payment"}
      </h2>
      <p className="mt-1.5 text-sm text-muted-foreground">
        {isRejected
          ? "Please check the transfer and upload a clearer or correct receipt."
          : isUploaded
            ? "Our team is reviewing your receipt. You'll get a notification when it's confirmed."
            : "Transfer the exact amount below, then upload your receipt so we can confirm your order."}
      </p>

      {isRejected && order.paymentRejectionReason && (
        <p className="mt-4 rounded-md bg-destructive/[0.07] px-4 py-3 text-sm text-destructive">
          <span className="font-semibold">Reason:</span> {order.paymentRejectionReason}
        </p>
      )}

      {!isUploaded && (
        <div className="mt-5">
          <BankTransferDetails amount={order.total} />
        </div>
      )}

      {order.paymentProofImageUrl && (
        <a
          href={order.paymentProofImageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-3 rounded-md border border-border p-2 pr-4 text-sm font-semibold text-foreground hover:bg-accent"
        >
          <img src={order.paymentProofImageUrl} alt="Uploaded receipt" className="size-12 rounded object-cover" />
          {isRejected ? "Previous receipt" : "View your receipt"}
        </a>
      )}

      {!isUploaded && (
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <label className="flex h-11 flex-1 cursor-pointer items-center gap-2 rounded-md border border-dashed border-input bg-background px-4 text-sm text-muted-foreground transition-colors hover:border-brand hover:text-foreground">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setFile(f);
              }}
            />
            {file ? <ImageIcon className="size-4 text-brand" /> : <Upload className="size-4" />}
            <span className="truncate">{file ? file.name : "Choose a receipt image"}</span>
          </label>
          <button
            onClick={() => file && uploadMutation.mutate(file)}
            disabled={!file || uploadMutation.isPending}
            className={btn.primary}
          >
            {uploadMutation.isPending ? "Uploading..." : isRejected ? "Upload new receipt" : "Upload receipt"}
          </button>
        </div>
      )}
    </Panel>
  );
}
