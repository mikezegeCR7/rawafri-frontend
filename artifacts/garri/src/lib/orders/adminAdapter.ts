import type { AdminFullOrder } from "./types";
import type { Order } from "../admin-data";

function paymentBadgeStatus(full: AdminFullOrder): "paid" | "pending" | "failed" {
  const status = full.payment?.status;
  if (status === "VERIFIED") return "paid";
  if (status === "REJECTED") return "failed";
  return "pending";
}

export function toAdminOrderRow(full: AdminFullOrder): Order {
  return {
    id: full.id,
    orderNumber: full.orderNumber,
    customer: `${full.customer.firstName} ${full.customer.lastName}`,
    phone: full.customer.phone,
    items: full.items.map((i) => `${i.product.name} x${i.quantity}`).join(", "),
    total: Number(full.totalAmount),
    status: full.status,
    date: new Date(full.createdAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }),
    address: full.deliveryAddress,
    payment: paymentBadgeStatus(full),
    paymentId: full.payment?.id,
    paymentStatus: full.payment?.status,
    paymentProofImageUrl: full.payment?.proofImageUrl ?? null,
    paymentRejectionReason: full.payment?.rejectionReason ?? null,
  };
}