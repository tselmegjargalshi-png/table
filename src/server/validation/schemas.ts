import { z } from "zod";

const phone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, ""))
  .refine((v) => /^\+?\d{8,12}$/.test(v), "Утасны дугаараа зөв оруулна уу.");

export const emailSchema = z.string().trim().toLowerCase().email("Имэйл хаягаа зөв оруулна уу.");
export const passwordSchema = z
  .string()
  .min(8, "Нууц үг хамгийн багадаа 8 тэмдэгт байна.")
  .max(100, "Нууц үг хэт урт байна.");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Нууц үгээ оруулна уу."),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Нэрээ оруулна уу.").max(80),
  email: emailSchema,
  phone: phone.optional().or(z.literal("").transform(() => undefined)),
  password: passwordSchema,
  accountType: z.enum(["owner", "customer"]),
});

export const forgotSchema = z.object({ email: emailSchema });
export const resetSchema = z.object({ token: z.string().min(20), password: passwordSchema });

export const cartLineSchema = z.object({
  itemId: z.string().min(1),
  quantity: z.number().int().min(1, "Тоо ширхэг буруу байна.").max(50, "Нэг удаад 50-аас олныг захиалах боломжгүй."),
  optionIds: z.array(z.string()).max(20).default([]),
  removed: z.array(z.string().max(60)).max(20).default([]),
  note: z.string().trim().max(200).optional(),
});

export const placeOrderSchema = z
  .object({
    type: z.enum(["DINE_IN", "TAKEAWAY", "DELIVERY"]),
    tableCode: z.string().max(64).optional(),
    tableNumber: z.number().int().positive().optional(),
    customerName: z.string().trim().max(80).optional(),
    customerPhone: phone.optional().or(z.literal("").transform(() => undefined)),
    deliveryAddress: z.string().trim().max(300).optional(),
    note: z.string().trim().max(300).optional(),
    paymentMethod: z.enum(["CASH", "CARD", "QPAY", "DEMO"]).default("CASH"),
    lines: z.array(cartLineSchema).min(1, "Сагс хоосон байна.").max(60),
  })
  .superRefine((v, ctx) => {
    if (v.type === "DINE_IN" && !v.tableCode && !v.tableNumber) {
      ctx.addIssue({ code: "custom", path: ["tableNumber"], message: "Ширээний дугаараа оруулна уу." });
    }
    if (v.type === "DELIVERY") {
      if (!v.deliveryAddress || v.deliveryAddress.length < 5)
        ctx.addIssue({ code: "custom", path: ["deliveryAddress"], message: "Хүргэлтийн хаягаа дэлгэрэнгүй оруулна уу." });
      if (!v.customerPhone)
        ctx.addIssue({ code: "custom", path: ["customerPhone"], message: "Хүргэлтийн үед утасны дугаар заавал шаардлагатай." });
    }
    if (v.type === "TAKEAWAY" && !v.customerName) {
      ctx.addIssue({ code: "custom", path: ["customerName"], message: "Захиалга авах нэрээ оруулна уу." });
    }
  });

export const orderStatusSchema = z.object({
  status: z.enum(["NEW", "CONFIRMED", "PREPARING", "READY", "DELIVERED", "CANCELLED"]),
  reason: z.string().trim().max(200).optional(),
});

export const optionSchema = z.object({
  id: z.string().optional(),
  kind: z.enum(["OPTION", "ADDON"]),
  groupName: z.string().trim().max(40).optional().nullable(),
  name: z.string().trim().min(1, "Сонголтын нэрийг оруулна уу.").max(60),
  priceDelta: z.number().int().min(0).max(1_000_000),
  isDefault: z.boolean().default(false),
});

export const menuItemSchema = z.object({
  categoryId: z.string().min(1, "Ангилал сонгоно уу."),
  name: z.string().trim().min(1, "Бүтээгдэхүүний нэрийг оруулна уу.").max(80),
  description: z.string().trim().max(300).optional().nullable(),
  price: z.number().int("Үнийг бүхэл тоогоор оруулна уу.").min(0, "Үнэ сөрөг байж болохгүй.").max(10_000_000),
  imageUrl: z.string().max(300).optional().nullable(),
  artKey: z.string().max(30).optional().nullable(),
  ingredients: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  isAvailable: z.boolean().default(true),
  isPopular: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  prepMinutes: z.number().int().min(1).max(180).default(10),
  options: z.array(optionSchema).max(30).default([]),
});

export const menuItemPatchSchema = z.object({
  price: z.number().int().min(0).max(10_000_000).optional(),
  isAvailable: z.boolean().optional(),
  isPopular: z.boolean().optional(),
});

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Ангиллын нэрийг оруулна уу.").max(40),
  description: z.string().trim().max(200).optional().nullable(),
  isVisible: z.boolean().default(true),
});

export const reorderSchema = z.object({ ids: z.array(z.string()).min(1).max(200) });

