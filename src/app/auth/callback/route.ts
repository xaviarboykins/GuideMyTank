import { NextResponse, type NextRequest } from "next/server";

import { hasAdminRole } from "@/lib/auth/admin-role";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/auth/login?error=invalid", request.url));

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/auth/login?error=invalid", request.url));

  const { data } = await supabase.auth.getUser();
  if (!data.user || !hasAdminRole(data.user)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/auth/login?error=unauthorized", request.url));
  }

  return NextResponse.redirect(new URL("/admin", request.url));
}
