import { readFile } from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
const base = process.env.TEST_BASE_URL;
for (const route of ["/", "/favicon.svg"]) {
  const body = base
    ? await (async () => {
        const r = await fetch(base + route);
        assert.equal(r.status, 200, route);
        return r.text();
      })()
    : await readFile(
        path.join("out", route === "/" ? "index.html" : "favicon.svg"),
        "utf8",
      );
  assert.ok(body.length);
  if (route === "/") {
    assert.ok(body.includes('lang="pt-BR"'));
    assert.ok(body.includes("Scheduler Time Engine"));
    for (const asset of new Set(
      [...body.matchAll(/(?:src|href)="(\/_next\/[^"?#]+)"/g)].map((m) => m[1]),
    )) {
      if (base) assert.equal((await fetch(base + asset)).status, 200, asset);
      else assert.ok((await readFile(path.join("out", asset))).length > 0);
    }
  }
}
console.log("Production page, favicon and referenced assets passed.");
