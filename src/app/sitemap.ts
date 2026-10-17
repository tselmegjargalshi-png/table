import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/urls";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = appUrl();
  const entries: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/register`, changeFrequency: "yearly", priority: 0.6 },
    { url: `${base}/login`, changeFrequency: "yearly", priority: 0.3 },
  ];
  try {
    const restaurants = await db.restaurant.findMany({ where: { onboardingStep: { gte: 7 } }, select: { slug: true, updatedAt: true }, take: 5000 });
    for (const r of restaurants) entries.push({ url: `${base}/r/${r.slug}`, lastModified: r.updatedAt, changeFrequency: "daily", priority: 0.7 });
  } catch {
    /* өгөгдлийн сан түр хүрэхгүй бол үндсэн хуудсуудыг л буцаана */
  }
  return entries;
}
