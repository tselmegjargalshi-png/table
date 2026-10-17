import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/urls";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: ["/", "/r/"], disallow: ["/app", "/kitchen", "/onboarding", "/account", "/api/"] }],
    sitemap: `${appUrl()}/sitemap.xml`,
  };
}
