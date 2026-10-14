// Mirrors the include shape returned by backend
// OrdersService.findMyOrders / findMyOrder / confirmDelivery:
// items (with product), payment, statusHistory, address, deliveryZone, promoCode.

import type { Address, DeliveryZone, OrderRecord, PaymentRecord } from "../checkout/types";
import type { Product } from "../products/types";
import type { OrderStatus } from "../order-data";

export type OrderStatusHistoryEntry = {
  id: string;
  orderId: string;
  status: OrderStatus;
  changedById: string | null;
  note: string | null;
  createdAt: string;
};

export type OrderItemWithProduct = {
  id: string;
  orderId: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
};

export type PromoCodeRecord = {
  id: string;
  code: string;
  discountType: string;
  discountValue: string;
} | null;

/** Full order as returned by GET /orders, GET /orders/:id, and confirm-delivery. */
export type FullOrder = Omit<OrderRecord, "status"> & {
  status: OrderStatus;
  items: OrderItemWithProduct[];
  payment: PaymentRecord | null;
  statusHistory: OrderStatusHistoryEntry[];
  address: Address | null;
  deliveryZone: DeliveryZone;
  promoCode: PromoCodeRecord;
};

export type OrderCustomer = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

/** Admin variant — same shape as FullOrder plus the customer (admin needs
 * to see who placed the order; the customer's own GET /orders doesn't
 * bother returning that since it's implicitly "me"). */
export type AdminFullOrder = FullOrder & {
  customer: OrderCustomer;
};

export type UpdateOrderStatusPayload = {
  status: OrderStatus;
  note?: string;
};