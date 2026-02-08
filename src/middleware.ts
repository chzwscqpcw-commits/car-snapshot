import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CANONICAL_HOST = "www.freeplatecheck.co.uk";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";

  // Redirect .com (any variant) and non-www .co.uk to canonical domain
  if (host !== CANONICAL_HOST) {
    const isNonCanonical =
      host === "freeplatecheck.com" ||
      host === "www.freeplatecheck.com" ||
      host === "freeplatecheck.co.uk";

    if (isNonCanonical) {
      const url = new URL(request.url);
      url.host = CANONICAL_HOST;
      url.protocol = "https:";
      url.port = "";
      return NextResponse.redirect(url, 301);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run on all paths except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
