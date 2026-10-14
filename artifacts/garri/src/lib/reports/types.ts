export type SalesReport = {
  totalRevenue: number;
  totalOrders: number;
  verifiedPayments: number;
  pendingPayments: number;
  rejectedPayments: number;
  averageOrderValue: number;
};

export type OrdersReport = {
  totalOrders: number;
  receivedOrders: number;
  awaitingPayment: number;
  paymentConfirmed: number;
  preparingOrders: number;
  outForDelivery: number;
  awaitingCustomerConfirmation: number;
  deliveredOrders: number;
  cancelledOrders: number;
};

export type ProductsReport = {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
};

export type CustomersReport = {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
};

export type PaymentsReport = {
  totalPayments: number;
  pendingPayments: number;
  verifiedPayments: number;
  rejectedPayments: number;
  totalVerifiedAmount: number;
};