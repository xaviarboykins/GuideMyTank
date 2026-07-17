import Link from "next/link";

import { ContentFilters } from "@/components/admin/content-filters";
import { ContentStatus } from "@/components/admin/content-status";
import { DeleteCareGuideDraftButton } from "@/components/admin/delete-care-guide-draft-button";
import { Button } from "@/components/ui/button";
import { listAdminCareGuides } from "@/lib/care-guides/service";

type AdminCareGuidesPageProps = {
  searchParams: Promise<{ q?: string; status?: string; deleted?: string; error?: string }>;
};

export default async function AdminCareGuidesPage({ searchParams }: AdminCareGuidesPageProps) {
  const { q, status, deleted, error } = await searchParams;
  const guides = await listAdminCareGuides(q, status);

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="text-xl font-semibold">Care Guides</h2><p className="mt-1 text-sm text-muted-foreground">Structured content associated with existing species records.</p></div>
        <Button asChild><Link href="/admin/care-guides/new">Create Care Guide</Link></Button>
      </div>
      <ContentFilters action="/admin/care-guides" query={q} status={status} />
      {deleted ? <p role="status" className="mt-4 border border-green-700/40 bg-green-500/10 p-3 text-sm">{deleted}</p> : null}
      {error ? <p role="alert" className="mt-4 border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}

      {guides.length === 0 ? (
        <div className="mt-5 border border-border bg-card p-8 text-center"><h3 className="font-semibold">No Care Guides found</h3><p className="mt-2 text-sm text-muted-foreground">Create a draft or adjust the filters.</p></div>
      ) : (
        <div className="mt-5 overflow-x-auto border border-border">
          <table className="w-full min-w-3xl text-left text-sm">
            <thead className="bg-muted"><tr><th className="p-3">Title</th><th className="p-3">Species</th><th className="p-3">Status</th><th className="p-3">Updated</th><th className="p-3"><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {guides.map((guide) => (
                <tr key={guide.id} className="border-t border-border">
                  <td className="p-3"><p className="font-medium">{guide.title ?? "Untitled Care Guide"}</p><p className="text-xs text-muted-foreground">{guide.slug ?? "No slug"}</p></td>
                  <td className="p-3">{guide.species?.common_name ?? "Unknown species"}</td>
                  <td className="p-3"><ContentStatus status={guide.status} /></td>
                  <td className="p-3 text-muted-foreground">{new Date(guide.updated_at).toLocaleDateString("en-US")}</td>
                  <td className="p-3"><div className="flex justify-end gap-2"><Button asChild size="sm" variant="outline"><Link href={`/admin/care-guides/${guide.id}`}>Edit</Link></Button>{guide.status === "draft" ? <DeleteCareGuideDraftButton id={guide.id} title={guide.title ?? "Untitled Care Guide"} /> : null}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
