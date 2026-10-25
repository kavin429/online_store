const fs = require("fs");
const path = require("path");

/**
 * Minimal `.env` parser (KEY=VALUE, optional quotes, `#` comments).
 * Kept dependency-free so it can be required from any app's next.config.js.
 */
function parseEnv(contents) {
  const result = {};

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separator = line.indexOf("=");
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    if (!key) continue;

    let value = line.slice(separator + 1).trim();
    const quoted =
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"));
    if (quoted) value = value.slice(1, -1);

    result[key] = value;
  }

  return result;
}

/**
 * Next.js only loads env files that sit next to the app. This monorepo keeps a
 * single `.env` at the repository root so the apps, Prisma CLI and scripts all
 * share the same secrets. Values already present in the environment (or in an
 * app-local .env) always win.
 */
function loadRootEnv(appDir) {
  const envPath = path.resolve(appDir, "../../.env");
  if (!fs.existsSync(envPath)) return {};

  const parsed = parseEnv(fs.readFileSync(envPath, "utf8"));

  for (const [key, value] of Object.entries(parsed)) {
    if (process.env[key] === undefined) process.env[key] = value;
  }

  return parsed;
}

module.exports = { loadRootEnv, parseEnv };
