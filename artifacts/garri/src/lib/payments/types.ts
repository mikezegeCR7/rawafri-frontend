export type AdminPaymentCustomer = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

export type AdminPaymentListItem = {
  id: string;
  orderId: string;
  status: "PENDING" | "UPLOADED" | "VERIFIED" | "REJECTED";
  amount: string;
  proofImageUrl: string | null;
  verifiedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  order: {
    id: string;
    orderNumber: string;
    customer: AdminPaymentCustomer;
  };
  verifiedBy: AdminPaymentCustomer | null;
  rejectedBy: AdminPaymentCustomer | null;
};

export type MyPayment = {
  id: string;
  orderId: string;
  status: "PENDING" | "UPLOADED" | "VERIFIED" | "REJECTED";
  amount: string;
  proofImageUrl: string | null;
  verifiedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  order: {
    id: string;
    orderNumber: string;
  };
};