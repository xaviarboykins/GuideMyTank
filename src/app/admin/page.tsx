import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

async function getAdminCounts() {
  const supabase = await createClient();
  const [careGuides, articles, images] = await Promise.all([
    supabase.from("care_guides").select("id", { count: "exact", head: true }),
    supabase.from("articles").select("id", { count: "exact", head: true }),
    supabase.from("content_images").select("id", { count: "exact", head: true }),
  ]);

  return [
    { label: "Care Guides", value: careGuides.count ?? 0, href: "/admin/care-guides" },
    { label: "Articles", value: articles.count ?? 0, href: "/admin/articles" },
    { label: "Content images", value: images.count ?? 0, href: "/admin/images" },
  ];
}

export default async function AdminDashboardPage() {
  const counts = await getAdminCounts();
  return (
    <section>
      <h2 className="text-xl font-semibold">Dashboard</h2>
      <p className="mt-1 text-sm text-muted-foreground">Create and maintain structured GuideMyTank content.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {counts.map((item) => (
          <Link key={item.href} href={item.href} className="border border-border bg-card p-5 hover:bg-muted/50">
            <p className="text-sm text-muted-foreground">{item.label}</p>
            <p className="mt-2 text-3xl font-bold">{item.value}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