export const tableSchema = z.object({
  number: z.number().int().min(1, "Ширээний дугаар 1-ээс их байна.").max(999),
  seats: z.number().int().min(1).max(40),
  zone: z.string().trim().min(1).max(40).default("Үндсэн танхим"),
  shape: z.enum(["ROUND", "SQUARE", "RECT"]).default("SQUARE"),
  posX: z.number().int().min(0).max(100).default(0),
  posY: z.number().int().min(0).max(100).default(0),
});

export const tableStatusSchema = z.object({
  status: z.enum(["FREE", "RESERVED", "SEATED", "ORDERED", "AWAITING_PAYMENT"]),
  guestName: z.string().trim().max(80).optional().nullable(),
});

export const reservationSchema = z.object({
  name: z.string().trim().min(2, "Захиалагчийн нэрийг оруулна уу.").max(80),
  phone,
  partySize: z.number().int().min(1, "Хүний тоо 1-ээс их байна.").max(60, "Ийм олон хүний захиалгыг утсаар баталгаажуулна уу."),
  startsAt: z.coerce.date({ message: "Огноо, цагаа сонгоно уу." }),
  durationMin: z.number().int().min(30).max(360).default(90),
  tableId: z.string().optional().nullable(),
  note: z.string().trim().max(300).optional().nullable(),
});

export const reservationStatusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "ARRIVED", "CANCELLED"]),
  tableId: z.string().optional().nullable(),
});

export const publicReservationSchema = reservationSchema.omit({ tableId: true, durationMin: true });

export const customerSchema = z.object({
  name: z.string().trim().min(1, "Нэрийг оруулна уу.").max(80),
  phone,
  email: z.string().trim().email("Имэйл хаягаа зөв оруулна уу.").optional().or(z.literal("")).nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
});

const hours = z.object({
  day: z.number().int().min(0).max(6),
  open: z.string().regex(/^\d{2}:\d{2}$/),
  close: z.string().regex(/^\d{2}:\d{2}$/),
  closed: z.boolean(),
});

export const restaurantSettingsSchema = z.object({
  name: z.string().trim().min(2, "Рестораны нэрийг оруулна уу.").max(80),
  tagline: z.string().trim().max(120).optional().nullable(),
  description: z.string().trim().max(500).optional().nullable(),
  address: z.string().trim().max(200).optional().nullable(),
  district: z.string().trim().max(60).optional().nullable(),
  phone: z.string().trim().max(30).optional().nullable(),
  email: z.string().trim().max(120).optional().nullable(),
  brandColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Өнгөний кодыг #RRGGBB хэлбэрээр оруулна уу."),
  serviceFeePercent: z.number().int().min(0).max(30),
  deliveryFee: z.number().int().min(0).max(100_000),
  allowDineIn: z.boolean(),
  allowTakeaway: z.boolean(),
  allowDelivery: z.boolean(),
  acceptingOrders: z.boolean(),
  openingHours: z.array(hours).length(7),
});

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Холбоос хамгийн багадаа 3 тэмдэгт байна.")
  .max(40)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Зөвхөн латин жижиг үсэг, тоо, зураас ашиглана уу.");

export const onboardingRestaurantSchema = z.object({
  name: z.string().trim().min(2, "Рестораны нэрийг оруулна уу.").max(80),
  slug: slugSchema,
  address: z.string().trim().max(200).optional().nullable(),
  phone: z.string().trim().max(30).optional().nullable(),
  tagline: z.string().trim().max(120).optional().nullable(),
  serviceFeePercent: z.number().int().min(0).max(30).default(0),
});

export const onboardingCategoriesSchema = z.object({
  categories: z.array(z.string().trim().min(1).max(40)).min(1, "Хамгийн багадаа нэг ангилал нэмнэ үү.").max(30),
});

export const onboardingProductsSchema = z.object({
  products: z
    .array(
      z.object({
        categoryId: z.string(),
        name: z.string().trim().min(1, "Нэрийг оруулна уу.").max(80),
        price: z.number().int().min(0).max(10_000_000),
        description: z.string().trim().max(300).optional().nullable(),
      }),
    )
    .min(1, "Хамгийн багадаа нэг бүтээгдэхүүн нэмнэ үү.")
    .max(100),
});

export const onboardingTablesSchema = z.object({
  count: z.number().int().min(0).max(120),
  seats: z.number().int().min(1).max(20).default(4),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Нэрээ оруулна уу.").max(80),
  phone: z
    .string()
    .trim()
    .regex(/^[+\d][\d\s-]{6,19}$/, "Утасны дугаараа зөв оруулна уу."),
  email: z.string().trim().email("Имэйл хаягаа зөв оруулна уу.").max(120).optional().or(z.literal("").transform(() => undefined)),
  restaurant: z.string().trim().max(120).optional(),
  message: z.string().trim().max(1000).optional(),
});
