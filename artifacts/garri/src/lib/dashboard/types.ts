export type AdminRecentOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  status: string;
  totalAmount: number;
  createdAt: string;
};

export type AdminRecentPayment = {
  id: string;
  orderNumber: string;
  customerName: string;
  amount: number;
  status: string;
  createdAt: string;
};

export type AdminDashboard = {
  totalCustomers: number;
  totalProducts: number;
  totalOrders: number;
  pendingPayments: number;
  verifiedPayments: number;
  lowStockProducts: number;
  totalRevenue: number;
  recentOrders: AdminRecentOrder[];
  recentPayments: AdminRecentPayment[];
};