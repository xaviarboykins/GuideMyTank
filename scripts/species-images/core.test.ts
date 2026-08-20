import { describe, expect, it } from "vitest";

import {
  canSourceThisMonth,
  expectedImagePath,
  fetchWithRetry,
  MAX_BATCH_SIZE,
  normalizeSpeciesSlug,
  selectEligibleSpecies,
  successfulRunsInMonth,
  type Candidate,
  type SourcingRun,
} from "./core";

describe("species image workflow controls", () => {
  it("normalizes and validates canonical paths", () => {
    expect(normalizeSpeciesSlug(" Neon_Tetra ")).toBe("neon-tetra");
    expect(expectedImagePath("neon-tetra")).toBe("/species/neon-tetra.webp");
    expect(() => expectedImagePath("Neon Tetra")).toThrow();
  });

  it("selects deterministically, excludes existing and unresolved work, and caps batches", () => {
    const species = Array.from({ length: 15 }, (_, index) => ({
      slug: `fish-${String(index).padStart(2, "0")}`,
      common_name: `Fish ${index}`,
    })).reverse();
    const candidates = [{ slug: "fish-01", status: "unresolved" }] as Candidate[];
    const selected = selectEligibleSpecies({ species, productionSlugs: new Set(["fish-00"]), candidates });
    expect(selected).toHaveLength(MAX_BATCH_SIZE);
    expect(selected.map((item) => item.slug).slice(0, 2)).toEqual(["fish-02", "fish-03"]);
    expect(() => selectEligibleSpecies({ species, productionSlugs: new Set(), candidates: [], limit: 11 })).toThrow();
  });

  it("counts only successful nonempty runs in the current UTC month", () => {
    const runs = [
      { status: "successful", successfulCandidates: 2, completedAt: "2026-08-01T00:00:00Z" },
      { status: "zero-success", successfulCandidates: 0, completedAt: "2026-08-02T00:00:00Z" },
      { status: "dry-run", successfulCandidates: 0, completedAt: "2026-08-03T00:00:00Z" },
      { status: "successful", successfulCandidates: 1, completedAt: "2026-07-31T23:59:59Z" },
    ] as SourcingRun[];
    expect(successfulRunsInMonth(runs, new Date("2026-08-19T12:00:00Z"))).toBe(1);
    expect(canSourceThisMonth([...runs, ...runs.slice(0, 1), ...runs.slice(0, 1)], new Date("2026-08-19T12:00:00Z"))).toBe(false);
  });

  it("retries rate limits with bounded exponential delays", async () => {
    const responses = [
      new Response(null, { status: 429 }),
      new Response(null, { status: 503 }),
      new Response("ok", { status: 200 }),
    ];
    const originalFetch = globalThis.fetch;
    const delays: number[] = [];
    globalThis.fetch = async () => responses.shift()!;
    try {
      const response = await fetchWithRetry("https://example.test/image", undefined, {
        baseDelayMs: 100,
        sleep: async (milliseconds) => { delays.push(milliseconds); },
      });
      expect(response.status).toBe(200);
      expect(delays).toEqual([100, 200]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("returns a final rate-limit response after the retry budget", async () => {
    const originalFetch = globalThis.fetch;
    let attempts = 0;
    globalThis.fetch = async () => { attempts += 1; return new Response(null, { status: 429 }); };
    try {
      const response = await fetchWithRetry("https://example.test/image", undefined, {
        maxAttempts: 3,
        sleep: async () => undefined,
      });
      expect(response.status).toBe(429);
      expect(attempts).toBe(3);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
