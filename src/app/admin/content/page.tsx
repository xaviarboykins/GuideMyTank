import Link from "next/link";

export default function AdminContentPage() {
  return (
    <section>
      <h2 className="text-xl font-semibold">Content workflows</h2>
      <p className="mt-1 text-sm text-muted-foreground">Care Guides and articles remain separate editing and publishing workflows.</p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Link href="/admin/care-guides" className="border border-border bg-card p-5 hover:bg-muted/50">
          <h3 className="font-semibold">Care Guides</h3>
          <p className="mt-2 text-sm text-muted-foreground">Species-linked structured guides with strict image and source requirements.</p>
        </Link>
        <Link href="/admin/articles" className="border border-border bg-card p-5 hover:bg-muted/50">
          <h3 className="font-semibold">Articles</h3>
          <p className="mt-2 text-sm text-muted-foreground">Flexible ordered educational content; images remain optional.</p>
        </Link>
      </div>
    </section>
  );
}

