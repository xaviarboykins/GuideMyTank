import { getAdminUser } from "@/lib/auth/admin";
import { createContentImageSignedUrl } from "@/lib/content-images/service";

type AdminContentImageRouteProps = {
  params: Promise<{ path: string[] }>;
};

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: AdminContentImageRouteProps,
) {
  if (!(await getAdminUser())) {
    return new Response("Unauthorized", { status: 401 });
  }

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
    const signedUrl = await createContentImageSignedUrl(storagePath);
    const upstream = await fetch(signedUrl, { cache: "no-store" });

    if (!upstream.ok || !upstream.body) {
      return new Response("Image unavailable", { status: 404 });
    }

    return new Response(upstream.body, {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Type":
          upstream.headers.get("content-type") ?? "application/octet-stream",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Image unavailable", { status: 404 });
  }
}
