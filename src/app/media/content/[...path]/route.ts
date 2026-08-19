import { createPublishedContentImageFetchUrl } from "@/lib/content-images/public";

type ContentImageRouteProps = {
  params: Promise<{ path: string[] }>;
};

export async function GET(_request: Request, { params }: ContentImageRouteProps) {
  const { path } = await params;
  const storagePath = path.join("/");

  if (
    path.length < 2 ||
    !["articles", "care-guides"].includes(path[0]) ||
    path.some((segment) => !segment || segment === "." || segment === "..")
  ) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const signedUrl = await createPublishedContentImageFetchUrl(storagePath);
    const upstream = await fetch(signedUrl, { cache: "no-store" });

    if (!upstream.ok || !upstream.body) {
      return new Response("Image unavailable", { status: 404 });
    }

    return new Response(upstream.body, {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
        "Content-Type": upstream.headers.get("content-type") ?? "application/octet-stream",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Image unavailable", { status: 404 });
  }
}
