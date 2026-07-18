import Link from "next/link";

import { generateSeoHealthReport } from "@/lib/seo/health/report";

export const dynamic = "force-dynamic";

export default async function SeoHealthPage() {
  const report = await generateSeoHealthReport();

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">SEO Health</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Repository and database-derived checks generated {new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(report.generatedAt))}.
          </p>
        </div>
        <Link href="/admin/seo/report" className="border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted">
          View JSON report
        </Link>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Indexable pages", report.summary.totalIndexablePages],
          ["Sitemap URLs", report.summary.totalSitemapUrls],
          ["Issues", report.summary.totalIssues],
          ["Errors", report.summary.errors],
          ["Warnings", report.summary.warnings],
        ].map(([label, value]) => (
          <div key={label} className="border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <CountTable title="Indexable page families" counts={report.pageFamilies} />
        <CountTable title="Sitemap families" counts={report.sitemapFamilies} />
      </div>

      <div className="mt-6 overflow-x-auto border border-border">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-muted"><tr><th className="p-3">Severity</th><th className="p-3">Category</th><th className="p-3">URL or record</th><th className="p-3">Finding</th><th className="p-3">Suggested action</th></tr></thead>
          <tbody>
            {report.issues.map((issue, index) => (
              <tr key={`${issue.category}-${issue.urlOrRecord}-${index}`} className="border-t border-border align-top">
                <td className="p-3 font-semibold uppercase">{issue.severity}</td><td className="p-3">{issue.category}</td><td className="break-all p-3 font-mono text-xs">{issue.urlOrRecord}</td><td className="p-3">{issue.description}</td><td className="p-3">{issue.suggestedAction}</td>
              </tr>
            ))}
            {!report.issues.length ? <tr><td colSpan={5} className="p-5 text-center text-muted-foreground">No SEO health issues detected.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CountTable({ title, counts }: { title: string; counts: Record<string, number> }) {
  return <div className="border border-border bg-card p-4"><h3 className="font-semibold">{title}</h3><dl className="mt-3 space-y-2">{Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)).map(([family, count]) => <div key={family} className="flex justify-between gap-4 border-t border-border pt-2 first:border-0 first:pt-0"><dt>{family}</dt><dd className="font-semibold tabular-nums">{count}</dd></div>)}</dl></div>;
}
