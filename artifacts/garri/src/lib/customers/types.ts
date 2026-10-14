import type { SafeUser } from "../auth/types";

export type Customer = SafeUser;

export type CustomerListResponse = {
  data: Customer[];
  meta: { total: number; page: number; limit: number; totalPages: number };
};

export type CustomerRecentOrder = {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: string;
  createdAt: string;
};

export type CustomerDetail = {
  user: Customer;
  recentOrders: CustomerRecentOrder[];
};