import crypto from "node:crypto";
import type { PaymentMethod } from "@prisma/client";
import type { PaymentProvider } from "./types";

/** Бэлэн мөнгө, картыг кассанд хүлээн авна: ажилтан "Төлбөр авсан" дармагц PAID болно. */
export const counterProvider: PaymentProvider = {
  id: "counter",
  methods: ["CASH", "CARD"],
  async createIntent() {
    return { status: "PENDING", providerRef: null };
  },
  async verify() {
    return "PENDING";
  },
};

/**
 * Туршилтын онлайн төлбөр. Жинхэнэ гүйлгээ хийхгүй, зөвхөн демо зориулалттай.
 * QPay холбохдоо `qpayProvider`-ийг ижил хэлбэрээр хэрэгжүүлж,
 * QPAY_CLIENT_ID / QPAY_CLIENT_SECRET орчны хувьсагчаар идэвхжүүлнэ.
 */
export const demoOnlineProvider: PaymentProvider = {
  id: "demo",
  methods: ["DEMO", "QPAY"],
  async createIntent(input) {
    const ref = `demo_${input.orderNumber}_${crypto.randomBytes(6).toString("hex")}`;
    return { status: "PAID", providerRef: ref, checkoutUrl: null };
  },
  async verify() {
    return "PAID";
  },
};

export function resolveProvider(method: PaymentMethod): PaymentProvider {
  if (counterProvider.methods.includes(method)) return counterProvider;
  if (method === "QPAY" && process.env.QPAY_CLIENT_ID) {
    // Жинхэнэ QPay холболт хийгдсэн үед энд qpayProvider буцаана.
    throw new Error("QPay холболт хараахан хэрэгжээгүй байна.");
  }
  return demoOnlineProvider;
}
