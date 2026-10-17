import type {
  OrderStatus,
  OrderType,
  PaymentMethod,
  ReservationStatus,
  StaffRole,
  TableStatus,
} from "@prisma/client";

export type Tone = "neutral" | "accent" | "info" | "warning" | "success" | "danger" | "muted";

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: Tone }> = {
  NEW: { label: "Шинэ", tone: "accent" },
  CONFIRMED: { label: "Баталгаажсан", tone: "info" },
  PREPARING: { label: "Бэлтгэж байна", tone: "warning" },
  READY: { label: "Бэлэн", tone: "success" },
  DELIVERED: { label: "Хүргэгдсэн", tone: "neutral" },
  CANCELLED: { label: "Цуцлагдсан", tone: "danger" },
};

export const ORDER_STATUS_FLOW: OrderStatus[] = ["NEW", "CONFIRMED", "PREPARING", "READY", "DELIVERED"];

/** Ажилтны дараагийн алхмын товч */
export const ORDER_NEXT_ACTION: Partial<Record<OrderStatus, { to: OrderStatus; label: string }>> = {
  NEW: { to: "CONFIRMED", label: "Баталгаажуулах" },
  CONFIRMED: { to: "PREPARING", label: "Бэлтгэж эхлэх" },
  PREPARING: { to: "READY", label: "Бэлэн болгох" },
  READY: { to: "DELIVERED", label: "Хүргэсэн" },
};

/** Үйлчлүүлэгчид харагдах алхмууд */
export const CUSTOMER_STEPS = [
  { key: "received", label: "Захиалга хүлээн авсан", statuses: ["NEW", "CONFIRMED"] as OrderStatus[] },
  { key: "preparing", label: "Бэлтгэж байна", statuses: ["PREPARING"] as OrderStatus[] },
  { key: "ready", label: "Бэлэн болсон", statuses: ["READY"] as OrderStatus[] },
  { key: "serving", label: "Үйлчилж байна", statuses: ["DELIVERED"] as OrderStatus[] },
];

export const ORDER_TYPE: Record<OrderType, { label: string; short: string }> = {
  DINE_IN: { label: "Ширээн дээрээс", short: "Ширээ" },
  TAKEAWAY: { label: "Аваад явах", short: "Авч явах" },
  DELIVERY: { label: "Хүргэлт", short: "Хүргэлт" },
};

export const TABLE_STATUS: Record<TableStatus, { label: string; tone: Tone }> = {
  FREE: { label: "Сул", tone: "success" },
  RESERVED: { label: "Захиалгатай", tone: "info" },
  SEATED: { label: "Суусан", tone: "warning" },
  ORDERED: { label: "Захиалга өгсөн", tone: "accent" },
  AWAITING_PAYMENT: { label: "Төлбөр хүлээгдэж байна", tone: "danger" },
};

export const RESERVATION_STATUS: Record<ReservationStatus, { label: string; tone: Tone }> = {
  PENDING: { label: "Хүлээгдэж байна", tone: "warning" },
  CONFIRMED: { label: "Баталгаажсан", tone: "info" },
  ARRIVED: { label: "Ирсэн", tone: "success" },
  CANCELLED: { label: "Цуцлагдсан", tone: "danger" },
};

export const STAFF_ROLE: Record<StaffRole, string> = {
  OWNER: "Эзэмшигч",
  MANAGER: "Менежер",
  WAITER: "Зөөгч",
  KITCHEN: "Тогооч",
  CASHIER: "Кассчин",
};

export const PAYMENT_METHOD: Record<PaymentMethod, string> = {
  CASH: "Бэлэн мөнгө",
  CARD: "Карт",
  QPAY: "QPay",
  SOCIALPAY: "SocialPay",
  DEMO: "Туршилтын төлбөр",
};
