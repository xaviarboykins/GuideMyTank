import { NextResponse, type NextRequest } from "next/server";

import { refreshAuthSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const [, basePath, speciesA, speciesB] = request.nextUrl.pathname.split("/");

  if (basePath === "admin" || basePath === "auth") {
    return refreshAuthSession(request);
  }

  if (basePath !== "compatibility" || !speciesA || !speciesB) {
    return NextResponse.next();
  }

  const [canonicalSpeciesA, canonicalSpeciesB] = [speciesA, speciesB].sort();

  if (canonicalSpeciesA === speciesA && canonicalSpeciesB === speciesB) {
    return NextResponse.next();
  }

  const canonicalUrl = request.nextUrl.clone();
  canonicalUrl.pathname = `/compatibility/${canonicalSpeciesA}/${canonicalSpeciesB}`;

  return NextResponse.redirect(canonicalUrl, 308);
}

export const config = {
  matcher: ["/admin/:path*", "/auth/:path*", "/compatibility/:speciesA/:speciesB"],
};
