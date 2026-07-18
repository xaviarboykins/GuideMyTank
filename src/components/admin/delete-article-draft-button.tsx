"use client";

import { useTransition } from "react";
import { deleteArticleDraftAction } from "@/app/admin/articles/actions";
import { Button } from "@/components/ui/button";

export function DeleteArticleDraftButton({ id, title }: { id: string; title: string }) {
  const [pending, startTransition] = useTransition();
  return <Button size="sm" variant="outline" disabled={pending} onClick={() => { if (window.confirm(`Delete the draft “${title}”? This cannot be undone.`)) startTransition(() => deleteArticleDraftAction(id)); }}>{pending ? "Deleting…" : "Delete"}</Button>;
}
