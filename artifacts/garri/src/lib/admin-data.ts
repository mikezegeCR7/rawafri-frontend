import type { OrderStatus } from "./order-data";
export type { OrderStatus };
export interface Order {
  id: string;
  /** Human-readable reference (e.g. "RAW-2026-000001") for display —
   * `id` itself is the real UUID, used for API calls. */
  orderNumber?: string;
  customer: string;
  phone: string;
  items: string;
  total: number;
  status: OrderStatus;
  date: string;
  address: string;
  payment: "paid" | "pending" | "failed";
  /** Real underlying payment record fields, for the verify/reject/reupload flow. */
  paymentId?: string;
  paymentStatus?: "PENDING" | "UPLOADED" | "VERIFIED" | "REJECTED";
  paymentProofImageUrl?: string | null;
  paymentRejectionReason?: string | null;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  stock: number;
  sold: number;
  status: "active" | "low_stock" | "out_of_stock";
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  orders: number;
  spent: number;
  joined: string;
  status: "active" | "inactive" | "flagged";
  location: string;
}

export interface Payment {
  id: string;
  orderId: string;
  customer: string;
  amount: number;
  method: string;
  status: "success" | "pending" | "failed" | "refunded";
  date: string;
  reference: string;
}

export interface Notification {
  id: string;
  type: "order" | "payment" | "complaint" | "inventory" | "system";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export interface Complaint {
  id: string;
  customer: string;
  orderId: string;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "resolved";
  date: string;
  priority: "high" | "medium" | "low";
}

export const orders: Order[] = [
  { id: "ORD-001", customer: "Chioma Okafor", phone: "08012345678", items: "Rice 50kg, Palm Oil 5L", total: 42500, status: "OUT_FOR_DELIVERY", date: "2026-06-07 09:14", address: "14 Bode Thomas, Surulere, Lagos", payment: "paid" },
  { id: "ORD-002", customer: "Emeka Nwosu", phone: "08023456789", items: "Beans 25kg, Tomatoes 10kg", total: 18750, status: "PREPARING_ORDER", date: "2026-06-07 09:32", address: "5 Awolowo Rd, Ikoyi, Lagos", payment: "paid" },
  { id: "ORD-003", customer: "Fatima Aliyu", phone: "08034567890", items: "Yam 10 tubers, Pepper 5kg", total: 27300, status: "PAYMENT_CONFIRMED", date: "2026-06-07 10:01", address: "22 Ahmadu Bello Way, Abuja", payment: "paid" },
  { id: "ORD-004", customer: "Tunde Adeyemi", phone: "08045678901", items: "Catfish 5kg, Onions 10kg", total: 14800, status: "AWAITING_PAYMENT", date: "2026-06-07 10:23", address: "8 Ring Rd, Ibadan", payment: "pending" },
  { id: "ORD-005", customer: "Ngozi Eze", phone: "08056789012", items: "Chicken 3 whole, Pepper 3kg", total: 32000, status: "DELIVERED", date: "2026-06-06 14:10", address: "3 GRA Phase 2, PH", payment: "paid" },
  { id: "ORD-006", customer: "Bala Usman", phone: "08067890123", items: "Groundnuts 20kg", total: 9500, status: "CANCELLED", date: "2026-06-06 11:45", address: "17 Zaria Rd, Kano", payment: "failed" },
  { id: "ORD-007", customer: "Adaeze Obi", phone: "08078901234", items: "Stockfish large, Palm Kernel Oil 4L", total: 36200, status: "DELIVERED", date: "2026-06-06 09:30", address: "9 Ikeja GRA, Lagos", payment: "paid" },
  { id: "ORD-008", customer: "Seun Afolabi", phone: "08089012345", items: "Ofada Rice 10kg, Crayfish 1kg", total: 21600, status: "OUT_FOR_DELIVERY", date: "2026-06-07 08:55", address: "31 Oba Akran Ave, Ikeja", payment: "paid" },
  { id: "ORD-009", customer: "Hauwa Musa", phone: "08090123456", items: "Goat meat 4kg, Tomatoes 8kg", total: 45000, status: "PREPARING_ORDER", date: "2026-06-07 11:00", address: "12 Nnamdi Azikiwe Rd, Enugu", payment: "paid" },
  { id: "ORD-010", customer: "Rotimi Williams", phone: "08001234567", items: "Tilapia 3kg, Onions 5kg, Pepper 2kg", total: 16400, status: "PAYMENT_CONFIRMED", date: "2026-06-07 11:30", address: "6 Abeokuta Expressway, Lagos", payment: "paid" },
];

export const products: Product[] = [
  { id: "PRD-001", name: "Nigerian Parboiled Rice", category: "Grains", price: 680, unit: "per kg", stock: 4200, sold: 12800, status: "active" },
  { id: "PRD-002", name: "Ofada Rice", category: "Grains", price: 950, unit: "per kg", stock: 840, sold: 4200, status: "active" },
  { id: "PRD-003", name: "Black-eyed Beans (Oloyin)", category: "Legumes", price: 550, unit: "per kg", stock: 1600, sold: 7300, status: "active" },
  { id: "PRD-004", name: "White Honey Beans", category: "Legumes", price: 620, unit: "per kg", stock: 210, sold: 3100, status: "low_stock" },
  { id: "PRD-005", name: "Yellow Yam (Puna)", category: "Tubers", price: 800, unit: "per tuber", stock: 650, sold: 5400, status: "active" },
  { id: "PRD-006", name: "Sweet Potatoes", category: "Tubers", price: 350, unit: "per kg", stock: 0, sold: 2200, status: "out_of_stock" },
  { id: "PRD-007", name: "Rodo (Tatashe)", category: "Vegetables", price: 480, unit: "per kg", stock: 320, sold: 8900, status: "active" },
  { id: "PRD-008", name: "Scotch Bonnet Pepper", category: "Vegetables", price: 520, unit: "per kg", stock: 185, sold: 11200, status: "low_stock" },
  { id: "PRD-009", name: "Red Onions", category: "Vegetables", price: 310, unit: "per kg", stock: 780, sold: 9600, status: "active" },
  { id: "PRD-010", name: "Red Palm Oil (Unrefined)", category: "Oils", price: 1800, unit: "per litre", stock: 940, sold: 6700, status: "active" },
  { id: "PRD-011", name: "Groundnut Oil", category: "Oils", price: 1500, unit: "per litre", stock: 0, sold: 3400, status: "out_of_stock" },
  { id: "PRD-012", name: "Catfish (Clarias)", category: "Seafood", price: 2800, unit: "per kg", stock: 120, sold: 4100, status: "low_stock" },
  { id: "PRD-013", name: "Mackerel (Titus)", category: "Seafood", price: 1600, unit: "per kg", stock: 340, sold: 5800, status: "active" },
  { id: "PRD-014", name: "Large Stockfish", category: "Seafood", price: 4500, unit: "per piece", stock: 55, sold: 1900, status: "low_stock" },
  { id: "PRD-015", name: "Live Broiler Chicken", category: "Livestock", price: 6500, unit: "per bird", stock: 280, sold: 3200, status: "active" },
  { id: "PRD-016", name: "Goat (Medium Size)", category: "Livestock", price: 55000, unit: "per head", stock: 42, sold: 620, status: "active" },
  { id: "PRD-017", name: "Crayfish (Dried)", category: "Seafood", price: 3200, unit: "per kg", stock: 410, sold: 7100, status: "active" },
  { id: "PRD-018", name: "Tomatoes (Roma)", category: "Vegetables", price: 290, unit: "per kg", stock: 900, sold: 14200, status: "active" },
];

export const customers: Customer[] = [
  { id: "CUS-001", name: "Chioma Okafor", phone: "08012345678", email: "chioma@email.com", orders: 24, spent: 386000, joined: "2025-01-15", status: "active", location: "Lagos" },
  { id: "CUS-002", name: "Emeka Nwosu", phone: "08023456789", email: "emeka@email.com", orders: 18, spent: 291500, joined: "2025-02-20", status: "active", location: "Abuja" },
  { id: "CUS-003", name: "Fatima Aliyu", phone: "08034567890", email: "fatima@email.com", orders: 31, spent: 512300, joined: "2024-11-05", status: "active", location: "Abuja" },
  { id: "CUS-004", name: "Tunde Adeyemi", phone: "08045678901", email: "tunde@email.com", orders: 7, spent: 89400, joined: "2025-05-10", status: "active", location: "Ibadan" },
  { id: "CUS-005", name: "Ngozi Eze", phone: "08056789012", email: "ngozi@email.com", orders: 42, spent: 748900, joined: "2024-09-01", status: "active", location: "Port Harcourt" },
  { id: "CUS-006", name: "Bala Usman", phone: "08067890123", email: "bala@email.com", orders: 3, spent: 24500, joined: "2025-06-01", status: "flagged", location: "Kano" },
  { id: "CUS-007", name: "Adaeze Obi", phone: "08078901234", email: "adaeze@email.com", orders: 29, spent: 441200, joined: "2025-01-30", status: "active", location: "Enugu" },
  { id: "CUS-008", name: "Seun Afolabi", phone: "08089012345", email: "seun@email.com", orders: 15, spent: 178600, joined: "2025-03-14", status: "active", location: "Lagos" },
  { id: "CUS-009", name: "Hauwa Musa", phone: "08090123456", email: "hauwa@email.com", orders: 0, spent: 0, joined: "2025-06-06", status: "inactive", location: "Kano" },
  { id: "CUS-010", name: "Rotimi Williams", phone: "08001234567", email: "rotimi@email.com", orders: 11, spent: 156800, joined: "2025-04-02", status: "active", location: "Lagos" },
];

export const payments: Payment[] = [
  { id: "PAY-001", orderId: "ORD-001", customer: "Chioma Okafor", amount: 42500, method: "Bank Transfer", status: "success", date: "2026-06-07 09:13", reference: "BNK_REF_7823AB" },
  { id: "PAY-002", orderId: "ORD-002", customer: "Emeka Nwosu", amount: 18750, method: "Bank Transfer", status: "success", date: "2026-06-07 09:30", reference: "BNK_REF_9012CD" },
  { id: "PAY-003", orderId: "ORD-003", customer: "Fatima Aliyu", amount: 27300, method: "Bank Transfer", status: "success", date: "2026-06-07 09:58", reference: "BNK_REF_1234EF" },
  { id: "PAY-004", orderId: "ORD-004", customer: "Tunde Adeyemi", amount: 14800, method: "Bank Transfer", status: "pending", date: "2026-06-07 10:20", reference: "BNK_REF_5678GH" },
  { id: "PAY-005", orderId: "ORD-005", customer: "Ngozi Eze", amount: 32000, method: "Bank Transfer", status: "success", date: "2026-06-06 14:08", reference: "BNK_REF_3456IJ" },
  { id: "PAY-006", orderId: "ORD-006", customer: "Bala Usman", amount: 9500, method: "Bank Transfer", status: "failed", date: "2026-06-06 11:42", reference: "BNK_REF_7890KL" },
  { id: "PAY-007", orderId: "ORD-007", customer: "Adaeze Obi", amount: 36200, method: "Bank Transfer", status: "success", date: "2026-06-06 09:28", reference: "BNK_REF_2345MN" },
  { id: "PAY-008", orderId: "ORD-008", customer: "Seun Afolabi", amount: 21600, method: "Bank Transfer", status: "success", date: "2026-06-07 08:52", reference: "BNK_REF_6789OP" },
  { id: "PAY-009", orderId: "ORD-009", customer: "Hauwa Musa", amount: 45000, method: "Bank Transfer", status: "success", date: "2026-06-07 10:55", reference: "BNK_REF_0123QR" },
  { id: "PAY-010", orderId: "ORD-010", customer: "Rotimi Williams", amount: 16400, method: "Bank Transfer", status: "success", date: "2026-06-07 11:28", reference: "BNK_REF_4567ST" },
];

export const notifications: Notification[] = [
  { id: "NTF-001", type: "order", title: "New Order Received", message: "ORD-010 from Rotimi Williams — ₦16,400", time: "2 mins ago", read: false },
  { id: "NTF-002", type: "payment", title: "Payment Failed", message: "ORD-006 — Bala Usman's card payment of ₦9,500 failed", time: "18 mins ago", read: false },
  { id: "NTF-003", type: "inventory", title: "Low Stock Alert", message: "Scotch Bonnet Pepper — only 185kg remaining", time: "1 hr ago", read: false },
  { id: "NTF-004", type: "inventory", title: "Out of Stock", message: "Groundnut Oil — 0 units. Restock required urgently", time: "2 hrs ago", read: false },
  { id: "NTF-005", type: "complaint", title: "New Complaint", message: "Customer Bala Usman reported wrong item delivered", time: "3 hrs ago", read: true },
  { id: "NTF-006", type: "order", title: "Order Delivered", message: "ORD-005 delivered to Ngozi Eze — Port Harcourt", time: "4 hrs ago", read: true },
  { id: "NTF-007", type: "system", title: "Daily Report Ready", message: "Revenue report for June 6 is now available", time: "5 hrs ago", read: true },
  { id: "NTF-008", type: "inventory", title: "Low Stock Alert", message: "White Honey Beans — 210kg left (threshold: 250kg)", time: "6 hrs ago", read: true },
];

export const complaints: Complaint[] = [
  { id: "CMP-001", customer: "Bala Usman", orderId: "ORD-006", subject: "Wrong item delivered", message: "I ordered groundnuts but received crayfish. Please resolve immediately.", status: "open", date: "2026-06-06 12:30", priority: "high" },
  { id: "CMP-002", customer: "Tunde Adeyemi", orderId: "ORD-004", subject: "Delayed delivery", message: "My order has been pending for 3 hours with no update.", status: "in_progress", date: "2026-06-07 11:00", priority: "medium" },
  { id: "CMP-003", customer: "Emeka Nwosu", orderId: "ORD-002", subject: "Damaged goods", message: "The tomatoes delivered were already spoiled.", status: "resolved", date: "2026-06-05 09:15", priority: "medium" },
];

export const revenueData = [
  { day: "Mon", revenue: 284500, orders: 48 },
  { day: "Tue", revenue: 312000, orders: 55 },
  { day: "Wed", revenue: 198000, orders: 34 },
  { day: "Thu", revenue: 445000, orders: 72 },
  { day: "Fri", revenue: 521000, orders: 89 },
  { day: "Sat", revenue: 687000, orders: 115 },
  { day: "Sun", revenue: 394000, orders: 63 },
];

export const customerGrowthData = [
  { month: "Jan", customers: 1240 },
  { month: "Feb", customers: 1480 },
  { month: "Mar", customers: 1820 },
  { month: "Apr", customers: 2100 },
  { month: "May", customers: 2410 },
  { month: "Jun", customers: 2680 },
];

export const categoryData = [
  { name: "Grains & Cereals", value: 34 },
  { name: "Vegetables", value: 28 },
  { name: "Seafood", value: 18 },
  { name: "Livestock", value: 11 },
  { name: "Oils", value: 9 },
];

export const formatNaira = (amount: number) =>
  `₦${amount.toLocaleString("en-NG")}`;

export const statusColors: Record<OrderStatus, string> = {
  ORDER_RECEIVED: "bg-slate-100 text-slate-600",
  AWAITING_PAYMENT: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  PAYMENT_CONFIRMED: "bg-blue-50 text-blue-600",
  PREPARING_ORDER: "bg-amber-50 text-amber-600",
  OUT_FOR_DELIVERY: "bg-orange-50 text-orange-600",
  AWAITING_CUSTOMER_CONFIRMATION: "bg-purple-50 text-purple-700 ring-1 ring-purple-300",
  DELIVERED: "bg-green-50 text-green-700",
  CANCELLED: "bg-red-50 text-red-600",
};

export const statusLabels: Record<OrderStatus, string> = {
  ORDER_RECEIVED: "Order Received",
  AWAITING_PAYMENT: "Awaiting Payment",
  PAYMENT_CONFIRMED: "Payment Confirmed",
  PREPARING_ORDER: "Preparing",
  OUT_FOR_DELIVERY: "Out for Delivery",
  AWAITING_CUSTOMER_CONFIRMATION: "Awaiting Confirmation",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};