/* eslint-disable @typescript-eslint/no-require-imports */

const { spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { loadLocalEnv } = require("./load_env_file.cjs");

const rootDir = path.resolve(__dirname, "..");
const importScript = path.join(rootDir, "scripts", "import_species.py");
const userHome = os.homedir();
loadLocalEnv(rootDir);

const bundledPython = path.join(
  userHome,
  ".cache",
  "codex-runtimes",
  "codex-primary-runtime",
  "dependencies",
  "python",
  process.platform === "win32" ? "python.exe" : "bin/python",
);

const candidates = [
  process.env.PYTHON ? { command: process.env.PYTHON, args: [] } : null,
  { command: "python", args: [] },
  { command: "python3", args: [] },
  { command: "py", args: ["-3"] },
  fs.existsSync(bundledPython) ? { command: bundledPython, args: [] } : null,
].filter(Boolean);

function runCandidate(candidate, args) {
  return spawnSync(candidate.command, [...candidate.args, ...args], {
    cwd: rootDir,
    stdio: "inherit",
    shell: false,
  });
}

let lastError = null;

for (const candidate of candidates) {
  const versionResult = spawnSync(
    candidate.command,
    [...candidate.args, "--version"],
    {
      cwd: rootDir,
      encoding: "utf8",
      shell: false,
    },
  );

  if (versionResult.error || versionResult.status !== 0) {
    lastError = versionResult.error ?? versionResult.stderr;
    continue;
  }

  const importResult = runCandidate(candidate, [importScript, ...process.argv.slice(2)]);

  if (importResult.error) {
    lastError = importResult.error;
    continue;
  }

  process.exit(importResult.status ?? 1);
}

console.error("Unable to find a usable Python runtime for species import.");
if (lastError) {
  console.error(String(lastError));
}
process.exit(1);
