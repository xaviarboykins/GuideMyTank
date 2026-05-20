import Link from "next/link";

import { CompatibilityBadge } from "@/components/compatibility/compatibility-badge";
import type { CompatibilityResult } from "@/lib/data/compatibility";

type CompatibilitySummaryProps = {
  compatibility: CompatibilityResult;
};

export function CompatibilitySummary({
  compatibility,
}: CompatibilitySummaryProps) {
  return (
    <section className="mt-8 grid gap-6 lg:grid-cols-3">
      <div className="rounded-lg border bg-card p-6 lg:col-span-2">
        <h2 className="text-xl font-semibold">Compatibility Result</h2>

        <div className="mt-4 flex items-center gap-3">
          <CompatibilityBadge compatibility={compatibility.compatibility} />

          <span className="text-sm text-muted-foreground">
            Confidence: {Math.round((compatibility.confidence ?? 0) * 100)}%
          </span>
        </div>

        {compatibility.notes && (
          <div className="mt-6 rounded-md border bg-muted/40 p-4">
            <p className="text-sm leading-7">{compatibility.notes}</p>
          </div>
        )}
      </div>

      <aside className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold">Quick Links</h2>

        <div className="mt-4 flex flex-col gap-2 text-sm">
          <Link
            href={`/piscidex/${compatibility.species_a.slug}`}
            className="underline-offset-4 hover:underline"
          >
            {compatibility.species_a.common_name} Species Profile
          </Link>

          <Link
            href={`/piscidex/${compatibility.species_b.slug}`}
            className="underline-offset-4 hover:underline"
          >
            {compatibility.species_b.common_name} Species Profile
          </Link>

          <Link
            href="/compatibility"
            className="underline-offset-4 hover:underline"
          >
            Browse More Compatibility Pairs
          </Link>
        </div>
      </aside>
    </section>
  );
}
