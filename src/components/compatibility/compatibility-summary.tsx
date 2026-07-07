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

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-md border bg-muted/30 p-4">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Score
            </p>
            <p className="mt-2 text-3xl font-bold">{compatibility.score}</p>
          </div>

          <div className="rounded-md border bg-muted/30 p-4">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Status
            </p>
            <p className="mt-3">
              <CompatibilityBadge compatibility={compatibility.compatibility} />
            </p>
          </div>

          <div className="rounded-md border bg-muted/30 p-4">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Confidence
            </p>
            <p className="mt-2 text-3xl font-bold">
              {Math.round((compatibility.confidence ?? 0) * 100)}%
            </p>
          </div>
        </div>

        {compatibility.notes && (
          <div className="mt-6 rounded-md border bg-muted/40 p-4">
            <p className="text-sm leading-7">{compatibility.notes}</p>
          </div>
        )}

        <div className="mt-6">
          <h3 className="font-semibold">Key Reasons</h3>

          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-muted-foreground">
            {compatibility.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      </div>

      <aside className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold">Species Profiles</h2>

        <div className="mt-4 flex flex-col gap-2 text-sm">
          <Link
            href={`/species/${compatibility.species_a.slug}`}
            className="underline-offset-4 hover:underline"
          >
            {compatibility.species_a.common_name} Species Profile
          </Link>

          <Link
            href={`/species/${compatibility.species_b.slug}`}
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

          <Link
            href="/compatibility/disclaimer"
            className="underline-offset-4 hover:underline"
          >
            Compatibility Disclaimer
          </Link>
        </div>
      </aside>
    </section>
  );
}
