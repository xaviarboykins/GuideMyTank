import { NextResponse } from "next/server";

import { getAdminUser } from "@/lib/auth/admin";
import { generateSeoHealthReport } from "@/lib/seo/health/report";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const report = await generateSeoHealthReport();
  return NextResponse.json(report, {
    headers: { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, noarchive" },
  });
}
