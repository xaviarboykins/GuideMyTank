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

beforeAll(async () => {
  await sharp({ create: { width: 1200, height: 1200, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: { create: { width: 800, height: 400, channels: 4, background: { r: 20, g: 120, b: 180, alpha: 1 } } }, left: 200, top: 400 }])
    .webp().toFile(validPath);
  await sharp({ create: { width: 1200, height: 1200, channels: 3, background: { r: 255, g: 255, b: 255 } } }).webp().toFile(opaquePath);
  await sharp({ create: { width: 1200, height: 800, channels: 3, background: { r: 30, g: 80, b: 110 } } }).webp().toFile(nonSquarePath);
});

afterAll(() => fs.rmSync(temporaryDirectory, { recursive: true, force: true }));

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
});
