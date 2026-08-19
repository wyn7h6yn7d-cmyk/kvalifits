// Node test runner for lib/**/*.test.ts (Playwright specs in e2e/ are excluded).
// Uses tsx so TypeScript path aliases and extensionless imports resolve.
import { spawn } from "node:child_process";
import { globSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const files = globSync("lib/**/*.test.ts", { cwd: root }).sort();

if (files.length === 0) {
  console.error("No unit tests found (lib/**/*.test.ts).");
  process.exit(1);
}

const tsxBin = join(root, "node_modules", ".bin", "tsx");

const child = spawn(tsxBin, ["--test", ...files], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
