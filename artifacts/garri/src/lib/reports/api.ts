import { customFetch } from "@workspace/api-client-react";
import type {
  CustomersReport,
  OrdersReport,
  PaymentsReport,
  ProductsReport,
  SalesReport,
} from "./types";

export function getSalesReport() {
  return customFetch<SalesReport>("/api/v1/reports/sales", { method: "GET" });
}

export function getOrdersReport() {
  return customFetch<OrdersReport>("/api/v1/reports/orders", { method: "GET" });
}

export function getProductsReport() {
  return customFetch<ProductsReport>("/api/v1/reports/products", { method: "GET" });
}

export function getCustomersReport() {
  return customFetch<CustomersReport>("/api/v1/reports/customers", { method: "GET" });
}

export function getPaymentsReport() {
  return customFetch<PaymentsReport>("/api/v1/reports/payments", { method: "GET" });
}