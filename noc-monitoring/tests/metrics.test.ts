import { test } from "node:test";
import assert from "node:assert/strict";
import {
  initialDevices,
  updateLiveMetrics,
  getSummary,
  generateTrafficHistory,
  makeTrafficSample,
  appendTraffic,
  HISTORY_LIMIT,
} from "../src/lib/mockData";

test("summary separates critical failures and excludes offline devices from latency", () => {
  assert.deepEqual(getSummary(initialDevices), {
    totalDevices: 5,
    onlineDevices: 3,
    criticalAlerts: 1,
    averageLatency: 19,
  });
  assert.equal(getSummary([]).averageLatency, 0);
  assert.equal(getSummary([initialDevices[4]]).averageLatency, 0);
});
test("offline device stays offline and initial data is not mutated", () => {
  const copy = structuredClone(initialDevices);
  const next = updateLiveMetrics(initialDevices, () => 0.99);
  assert.deepEqual(initialDevices, copy);
  assert.deepEqual(next[4], initialDevices[4]);
  assert.equal(next[3].status, "Warning");
});
test("packet loss triggers warning even with good latency, and recovered metrics become healthy", () => {
  assert.equal(
    updateLiveMetrics([{ ...initialDevices[0], packetLoss: 2 }], () => 0.5)[0]
      .status,
    "Warning",
  );
  assert.equal(
    updateLiveMetrics(
      [{ ...initialDevices[0], status: "Warning" }],
      () => 0.5,
    )[0].status,
    "Online",
  );
  assert.equal(
    updateLiveMetrics(
      [{ ...initialDevices[0], ping: 2, jitter: 0.2 }],
      () => 0,
    )[0].jitter,
    0.2,
  );
});
test("history keeps a consistent three second cadence and bounded rolling window", () => {
  const now = new Date("2026-10-06T12:00:00Z");
  const history = generateTrafficHistory(now, () => 0);
  assert.equal(history.length, HISTORY_LIMIT);
  assert.deepEqual(
    history.at(-1),
    makeTrafficSample(now, () => 0),
  );
  assert.equal(
    history.at(-2)?.time,
    new Date(now.getTime() - 3000).toLocaleTimeString("pt-BR", {
      hour12: false,
    }),
  );
  const sample = makeTrafficSample(now, () => 0.999999);
  const updated = appendTraffic(history, sample);
  assert.equal(updated.length, HISTORY_LIMIT);
  assert.equal(updated[0], history[1]);
  assert.deepEqual(updated.at(-1), sample);
  assert.equal(sample.download, 400);
  assert.equal(sample.upload, 150);
  assert.equal(history[0].download, 150);
});
