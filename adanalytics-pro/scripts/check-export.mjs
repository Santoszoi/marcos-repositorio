import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
const base = process.env.TEST_BASE_URL;
for (const route of ["/", "/campanhas/", "/favicon.svg"]) {
  let body;
  if (base) {
    const r = await fetch(base + route);
    assert.equal(r.status, 200, route);
    body = await r.text();
  } else {
    body = await readFile(
      path.join(
        "out",
        route === "/"
          ? "index.html"
          : route.endsWith(".svg")
            ? route.slice(1)
            : route.slice(1) + "index.html",
      ),
      "utf8",
    );
  }
  assert.ok(body.length > 0);
  if (!route.endsWith(".svg")) {
    assert.ok(body.includes('lang="pt-BR"'));
    assert.ok(body.includes("AdAnalytics"));
    const assets = [...body.matchAll(/(?:src|href)="(\/_next\/[^"?#]+)"/g)].map(
      (m) => m[1],
    );
    for (const asset of new Set(assets)) {
      if (base) assert.equal((await fetch(base + asset)).status, 200, asset);
      else assert.ok((await readFile(path.join("out", asset))).length > 0);
    }
  }
}
console.log("Rotas e arquivos da versão de produção verificados.");
