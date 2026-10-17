export function appUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
    "http://localhost:3000";
  return url.replace(/\/$/, "");
}

/**
 * Үйлчлүүлэгчийн менюгийн холбоос.
 * MENU_BASE_URL=https://restaurant.table.mn гэж тохируулбал https://restaurant.table.mn/hotyn-buuz хэлбэртэй болно.
 */
export function menuUrl(slug: string, tableCode?: string): string {
  const base = process.env.NEXT_PUBLIC_MENU_BASE_URL?.replace(/\/$/, "");
  const path = base ? `${base}/${slug}` : `${appUrl()}/r/${slug}`;
  return tableCode ? `${path}?t=${tableCode}` : path;
}
