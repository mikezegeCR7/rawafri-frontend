// Canonical order types — mirrors backend/prisma/schema.prisma `Order`,
// `OrderItem`, and the `OrderStatus` enum exactly (see backend/src/orders).
// This is the single source of truth for order status across the app;
// src/lib/admin-data.ts imports OrderStatus from here rather than
// redefining its own.

export type OrderStatus =
  | "ORDER_RECEIVED"
  | "AWAITING_PAYMENT"
  | "PAYMENT_CONFIRMED"
  | "PREPARING_ORDER"
  | "OUT_FOR_DELIVERY"
  | "AWAITING_CUSTOMER_CONFIRMATION"
  | "DELIVERED"
  | "CANCELLED";

export type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  price: number;
  image: string;
};

export type Notification = {
  id: string;
  time: string;
  message: string;
  type: "info" | "success" | "warning";
  read: boolean;
};

export type DeliveryIssue = {
  id: string;
  reportedAt: string;
  description: string;
  resolved: boolean;
};

export type Order = {
  id: string;
  /** Maps to backend `orderNumber` (e.g. "RAW-2026-000001"). */
  reference: string;
  status: OrderStatus;
  createdAt: string;
  estimatedDelivery: string;
  estimatedMinutes: number;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  /** Promo discount in naira (0 when no promo was used). */
  discount: number;
  total: number;
  address: string;
  landmark: string;
  contactName: string;
  contactPhone: string;
  /** Backend delivery zone name (single-seller — RawAfri has no vendor concept). */
  deliveryZoneName: string;
  notifications: Notification[];
  deliveryIssues?: DeliveryIssue[];
  confirmedAt?: string;
  otpVerified?: boolean;
    /** Real payment detail, for showing rejection reasons + reupload. */
  paymentId?: string;
  paymentStatus?: "PENDING" | "UPLOADED" | "VERIFIED" | "REJECTED";
  paymentProofImageUrl?: string | null;
  paymentRejectionReason?: string | null;
};

// Linear progression a normal (non-cancelled) order moves through.
// CANCELLED is a terminal state handled separately in the UI, not part
// of this sequence.
export const ORDER_STAGES: { key: OrderStatus; label: string; sub: string }[] = [
  { key: "ORDER_RECEIVED", label: "Order Received", sub: "We got your order" },
  { key: "AWAITING_PAYMENT", label: "Awaiting Payment", sub: "Upload proof of bank transfer" },
  { key: "PAYMENT_CONFIRMED", label: "Payment Confirmed", sub: "Payment verified" },
  { key: "PREPARING_ORDER", label: "Preparing Order", sub: "Being packaged" },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", sub: "On the way to you" },
  { key: "AWAITING_CUSTOMER_CONFIRMATION", label: "Awaiting Confirmation", sub: "Please confirm receipt" },
  { key: "DELIVERED", label: "Delivered", sub: "Enjoy your food!" },
];

export const STATUS_INDEX: Record<OrderStatus, number> = {
  ORDER_RECEIVED: 0,
  AWAITING_PAYMENT: 1,
  PAYMENT_CONFIRMED: 2,
  PREPARING_ORDER: 3,
  OUT_FOR_DELIVERY: 4,
  AWAITING_CUSTOMER_CONFIRMATION: 5,
  DELIVERED: 6,
  CANCELLED: -1,
};

// Storefront palette: gold = waiting on the customer's payment, green = moving,
// terracotta = needs the customer's action, cocoa = neutral.
export const STATUS_BADGE: Record<OrderStatus, { label: string; color: string }> = {
  ORDER_RECEIVED: { label: "Order received", color: "bg-secondary text-secondary-foreground ring-border" },
  AWAITING_PAYMENT: { label: "Awaiting payment", color: "bg-gold/15 text-[oklch(0.45_0.1_70)] ring-gold/40" },
  PAYMENT_CONFIRMED: { label: "Payment confirmed", color: "bg-brand-muted text-brand ring-brand/20" },
  PREPARING_ORDER: { label: "Preparing", color: "bg-brand-muted text-brand ring-brand/20" },
  OUT_FOR_DELIVERY: { label: "Out for delivery", color: "bg-brand-muted text-brand ring-brand/20" },
  AWAITING_CUSTOMER_CONFIRMATION: { label: "Confirm delivery", color: "bg-terracotta/12 text-terracotta ring-terracotta/30" },
  DELIVERED: { label: "Delivered", color: "bg-brand text-brand-foreground ring-brand" },
  CANCELLED: { label: "Cancelled", color: "bg-destructive/10 text-destructive ring-destructive/20" },
};

export { formatNaira } from "./products/types";
