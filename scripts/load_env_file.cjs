/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require("fs");
const path = require("path");

function unquote(value) {
  const trimmed = value.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const equalsIndex = trimmedLine.indexOf("=");

    if (equalsIndex <= 0) {
      continue;
    }

    const key = trimmedLine.slice(0, equalsIndex).trim();
    const value = unquote(trimmedLine.slice(equalsIndex + 1));

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function loadLocalEnv(rootDir) {
  loadEnvFile(path.join(rootDir, ".env.local"));
}

module.exports = { loadLocalEnv };
