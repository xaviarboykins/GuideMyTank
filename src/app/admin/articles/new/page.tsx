import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createArticleDraftAction } from "./actions";

export default async function NewArticlePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <section className="max-w-2xl border border-border bg-card p-6"><h2 className="text-xl font-semibold">Create Article Draft</h2><p className="mt-2 text-sm text-muted-foreground">Start with a title. Images are optional for articles.</p>{error ? <p role="alert" className="mt-4 border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}<form action={createArticleDraftAction} className="mt-5 space-y-4"><label className="block space-y-1"><span className="text-sm font-medium">Working title</span><Input name="title" defaultValue="Untitled Article" required /></label><div className="flex gap-2"><Button type="submit">Create draft</Button><Button asChild variant="outline"><Link href="/admin/articles">Cancel</Link></Button></div></form></section>;
}
