"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";

import { CompatibilityBadge } from "@/components/compatibility/compatibility-badge";
import { Button } from "@/components/ui/button";
import type {
  CompatibilityResult,
  CompatibilitySpecies,
} from "@/lib/compatibility/types";

type CompatibilityCheckerProps = {
  species: CompatibilitySpecies[];
  initialSpeciesA?: string;
  initialSpeciesB?: string;
};

function getSimplifiedCompatibility(status: CompatibilityResult["status"]) {
  if (status === "Caution") {
    return "caution";
  }

  if (status === "Incompatible") {
    return "incompatible";
  }

  return "compatible";
}

export function CompatibilityChecker({
  species,
  initialSpeciesA = "",
  initialSpeciesB = "",
}: CompatibilityCheckerProps) {
  const [speciesA, setSpeciesA] = useState(initialSpeciesA);
  const [speciesB, setSpeciesB] = useState(initialSpeciesB);
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const selectedSpeciesA = useMemo(
    () => species.find((item) => item.slug === speciesA),
    [species, speciesA],
  );

  const selectedSpeciesB = useMemo(
    () => species.find((item) => item.slug === speciesB),
    [species, speciesB],
  );

  useEffect(() => {
    if (!speciesA || !speciesB) {
      setResult(null);
      setError("");
      return;
    }

    if (speciesA === speciesB) {
      setResult(null);
      setError("Choose two different species to compare.");
      return;
    }

    const controller = new AbortController();

    startTransition(async () => {
      setError("");

      try {
        const response = await fetch(
          `/api/compatibility?speciesA=${encodeURIComponent(
            speciesA,
          )}&speciesB=${encodeURIComponent(speciesB)}`,
          { signal: controller.signal },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Unable to compare these species.");
        }

        setResult(data);

        const params = new URLSearchParams(window.location.search);
        params.set("speciesA", speciesA);
        params.set("speciesB", speciesB);

        window.history.replaceState(null, "", `/compatibility?${params}`);
      } catch (fetchError) {
        if (
          fetchError instanceof DOMException &&
          fetchError.name === "AbortError"
        ) {
          return;
        }

        setResult(null);
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Unable to compare these species.",
        );
      }
    });

    return () => controller.abort();
  }, [speciesA, speciesB]);

  function handleSwapSpecies() {
    setSpeciesA(speciesB);
    setSpeciesB(speciesA);
  }

  function handleReset() {
    setSpeciesA("");
    setSpeciesB("");
    setResult(null);
    setError("");
    window.history.replaceState(null, "", "/compatibility");
  }

  return (
    <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="rounded-lg border bg-card p-6">
        <div>
          <h2 className="text-xl font-semibold">Compare Species</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Pick two aquarium species to estimate tank mate compatibility using
            temperament, size, water parameters, schooling needs, and predation
            risk.
          </p>
        </div>

        <div className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-medium">
            Species A
            <select
              value={speciesA}
              onChange={(event) => setSpeciesA(event.target.value)}
              className="h-10 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">Select a species</option>
              {species.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.common_name}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleSwapSpecies}
              disabled={!speciesA && !speciesB}
            >
              Swap Species
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={handleReset}
              disabled={!speciesA && !speciesB}
            >
              Reset
            </Button>
          </div>

          <label className="grid gap-2 text-sm font-medium">
            Species B
            <select
              value={speciesB}
              onChange={(event) => setSpeciesB(event.target.value)}
              className="h-10 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">Select a species</option>
              {species.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.common_name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6">
        {!speciesA || !speciesB ? (
          <div className="flex min-h-80 flex-col justify-center rounded-lg border border-dashed bg-background p-6 text-center">
            <h2 className="text-xl font-semibold">Ready to compare</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Select two species to see a compatibility score, status,
              reasoning, confidence, and quick profile links.
            </p>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
            <h2 className="font-semibold text-destructive">
              Compatibility unavailable
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          </div>
        ) : isPending && !result ? (
          <div className="flex min-h-80 items-center justify-center rounded-lg border border-dashed bg-background p-6 text-sm text-muted-foreground">
            Checking compatibility...
          </div>
        ) : result ? (
          <div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Compatibility Result
                </p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight">
                  {result.status}
                </h2>
              </div>

              <CompatibilityBadge
                compatibility={getSimplifiedCompatibility(result.status)}
              />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border bg-background p-4">
                <p className="text-sm text-muted-foreground">Score</p>
                <p className="mt-2 text-3xl font-bold">{result.score}</p>
              </div>

              <div className="rounded-lg border bg-background p-4">
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="mt-2 font-semibold">{result.status}</p>
              </div>

              <div className="rounded-lg border bg-background p-4">
                <p className="text-sm text-muted-foreground">Confidence</p>
                <p className="mt-2 font-semibold">
                  {result.confidence === null
                    ? "Not available"
                    : `${Math.round(result.confidence * 100)}%`}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-lg border bg-background p-4">
              <h3 className="font-semibold">Why this result?</h3>

              <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                {result.reasons.map((reason) => (
                  <li key={reason}>• {reason}</li>
                ))}
              </ul>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {selectedSpeciesA ? (
                <Link
                  href={`/species/${selectedSpeciesA.slug}`}
                  className="rounded-lg border bg-background p-4 text-sm font-medium hover:bg-muted"
                >
                  View {selectedSpeciesA.common_name} profile
                </Link>
              ) : null}

              {selectedSpeciesB ? (
                <Link
                  href={`/species/${selectedSpeciesB.slug}`}
                  className="rounded-lg border bg-background p-4 text-sm font-medium hover:bg-muted"
                >
                  View {selectedSpeciesB.common_name} profile
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
