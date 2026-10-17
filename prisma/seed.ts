import { PrismaClient } from "@prisma/client";
import { seedDemo } from "../src/server/demo/seed-demo";

const db = new PrismaClient();

seedDemo(db, { log: (m) => console.log(`• ${m}`) })
  .then(async (r) => {
    console.log(`Амжилттай: ${r.orders} захиалга.`);
    await db.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
