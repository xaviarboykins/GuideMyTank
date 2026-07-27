import Link from "next/link";

import { ContentFilters } from "@/components/admin/content-filters";
import { ContentStatus } from "@/components/admin/content-status";
import { Button } from "@/components/ui/button";
import { listAdminGuides } from "@/lib/guides/repository";
import type { Json } from "@/types/database.types";

import { applyGuideProposalAction } from "./actions";

function proposalHash(value: Json | null) {
  if (!value || Array.isArray(value) || typeof value !== "object") return null;
  return typeof value.proposalHash === "string" ? value.proposalHash : null;
}

export default async function AdminGuidesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; saved?: string; error?: string }>;
}) {
  const notice = await searchParams;
  const guides = await listAdminGuides(notice.q, notice.status);

  return <section>
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><h2 className="text-xl font-semibold">Programmatic Guides</h2><p className="mt-1 text-sm text-muted-foreground">Structured-data drafts using the shared Article publishing workflow.</p></div>
      <Button asChild><Link href="/admin/guides/new">Generate Guide Draft</Link></Button>
    </div>
    <ContentFilters action="/admin/guides" query={notice.q} status={notice.status} />
    {notice.saved ? <p role="status" className="mt-4 border border-green-700/40 bg-green-500/10 p-3 text-sm">{notice.saved}</p> : null}
    {notice.error ? <p role="alert" className="mt-4 border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{notice.error}</p> : null}
    <div className="mt-5 overflow-x-auto border border-border">
      <table className="w-full min-w-4xl text-left text-sm">
        <thead className="bg-muted"><tr><th className="p-3">Title</th><th className="p-3">Family</th><th className="p-3">Status</th><th className="p-3">Regeneration</th><th className="p-3"><span className="sr-only">Actions</span></th></tr></thead>
        <tbody>{guides.map((guide) => <tr key={guide.article_id} className="border-t border-border">
          <td className="p-3"><p className="font-medium">{guide.articles.title}</p><p className="text-xs text-muted-foreground">{guide.generation_key}</p></td>
          <td className="p-3">{guide.guide_family.replaceAll("_", " ")}</td>
          <td className="p-3"><ContentStatus status={guide.articles.status} /></td>
          <td className="p-3"><p>{guide.regeneration_status.replaceAll("_", " ")}</p>{guide.requires_regeneration ? <p className="text-xs text-amber-700">Review required</p> : null}</td>
          <td className="p-3"><div className="flex justify-end gap-2"><Button asChild size="sm" variant="outline"><Link href={`/admin/articles/${guide.article_id}`}>Edit</Link></Button>{proposalHash(guide.pending_generation) ? <form action={applyGuideProposalAction.bind(null, guide.article_id, proposalHash(guide.pending_generation)!)} className="text-left">{guide.articles.status === "published" ? <label className="mb-2 flex max-w-48 items-start gap-2 text-xs"><input name="confirmPublishedToDraft" type="checkbox" required />Move Published Guide back to Draft</label> : null}<Button size="sm" type="submit">Apply proposal</Button></form> : null}</div></td>
        </tr>)}</tbody>
      </table>
      {!guides.length ? <p className="p-8 text-center text-sm text-muted-foreground">No Guides found.</p> : null}
    </div>
  </section>;
}
