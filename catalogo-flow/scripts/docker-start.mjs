import { spawn } from "node:child_process";
const executable = "./node_modules/wrangler/bin/wrangler.js";
const migrate = spawn(
  process.execPath,
  [
    executable,
    "d1",
    "migrations",
    "apply",
    "DB",
    "--local",
    "--config",
    "wrangler.runtime.json",
    "--persist-to",
    "/app/data",
  ],
  { stdio: "inherit" },
);
migrate.on("exit", (code) => {
  if (code !== 0) process.exit(code ?? 1);
  const worker = spawn(
    process.execPath,
    [
      executable,
      "dev",
      "--config",
      "wrangler.runtime.json",
      "--ip",
      "0.0.0.0",
      "--port",
      "3000",
      "--local",
      "--persist-to",
      "/app/data",
      "--inspector-port",
      "0",
    ],
    { stdio: "inherit" },
  );
  for (const signal of ["SIGINT", "SIGTERM"])
    process.on(signal, () => worker.kill(signal));
  worker.on("exit", (code) => process.exit(code ?? 1));
});
