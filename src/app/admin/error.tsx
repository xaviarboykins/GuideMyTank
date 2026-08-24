"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Admin route error", error);
  }, [error]);

  return (
    <div className="border border-destructive/40 bg-destructive/10 p-6">
      <h2 className="font-semibold">Admin content could not be loaded</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        The editor encountered a server or data-loading error. Try again once. If it continues, use the reference below when checking the deployment logs.
      </p>
      {error.digest ? (
        <p className="mt-3 font-mono text-xs text-muted-foreground">
          Error reference: {error.digest}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={reset}>Try again</Button>
        <Button asChild variant="outline"><Link href="/admin/content">Back to content</Link></Button>
        <Button asChild variant="outline"><Link href="/admin">Admin dashboard</Link></Button>
      </div>
    </div>
  );
}

