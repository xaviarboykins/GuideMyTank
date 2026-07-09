/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require("fs");
const Module = require("module");
const path = require("path");
const ts = require("typescript");

const rootDir = path.resolve(__dirname, "..");
const sourceDir = path.join(rootDir, "src");
const matrixPath = path.join(rootDir, "data", "compatibility", "test-matrix.json");
const speciesPath = path.join(rootDir, "data", "import", "species.master.json");

const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function resolveFilename(request, parent, isMain, options) {
  if (request.startsWith("@/")) {
    return originalResolveFilename.call(
      this,
      path.join(sourceDir, request.slice(2)),
      parent,
      isMain,
      options,
    );
  }

  return originalResolveFilename.call(this, request, parent, isMain, options);
};

require.extensions[".ts"] = function compileTypeScript(module, filename) {
  const source = fs.readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
      resolveJsonModule: true,
    },
    fileName: filename,
  });

  module._compile(output.outputText, filename);
};

const { calculateCompatibility } = require("../src/lib/compatibility/engine.ts");

const matrix = JSON.parse(fs.readFileSync(matrixPath, "utf8"));
const speciesPayload = JSON.parse(fs.readFileSync(speciesPath, "utf8"));
const speciesRecords = speciesPayload.species || speciesPayload;
const speciesBySlug = new Map(
  speciesRecords.map((species) => [species.slug, species]),
);

let failures = 0;
const caseCount = Object.values(matrix).reduce(
  (total, cases) => total + cases.length,
  0,
);
const minimumCaseCount = Math.ceil(speciesRecords.length * 0.25);

if (caseCount < minimumCaseCount) {
  failures += 1;
  console.error(
    `Compatibility matrix has ${caseCount} cases; expected at least ${minimumCaseCount} for ${speciesRecords.length} species.`,
  );
}

for (const [group, cases] of Object.entries(matrix)) {
  for (const testCase of cases) {
    const [slugA, slugB] = testCase.species;
    const speciesA = speciesBySlug.get(slugA);
    const speciesB = speciesBySlug.get(slugB);

    if (!speciesA || !speciesB) {
      failures += 1;
      console.error(`Missing species for ${group}: ${slugA} + ${slugB}`);
      continue;
    }

    const result = calculateCompatibility(speciesA, speciesB);

    if (!testCase.expected.includes(result.compatibility)) {
      failures += 1;
      console.error(
        [
          `${group}: ${slugA} + ${slugB}`,
          `  expected: ${testCase.expected.join(" or ")}`,
          `  received: ${result.compatibility} (${result.score}, ${result.status})`,
          `  reasons: ${result.reasons.join(" | ")}`,
        ].join("\n"),
      );
    } else {
      console.log(
        `${group}: ${slugA} + ${slugB} -> ${result.compatibility} (${result.score})`,
      );
    }
  }
}

if (failures > 0) {
  console.error(`Compatibility matrix failed with ${failures} issue(s).`);
  process.exit(1);
}

console.log("Compatibility matrix passed.");
