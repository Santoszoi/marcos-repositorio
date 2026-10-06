import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const state = mkdtempSync(join(tmpdir(), "catalogo-flow-test-"));
const cli = "./node_modules/wrangler/bin/wrangler.js";
const migrate = spawnSync(
  process.execPath,
  [
    cli,
    "d1",
    "migrations",
    "apply",
    "DB",
    "--local",
    "--config",
    "wrangler.runtime.json",
    "--persist-to",
    state,
  ],
  { stdio: "inherit" },
);
if (migrate.status !== 0) process.exit(migrate.status ?? 1);
const server = spawn(
  process.execPath,
  [
    cli,
    "dev",
    "--config",
    "wrangler.runtime.json",
    "--ip",
    "127.0.0.1",
    "--port",
    "3000",
    "--local",
    "--persist-to",
    state,
    "--inspector-port",
    "0",
  ],
  { stdio: ["ignore", "pipe", "pipe"] },
);
let log = "";
server.stdout.on("data", (data) => {
  log = (log + data).slice(-18000);
});
server.stderr.on("data", (data) => {
  log = (log + data).slice(-18000);
});
let status = 1;
try {
  let ready = false;
  for (let i = 0; i < 150; i++) {
    try {
      if (
        (
          await fetch("http://127.0.0.1:3000/api/health", {
            signal: AbortSignal.timeout(1000),
          })
        ).ok
      ) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  if (!ready) throw new Error("The local Worker did not become healthy.");
  status =
    spawnSync(process.execPath, ["scripts/test-api.mjs"], {
      stdio: "inherit",
      env: { ...process.env, TEST_ORIGIN: "http://127.0.0.1:3000" },
    }).status ?? 1;
  if (status !== 0) console.error(log);
} catch (error) {
  console.error(error.message);
  console.error(log);
} finally {
  server.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => server.once("exit", resolve)),
    new Promise((resolve) => setTimeout(resolve, 3000)),
  ]);
  rmSync(state, { recursive: true, force: true });
}
process.exit(status);
