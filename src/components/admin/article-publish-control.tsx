"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import type { ValidationIssue } from "@/lib/content/types";

type PublishState = { ok: boolean; message: string; issues: ValidationIssue[] };

export function ArticlePublishControl({ action }: { action: (state: PublishState) => Promise<PublishState> }) {
  const [state, formAction, pending] = useActionState(action, { ok: false, message: "", issues: [] });
  return <div><form action={formAction}><Button type="submit" disabled={pending}>{pending ? "Checking…" : "Publish article"}</Button></form>{state.message ? <div role="status" className={`mt-3 border p-3 text-sm ${state.ok ? "border-green-700/40 bg-green-500/10" : "border-destructive/40 bg-destructive/10"}`}><p className="font-medium">{state.message}</p>{state.issues.length ? <ul className="mt-2 list-disc space-y-1 pl-5">{state.issues.map((issue) => <li key={`${issue.field}-${issue.code}`}>{issue.message}</li>)}</ul> : null}</div> : null}</div>;
}
