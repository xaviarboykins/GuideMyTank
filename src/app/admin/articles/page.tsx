import Link from "next/link";

import { ContentFilters } from "@/components/admin/content-filters";
import { ContentStatus } from "@/components/admin/content-status";
import { DeleteArticleDraftButton } from "@/components/admin/delete-article-draft-button";
import { Button } from "@/components/ui/button";
import { listAdminArticles } from "@/lib/articles/service";

type AdminArticlesPageProps = { searchParams: Promise<{ q?: string; status?: string; error?: string; deleted?: string }> };

export default async function AdminArticlesPage({ searchParams }: AdminArticlesPageProps) {
  const { q, status, error, deleted } = await searchParams;
  const articles = await listAdminArticles(q, status);

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="text-xl font-semibold">Articles</h2><p className="mt-1 text-sm text-muted-foreground">Flexible educational content with optional images.</p></div>
        <Button asChild><Link href="/admin/articles/new">Create Article</Link></Button>
      </div>
      <ContentFilters action="/admin/articles" query={q} status={status} />
      {deleted ? <p role="status" className="mt-4 border border-green-700/40 bg-green-500/10 p-3 text-sm">{deleted}</p> : null}
      {error ? <p role="alert" className="mt-4 border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}

      {articles.length === 0 ? (
        <div className="mt-5 border border-border bg-card p-8 text-center"><h3 className="font-semibold">No articles found</h3><p className="mt-2 text-sm text-muted-foreground">Create a draft or adjust the filters.</p></div>
      ) : (
        <div className="mt-5 overflow-x-auto border border-border">
          <table className="w-full min-w-3xl text-left text-sm">
            <thead className="bg-muted"><tr><th className="p-3">Title</th><th className="p-3">Status</th><th className="p-3">Updated</th><th className="p-3"><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {articles.map((article) => (
                <tr key={article.id} className="border-t border-border">
                  <td className="p-3"><p className="font-medium">{article.title ?? "Untitled Article"}</p><p className="text-xs text-muted-foreground">{article.slug ?? "No slug"}</p></td>
                  <td className="p-3"><ContentStatus status={article.status} /></td>
                  <td className="p-3 text-muted-foreground">{new Date(article.updated_at).toLocaleDateString("en-US")}</td>
                  <td className="p-3"><div className="flex justify-end gap-2"><Button asChild size="sm" variant="outline"><Link href={`/admin/articles/${article.id}`}>Edit</Link></Button>{article.status === "draft" ? <DeleteArticleDraftButton id={article.id} title={article.title ?? "Untitled Article"} /> : null}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
