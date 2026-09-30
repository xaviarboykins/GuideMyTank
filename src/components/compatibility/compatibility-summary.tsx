import Link from "next/link";

import { CompatibilityBadge } from "@/components/compatibility/compatibility-badge";
import { ExpertValidationBadge } from "@/components/compatibility/expert-validation-badge";
import type {
  CompatibilityFinding,
  CompatibilityReport,
} from "@/lib/data/compatibility";

type CompatibilitySummaryProps = {
  report: CompatibilityReport;
};

function FactorList({
  emptyMessage,
  factors,
}: {
  emptyMessage: string;
  factors: CompatibilityFinding[];
}) {
  if (factors.length === 0) {
    return <p className="mt-3 text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
      {factors.map((factor) => (
        <li key={factor.code}>{factor.message}</li>
      ))}
    </ul>
  );
}

function verdictLabel(verdict: CompatibilityReport["result"]["verdict"]) {
  if (verdict === "recommended") return "Recommended";
  if (verdict === "conditional") return "Conditional";
  return "Not recommended";
}

export function CompatibilitySummary({ report }: CompatibilitySummaryProps) {
  const compatibility = report.result;

  return (
    <section className="mt-8 border-y bg-card">
      <div className="grid gap-6 py-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Planning verdict
            </p>
            <CompatibilityBadge compatibility={compatibility.compatibility} />
            <ExpertValidationBadge expertValidated={compatibility.expertValidated} />
          </div>

          <h2 className="mt-3 text-3xl font-bold tracking-tight">
            {verdictLabel(compatibility.verdict)}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
            {compatibility.recommendation}
          </p>

          {report.expertNotes ? (
            <p className="mt-4 border-l-4 border-primary pl-4 text-sm leading-6">
              <strong>Expert note:</strong> {report.expertNotes}
            </p>
          ) : null}
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-l pl-6 text-sm lg:grid-cols-1">
          <div>
            <dt className="text-muted-foreground">Data confidence</dt>
            <dd className="font-semibold capitalize">{compatibility.dataConfidence}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Assessment source</dt>
            <dd className="font-semibold">
              {report.source === "expert-override" ? "Expert override" : "Structured data model"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Data completeness</dt>
            <dd className="font-semibold">
              {compatibility.confidence == null
                ? "Unavailable"
                : `${Math.round(compatibility.confidence * 100)}%`}
            </dd>
          </div>
        </dl>
      </div>

      <div className="grid border-t md:grid-cols-3 md:divide-x">
        <section className="py-6 md:pr-6">
          <h3 className="font-semibold">Blocking risks</h3>
          <FactorList
            factors={report.factors.blockingRisks}
            emptyMessage="No automatic safety blocker was found."
          />
        </section>
        <section className="py-6 md:px-6">
          <h3 className="font-semibold">Conditions and cautions</h3>
          <FactorList
            factors={report.factors.conditions}
            emptyMessage="No additional conditional requirements were identified."
          />
        </section>
        <section className="py-6 md:pl-6">
          <h3 className="font-semibold">Supporting factors</h3>
          <FactorList
            factors={report.factors.supportingFactors}
            emptyMessage="The available data does not establish supporting factors."
          />
        </section>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-2 border-t py-4 text-sm">
        <Link href={`/species/${compatibility.species_a.slug}`} className="underline-offset-4 hover:underline">
          {compatibility.species_a.common_name} profile
        </Link>
        <Link href={`/species/${compatibility.species_b.slug}`} className="underline-offset-4 hover:underline">
          {compatibility.species_b.common_name} profile
        </Link>
        <Link href="/compatibility/disclaimer" className="underline-offset-4 hover:underline">
          Methodology and limitations
        </Link>
      </div>
    </section>
  );
}
