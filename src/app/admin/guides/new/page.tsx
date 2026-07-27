import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listGuideSpeciesChoices } from "@/lib/guides/repository";

import { generateGuideDraftAction } from "./actions";

export default async function NewGuidePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [species, notice] = await Promise.all([listGuideSpeciesChoices(), searchParams]);
  return <section className="max-w-3xl">
    <h2 className="text-xl font-semibold">Generate Guide Draft</h2>
    <p className="mt-2 text-sm text-muted-foreground">Choose one family. Existing Drafts regenerate in place; Published Guides receive a review proposal.</p>
    {notice.error ? <p role="alert" className="mt-4 border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{notice.error}</p> : null}
    <div className="mt-5 grid gap-5">
      <form action={generateGuideDraftAction} className="border border-border bg-card p-5"><input type="hidden" name="family" value="comparison" /><h3 className="font-semibold">Species comparison</h3><div className="mt-4 grid gap-3 md:grid-cols-2">{["speciesA", "speciesB"].map((name, index) => <label key={name} className="space-y-1"><span className="text-sm font-medium">Species {index ? "B" : "A"}</span><select name={name} className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm">{species.map((item) => <option key={item.id} value={item.slug}>{item.common_name}</option>)}</select></label>)}</div><Button className="mt-4">Generate comparison</Button></form>
      <form action={generateGuideDraftAction} className="border border-border bg-card p-5"><input type="hidden" name="family" value="tank-mates" /><h3 className="font-semibold">Tank mates</h3><div className="mt-4 grid gap-3 md:grid-cols-2"><select name="species" className="h-9 rounded-lg border border-input bg-background px-2 text-sm">{species.map((item) => <option key={item.id} value={item.slug}>{item.common_name}</option>)}</select><select name="variant" className="h-9 rounded-lg border border-input bg-background px-2 text-sm"><option value="tank-mates">Recommended tank mates</option><option value="avoid-with">Fish to avoid</option></select></div><Button className="mt-4">Generate tank-mate Guide</Button></form>
      <form action={generateGuideDraftAction} className="border border-border bg-card p-5"><input type="hidden" name="family" value="tank-size" /><h3 className="font-semibold">Tank size</h3><div className="mt-4 grid gap-3 md:grid-cols-2"><Input name="gallons" type="number" min="1" step="1" placeholder="Gallons" required /><select name="variation" className="h-9 rounded-lg border border-input bg-background px-2 text-sm"><option value="general">General</option><option value="community">Community</option></select></div><Button className="mt-4">Generate tank-size Guide</Button></form>
    </div>
    <Button asChild variant="outline" className="mt-5"><Link href="/admin/guides">Back</Link></Button>
  </section>;
}
