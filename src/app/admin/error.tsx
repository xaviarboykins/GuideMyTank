"use client";

import { Button } from "@/components/ui/button";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="border border-destructive/40 bg-destructive/10 p-6">
      <h2 className="font-semibold">Admin content could not be loaded</h2>
      <p className="mt-2 text-sm text-muted-foreground">Try the request again. Sensitive database details are not displayed here.</p>
      <Button type="button" variant="outline" className="mt-4" onClick={reset}>Try again</Button>
    </div>
  );
}

