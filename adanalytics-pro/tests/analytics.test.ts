import test from "node:test";
import assert from "node:assert/strict";
import {
  summary,
  filterCampaigns,
  restoreStatuses,
} from "../src/lib/analytics";
import {
  mockCampaigns,
  dailyMetrics,
  fetchCampaignsData,
  fetchDailyMetrics,
} from "../src/lib/mockApi";
test("CTR agregado usa cliques e impressões, não a média de porcentagens", () => {
  const s = summary(mockCampaigns);
  assert.equal(s.spent, 7950);
  assert.equal(s.conversions, 672);
  assert.equal(s.clicks, 11570);
  assert.equal(s.impressions, 232000);
  assert.equal(s.ctr, (11570 / 232000) * 100);
  assert.notEqual(s.ctr, 5.74);
  assert.equal(s.cpc, 7950 / 11570);
  assert.equal(s.cpa, 7950 / 672);
});
test("filtros combinados e caso vazio evitam divisão por zero", () => {
  const f = filterCampaigns(mockCampaigns, {
    platform: "Meta Ads",
    status: "Pausada",
    search: " CESTA ",
  });
  assert.deepEqual(
    f.map((c) => c.id),
    ["3"],
  );
  assert.deepEqual(summary([]), {
    spent: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    ctr: 0,
    cpc: 0,
    cpa: 0,
  });
});
test("série respeita os filtros e conserva os totais em centavos", () => {
  for (const p of ["Todas", "Google Ads", "Meta Ads", "TikTok Ads"] as const) {
    const filtered = filterCampaigns(mockCampaigns, {
      platform: p,
      status: "Todos",
      search: "",
    });
    const data = dailyMetrics(filtered);
    assert.equal(data.length, 6);
    assert.equal(
      Math.round(data.reduce((s, d) => s + d.investimento, 0) * 100),
      Math.round(summary(filtered).spent * 100),
    );
    assert.ok(data.every((d) => d.retorno >= 0 && d.investimento >= 0));
  }
  assert.ok(
    dailyMetrics([]).every((d) => d.retorno === 0 && d.investimento === 0),
  );
});
test("restauração aceita somente estados e IDs modificáveis", () => {
  assert.deepEqual(
    restoreStatuses(
      '{"1":"Pausada","4":"Ativa","5":"Concluída","unknown":"Ativa"}',
    ),
    { "1": "Pausada" },
  );
  assert.deepEqual(restoreStatuses("bad"), {});
  assert.deepEqual(restoreStatuses("[]"), {});
});
test("cancelamento interrompe as duas APIs assíncronas sem resposta obsoleta", async () => {
  const c = new AbortController();
  const a = fetchCampaignsData(c.signal);
  const b = fetchDailyMetrics(mockCampaigns, c.signal);
  c.abort();
  await assert.rejects(a, { name: "AbortError" });
  await assert.rejects(b, { name: "AbortError" });
});
test("API retorna cópias e métricas calculadas a partir dos números brutos", async () => {
  const data = await fetchCampaignsData();
  assert.equal(data[1].ctr, (4120 / 98000) * 100);
  data[0].name = "Alterada";
  assert.notEqual(mockCampaigns[0].name, "Alterada");
});
