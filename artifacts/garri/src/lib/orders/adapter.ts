import { STATUS_BADGE, type Notification, type Order } from "../order-data";
import type { FullOrder } from "./types";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });
}

function statusHistoryToNotifications(full: FullOrder): Notification[] {
  return full.statusHistory.map((entry, idx) => ({
    id: entry.id,
    time: formatTime(entry.createdAt),
    message: entry.note || `Order status updated: ${STATUS_BADGE[entry.status]?.label ?? entry.status}`,
    type: entry.status === "CANCELLED" ? "warning" : entry.status === "DELIVERED" ? "success" : "info",
    read: idx < full.statusHistory.length - 1,
  }));
}

export function toDisplayOrder(full: FullOrder): Order {
  const deliveredEntry = full.statusHistory.find((h) => h.status === "DELIVERED");

  return {
    id: full.id,
    reference: full.orderNumber,
    status: full.status,
    createdAt: formatDateTime(full.createdAt),
    estimatedDelivery: full.deliveryZone.estimatedTime,
    estimatedMinutes: 0,
    items: full.items.map((item) => ({
      id: item.id,
      name: item.product.name,
      quantity: item.quantity,
      unit: "",
      price: Number(item.unitPrice),
      image: item.product.imageUrl ?? "",
    })),
    subtotal: Number(full.subtotal),
    deliveryFee: Number(full.deliveryFee),
    discount: Number(full.discountAmount ?? 0),
    total: Number(full.totalAmount),
    address: full.deliveryAddress,
    landmark: full.address?.landmark ?? "",
    contactName: full.deliveryContactName,
    contactPhone: full.deliveryPhone,
    deliveryZoneName: full.deliveryZone.name,
    notifications: statusHistoryToNotifications(full),
    confirmedAt: deliveredEntry ? formatTime(deliveredEntry.createdAt) : undefined,
    otpVerified: Boolean(deliveredEntry),
        paymentId: full.payment?.id,
    paymentStatus: full.payment?.status,
    paymentProofImageUrl: full.payment?.proofImageUrl ?? null,
    paymentRejectionReason: full.payment?.rejectionReason ?? null,
  };
}