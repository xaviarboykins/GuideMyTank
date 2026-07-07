import { NextResponse } from "next/server";

import { getCompatibility } from "@/lib/compatibility/service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const speciesA = searchParams.get("speciesA");
  const speciesB = searchParams.get("speciesB");

  if (!speciesA || !speciesB) {
    return NextResponse.json(
      { error: "Both speciesA and speciesB are required." },
      { status: 400 },
    );
  }

  if (speciesA === speciesB) {
    return NextResponse.json(
      { error: "Please select two different species." },
      { status: 400 },
    );
  }

  const compatibility = await getCompatibility(speciesA, speciesB);

  if (!compatibility) {
    return NextResponse.json(
      { error: "Compatibility result not found." },
      { status: 404 },
    );
  }

  return NextResponse.json(compatibility);
}
