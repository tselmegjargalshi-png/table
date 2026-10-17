import { NextResponse, type NextRequest } from "next/server";

const MENU_HOST_PREFIX = "restaurant.";

/**
 * 1. restaurant.table.mn/{slug} хаягийг дотоод /r/{slug} руу чиглүүлнэ.
 * 2. Ажилтны хэсэгт нэвтрэлтийн cookie байхгүй бол нэвтрэх хуудас руу шилжүүлнэ.
 *    (Эрхийн бүрэн шалгалтыг сервер талд хийнэ.)
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const host = request.headers.get("host") ?? "";

  if (host.startsWith(MENU_HOST_PREFIX) && !pathname.startsWith("/r/") && !pathname.startsWith("/api/")) {
    const slug = pathname.split("/").filter(Boolean)[0];
    if (slug) {
      const url = request.nextUrl.clone();
      url.pathname = `/r${pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  const protectedPath = pathname.startsWith("/app") || pathname.startsWith("/kitchen") || pathname.startsWith("/onboarding") || pathname.startsWith("/account");
  if (protectedPath && !request.cookies.has("tm_session")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|opengraph-image|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|webp|ico)$).*)"],
};
