export type NotificationType = "ORDER_STATUS" | "PAYMENT" | "SYSTEM";

export type AdminNotification = {
  id: string;
  userId: string;
  type: NotificationType;
  orderId: string | null;
  title: string;
  message: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
};

export type ComplaintStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export type AdminComplaint = {
  id: string;
  customerId: string;
  orderId: string | null;
  subject: string;
  message: string;
  status: ComplaintStatus;
  adminResponse: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  order?: { id: string; orderNumber: string } | null;
  customer?: { id: string; firstName: string; lastName: string; email: string } | null;
};

export type UpdateComplaintPayload = {
  status?: ComplaintStatus;
  adminResponse?: string;
};