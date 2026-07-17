"use client";

import { useTransition } from "react";

import { deleteCareGuideDraftAction } from "@/app/admin/care-guides/actions";
import { Button } from "@/components/ui/button";

export function DeleteCareGuideDraftButton({ id, title }: { id: string; title: string }) {
  const [pending, startTransition] = useTransition();

  function deleteDraft() {
    if (!window.confirm(`Delete the draft “${title}”? This cannot be undone.`)) return;
    startTransition(() => deleteCareGuideDraftAction(id));
  }

  return <Button type="button" size="sm" variant="outline" disabled={pending} onClick={deleteDraft}>{pending ? "Deleting…" : "Delete draft"}</Button>;
}

