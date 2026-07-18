import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchAdminSpecies } from "@/lib/care-guides/service";

import { createCareGuideDraftAction } from "./actions";

type NewCareGuidePageProps = { searchParams: Promise<{ q?: string; error?: string }> };

export default async function NewCareGuidePage({ searchParams }: NewCareGuidePageProps) {
  const { q = "", error } = await searchParams;
  const species = await searchAdminSpecies(q);

  return (
    <section>
      <h2 className="text-xl font-semibold">Create Care Guide draft</h2>
      <p className="mt-1 text-sm text-muted-foreground">A Care Guide can only be created for a species already in the GuideMyTank database.</p>
      {error ? <p role="alert" className="mt-4 border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}

      <form action="/admin/care-guides/new" method="get" className="mt-5 flex gap-2 border border-border bg-card p-4">
        <Input name="q" defaultValue={q} placeholder="Search species name or slug" />
        <Button type="submit">Search</Button>
        {q ? <Button asChild variant="outline"><Link href="/admin/care-guides/new">Clear</Link></Button> : null}
      </form>

      <div className="mt-5 overflow-x-auto border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted"><tr><th className="p-3">Common name</th><th className="p-3">Scientific name</th><th className="p-3">Slug</th><th className="p-3"><span className="sr-only">Create</span></th></tr></thead>
          <tbody>
            {species.map((item) => (
              <tr key={item.id} className="border-t border-border">
                <td className="p-3 font-medium">{item.common_name}</td>
                <td className="p-3 italic text-muted-foreground">{item.scientific_name}</td>
                <td className="p-3 text-muted-foreground">{item.slug}</td>
                <td className="p-3 text-right">
                  <form action={createCareGuideDraftAction}>
                    <input type="hidden" name="speciesId" value={item.id} />
                    <Button type="submit" size="sm">Create draft</Button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

