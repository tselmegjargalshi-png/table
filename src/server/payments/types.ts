import type { PaymentMethod, PaymentStatus } from "@prisma/client";

export type PaymentIntentInput = {
  orderId: string;
  orderNumber: number;
  amount: number;
  restaurantName: string;
};

export type PaymentIntentResult = {
  status: PaymentStatus;
  providerRef: string | null;
  /** Үйлчлүүлэгчийг шилжүүлэх эсвэл QR-аар харуулах холбоос (жишээ нь QPay invoice) */
  checkoutUrl?: string | null;
};

/**
 * Төлбөрийн үйлчилгээ үзүүлэгчийн нийтлэг интерфэйс.
 * Жинхэнэ QPay, SocialPay, карт холбохдоо энэ интерфэйсийг хэрэгжүүлж, registry-д бүртгэнэ.
 */
export interface PaymentProvider {
  readonly id: string;
  readonly methods: PaymentMethod[];
  createIntent(input: PaymentIntentInput): Promise<PaymentIntentResult>;
  /** Webhook эсвэл callback-аар ирсэн мэдээллийг баталгаажуулна */
  verify(providerRef: string): Promise<PaymentStatus>;
}
