import { PrismaClient } from "@prisma/client";
import { seedDemo } from "../src/server/demo/seed-demo";

/** Деплойн үед: демо ресторан байхгүй бол л өгөгдөл үүсгэнэ. */
const db = new PrismaClient();

async function main() {
  const exists = await db.restaurant.findUnique({ where: { slug: "hotyn-buuz" }, select: { id: true } });
  if (exists) {
    console.log("Демо өгөгдөл аль хэдийн байна. Алгасав.");
    return;
  }
  const r = await seedDemo(db, { log: (m) => console.log(`• ${m}`) });
  console.log(`Амжилттай: ${r.orders} захиалга.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
