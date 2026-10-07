import test from "node:test";
import assert from "node:assert/strict";
import {
  SchedulerEngine,
  SchedulingConflictError,
  hasSchedulingConflict,
  sortAndGroupSlots,
  parseDemoDateTime,
} from "../src/lib/schedulerEngine";
import type { TimeSlot, SlotInput } from "../src/lib/schedulerEngine";
const slot = (start = 10, end = 11, resourceId = "room-a"): SlotInput => ({
  title: "Demo",
  resourceId,
  startTime: new Date(Date.UTC(2026, 9, 7) + start * 3600000),
  endTime: new Date(Date.UTC(2026, 9, 7) + end * 3600000),
});
const existing: TimeSlot = { ...slot(), id: "one" };
test("half-open intervals accept adjacent slots and isolate resources", () => {
  assert.equal(hasSchedulingConflict(slot(11, 12), [existing]), false);
  assert.equal(hasSchedulingConflict(slot(9, 10), [existing]), false);
  assert.equal(
    hasSchedulingConflict(slot(10, 11, "room-b"), [existing]),
    false,
  );
});
test("exact, contained, containing and partial overlaps are rejected", () => {
  for (const candidate of [
    slot(),
    slot(9, 12),
    slot(10, 10.5),
    slot(9, 10.5),
    slot(10.5, 12),
  ])
    assert.equal(hasSchedulingConflict(candidate, [existing]), true);
});
test("invalid, zero-length and reverse intervals fail before comparison", () => {
  for (const input of [
    { ...slot(), startTime: new Date(NaN) },
    slot(11, 11),
    slot(12, 11),
    { ...slot(), resourceId: "  " },
  ])
    assert.throws(() => hasSchedulingConflict(input, []));
});
test("grouping sorts once, protects special keys and does not leak Date references", () => {
  const a = { ...slot(12, 13), id: "late" },
    b = { ...slot(9, 10), id: "early" },
    p = { ...slot(10, 11, "__proto__"), id: "proto" };
  const list = [a, b, p];
  const grouped = sortAndGroupSlots(list);
  assert.deepEqual(
    grouped["room-a"].map((s) => s.id),
    ["early", "late"],
  );
  assert.equal(grouped["__proto__"][0].id, "proto");
  assert.deepEqual(
    list.map((s) => s.id),
    ["late", "early", "proto"],
  );
  grouped["room-a"][0].startTime.setFullYear(2001);
  assert.equal(b.startTime.getUTCFullYear(), 2026);
});
test("two concurrent requests yield exactly one commit and queue recovers after rejection", async () => {
  const engine = new SchedulerEngine();
  const result = await Promise.allSettled([
    engine.reserve(slot()),
    engine.reserve(slot()),
  ]);
  assert.equal(result.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(result.filter((r) => r.status === "rejected").length, 1);
  assert.equal(engine.snapshot().length, 1);
  await engine.reserve(slot(11, 12));
  assert.equal(engine.snapshot().length, 2);
});
test("conflicting batch rolls back all inserts including its first valid slot", async () => {
  const engine = new SchedulerEngine([existing]);
  await assert.rejects(
    engine.reserveBatch([slot(12, 13), slot()]),
    SchedulingConflictError,
  );
  assert.equal(engine.snapshot().length, 1);
  await assert.rejects(
    engine.reserveBatch([slot(12, 14), slot(13, 15)]),
    SchedulingConflictError,
  );
  assert.equal(engine.snapshot().length, 1);
});
test("pending inputs and returned snapshots cannot alter committed state", async () => {
  const engine = new SchedulerEngine();
  const input = slot();
  const pending = engine.reserve(input);
  input.startTime.setFullYear(2001);
  const created = await pending;
  created.startTime.setFullYear(1999);
  const snapshot = engine.snapshot();
  assert.equal(snapshot[0].startTime.getUTCFullYear(), 2026);
  snapshot[0].endTime.setFullYear(1999);
  assert.equal(engine.snapshot()[0].endTime.getUTCFullYear(), 2026);
  await engine.cancel(created.id);
  assert.equal(engine.snapshot().length, 0);
  await assert.rejects(engine.cancel("missing"));
});
test("wall-clock parser rejects rolled-over dates and preserves fixed offset", () => {
  assert.equal(
    parseDemoDateTime("2026-10-07T10:00").toISOString(),
    "2026-10-07T13:00:00.000Z",
  );
  for (const input of [
    "2026-02-29T10:00",
    "2026-04-31T10:00",
    "2026-10-07T24:00",
    "bad",
  ])
    assert.throws(() => parseDemoDateTime(input));
});
