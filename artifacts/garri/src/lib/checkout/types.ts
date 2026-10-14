// Mirrors backend/prisma/schema.prisma Address, DeliveryZone, BankAccount,
// Order, OrderItem, Payment models, and backend/src/orders/dto/create-order.dto.ts.
// As with products, Decimal fields (fee, subtotal, totalAmount, amount, etc.)
// come back as STRINGS — always Number(...) them before doing math.

export type AddressType = "HOME" | "WORK" | "OTHER";

export type Address = {
  id: string;
  userId: string;
  label: string;
  type: AddressType;
  contactName: string;
  phone: string;
  line1: string;
  city: string;
  state: string;
  landmark: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateAddressPayload = {
  label: string;
  type?: AddressType;
  contactName: string;
  phone: string;
  line1: string;
  city: string;
  state: string;
  landmark?: string;
};

export type DeliveryZone = {
  id: string;
  name: string;
  fee: string;
  estimatedTime: string;
  isActive: boolean;
};

export type BankAccount = {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  isActive: boolean;
};

/** Mirrors backend PromoValidationResult. */
export type PromoValidation = {
  code: string;
  label: string;
  discountPercent: number;
};

export type CreateOrderItemPayload = {
  productId: string;
  quantity: number;
};

export type CreateOrderPayload = {
  addressId: string;
  deliveryZoneId: string;
  promoCode?: string;
  items: CreateOrderItemPayload[];
};

export type OrderRecord = {
  id: string;
  orderNumber: string;
  customerId: string;
  status: string;
  addressId: string | null;
  deliveryZoneId: string;
  promoCodeId: string | null;
  discountAmount: string;
  subtotal: string;
  deliveryFee: string;
  totalAmount: string;
  deliveryContactName: string;
  deliveryPhone: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryState: string;
  deliveryNotes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OrderItemRecord = {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
};

export type PaymentRecord = {
  id: string;
  orderId: string;
  status: "PENDING" | "UPLOADED" | "VERIFIED" | "REJECTED";
  amount: string;
  proofImageUrl: string | null;
  verifiedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
};

export type CreatedOrderResponse = {
  order: OrderRecord;
  orderItems: OrderItemRecord[];
  payment: PaymentRecord;
};