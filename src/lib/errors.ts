export class AppError extends Error {
  constructor(
    message: string,
    public status = 400,
    public code = "bad_request",
  ) {
    super(message);
  }
}

export const MESSAGES = {
  generic: "Мэдээлэл ачааллахад алдаа гарлаа.",
  retry: "Дахин оролдоно уу.",
  unauthorized: "Үргэлжлүүлэхийн тулд нэвтэрнэ үү.",
  forbidden: "Танд энэ үйлдлийг хийх эрх байхгүй байна.",
  notFound: "Хайсан мэдээлэл олдсонгүй.",
  soldOut: "Энэ бүтээгдэхүүн одоогоор дууссан байна.",
  invalid: "Оруулсан мэдээллээ шалгана уу.",
  rateLimited: "Хэт олон удаа оролдлоо. Түр хүлээгээд дахин оролдоно уу.",
} as const;
