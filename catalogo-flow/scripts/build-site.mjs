import { spawnSync } from "node:child_process";
import { mkdirSync, rmSync, cpSync, renameSync, existsSync } from "node:fs";
function run(args) {
  const result = spawnSync(args[0], args.slice(1), {
    stdio: "inherit",
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
run(["npm", "run", "build:next"]);
run([
  "npx",
  "--no-install",
  "opennextjs-cloudflare",
  "build",
  "--skipNextBuild",
]);
rmSync("dist", { recursive: true, force: true });
mkdirSync("dist/server", { recursive: true });
mkdirSync("dist/.openai", { recursive: true });
run([
  "npx",
  "--no-install",
  "wrangler",
  "deploy",
  "--dry-run",
  "--outdir",
  "dist/server",
]);
if (!existsSync("dist/server/worker.js"))
  throw new Error("Missing bundled Worker");
renameSync("dist/server/worker.js", "dist/server/index.js");
cpSync(".open-next/assets", "dist/client", { recursive: true });
cpSync(".openai/hosting.json", "dist/.openai/hosting.json");
console.log("Next.js Worker and assets ready in dist/");
