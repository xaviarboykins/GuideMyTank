import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ContentFilters({ action, query, status }: { action: string; query?: string; status?: string }) {
  return (
    <form action={action} method="get" className="mt-5 flex flex-col gap-3 border border-border bg-card p-4 sm:flex-row sm:items-end">
      <label className="flex-1 space-y-1">
        <span className="text-sm font-medium">Search</span>
        <Input name="q" defaultValue={query} placeholder="Title or slug" />
      </label>
      <label className="space-y-1">
        <span className="text-sm font-medium">Status</span>
        <select name="status" defaultValue={status ?? ""} className="h-8 w-full min-w-40 rounded-lg border border-input bg-background px-2.5 text-sm">
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </label>
      <Button type="submit">Filter</Button>
      <Button variant="outline" asChild><Link href={action}>Clear</Link></Button>
    </form>
  );
}

