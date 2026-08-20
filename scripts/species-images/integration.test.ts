import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "gmt-species-images-"));
const validPath = path.join(temporaryDirectory, "valid.webp");
const opaquePath = path.join(temporaryDirectory, "opaque.webp");
const nonSquarePath = path.join(temporaryDirectory, "non-square.webp");
const letterboxedPath = path.join(temporaryDirectory, "letterboxed.webp");

beforeAll(async () => {
  await sharp({ create: { width: 1200, height: 1200, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: { create: { width: 800, height: 400, channels: 4, background: { r: 20, g: 120, b: 180, alpha: 1 } } }, left: 200, top: 400 }])
    .webp().toFile(validPath);
  await sharp({ create: { width: 1200, height: 1200, channels: 3, background: { r: 255, g: 255, b: 255 } } }).webp().toFile(opaquePath);
  await sharp({ create: { width: 1200, height: 800, channels: 3, background: { r: 30, g: 80, b: 110 } } }).webp().toFile(nonSquarePath);
  await sharp({ create: { width: 1200, height: 1200, channels: 3, background: { r: 24, g: 32, b: 42 } } })
    .composite([{ input: { create: { width: 1200, height: 700, channels: 3, background: { r: 35, g: 150, b: 90 } } }, left: 0, top: 250 }])
    .webp().toFile(letterboxedPath);
});

afterAll(() => fs.rmSync(temporaryDirectory, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }));

function validate(filePath: string) {
  try {
    execFileSync(process.execPath, ["--no-warnings", "--experimental-strip-types", "scripts/species-images/cli.ts", "validate", filePath], { cwd: process.cwd(), stdio: "pipe" });
    return 0;
  } catch (error) {
    return (error as { status?: number }).status ?? 1;
  }
}

describe("species image validation integration", () => {
  it("accepts a representative compliant asset", () => expect(validate(validPath)).toBe(0));
  it("accepts an opaque square WebP with a background", () => expect(validate(opaquePath)).toBe(0));
  it("rejects a non-square WebP", () => expect(validate(nonSquarePath)).not.toBe(0));
  it("rejects an opaque image with opposing solid letterbox bars", () => expect(validate(letterboxedPath)).not.toBe(0));

  it("prepares an opaque landscape photo as an edge-to-edge square crop", async () => {
    const fixture = path.join(temporaryDirectory, "prepare-landscape");
    fs.mkdirSync(fixture, { recursive: true });
    const source = path.join(fixture, "landscape.jpg");
    await sharp({ create: { width: 1600, height: 900, channels: 3, background: { r: 30, g: 130, b: 190 } } })
      .jpeg().toFile(source);
    const output = execFileSync(process.execPath, [
      "--no-warnings", "--experimental-strip-types",
      path.resolve("scripts/species-images/cli.ts"), "prepare", source, "landscape-fish",
    ], { cwd: fixture, encoding: "utf8" });
    const prepared = path.join(fixture, "assets/species-candidates/landscape-fish/prepared.webp");
    const inspection = JSON.parse(output);
    expect(fs.existsSync(prepared)).toBe(true);
    expect([inspection.width, inspection.height]).toEqual([1200, 1200]);
    expect(inspection.solidPadding).toBeNull();
  });

  it("applies an approved and rejected batch without publishing the rejected image", async () => {
    const fixture = path.join(temporaryDirectory, "batch-review");
    const writeJson = (relativePath: string, value: unknown) => {
      const target = path.join(fixture, relativePath);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
    };
    fs.mkdirSync(path.join(fixture, "public/species"), { recursive: true });
    fs.mkdirSync(path.join(fixture, "assets/species-candidates/alpha-fish"), { recursive: true });
    await sharp({ create: { width: 1200, height: 1200, channels: 3, background: { r: 40, g: 90, b: 130 } } })
      .webp().toFile(path.join(fixture, "assets/species-candidates/alpha-fish/prepared.webp"));
    const candidate = (slug: string, preparedAssetPath: string) => ({
      id: `${slug}-1`, slug, status: "ready-for-review", source: "Wikimedia Commons",
      sourceUrl: "https://commons.wikimedia.org/example", creator: "Creator", license: "CC0",
      licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/", attribution: "Creator",
      commercialUseReviewed: false, modificationsReviewed: false, rightsReviewer: "",
      rightsReviewedAt: null, reviewNotes: "Automated", sourceAssetPath: `assets/${slug}.jpg`,
      preparedAssetPath, sourcedAt: "2026-08-01T00:00:00Z",
    });
    writeJson("data/images/species-image-assets.json", {});
    writeJson("data/images/species-image-sources.json", {});
    writeJson("data/images/species-image-candidates.json", { schemaVersion: 1, candidates: [
      candidate("alpha-fish", "assets/species-candidates/alpha-fish/prepared.webp"),
      candidate("beta-fish", "assets/species-candidates/beta-fish/prepared.webp"),
    ] });
    writeJson("data/images/species-image-runs.json", { schemaVersion: 1, runs: [{
      id: "run-1", startedAt: "2026-08-01T00:00:00Z", completedAt: "2026-08-01T00:01:00Z",
      dryRun: false, successfulCandidates: 2, status: "successful", slugs: ["alpha-fish", "beta-fish"],
    }] });
    writeJson("data/images/species-image-review.json", {
      schemaVersion: 1, batchRunId: "run-1", rightsConfirmed: true,
      approved: ["alpha-fish"], rejected: { "beta-fish": "Poor image" }, replacements: [],
    });

    execFileSync(process.execPath, [
      "--no-warnings", "--experimental-strip-types",
      path.resolve("scripts/species-images/cli.ts"), "apply-review", "Test Reviewer",
    ], { cwd: fixture, stdio: "pipe" });

    expect(fs.existsSync(path.join(fixture, "public/species/alpha-fish.webp"))).toBe(true);
    expect(fs.existsSync(path.join(fixture, "public/species/beta-fish.webp"))).toBe(false);
    const manifest = JSON.parse(fs.readFileSync(path.join(fixture, "data/images/species-image-candidates.json"), "utf8"));
    expect(manifest.candidates.map((item: { status: string }) => item.status)).toEqual(["published", "rejected"]);
    expect(manifest.candidates[0].rightsReviewer).toBe("Test Reviewer");
    expect(manifest.candidates[1].reviewNotes).toBe("Poor image");
  });
});
