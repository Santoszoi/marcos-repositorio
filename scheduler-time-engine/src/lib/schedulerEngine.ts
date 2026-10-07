export interface TimeSlot {
  id: string;
  resourceId: string;
  startTime: Date;
  endTime: Date;
  title: string;
}
export type SlotInput = Omit<TimeSlot, "id">;
export class SchedulingConflictError extends Error {
  constructor(public readonly conflictIds: string[]) {
    super("Este recurso já possui uma reserva neste intervalo.");
    this.name = "SchedulingConflictError";
  }
}
export function validateSlot(slot: SlotInput) {
  if (
    !slot ||
    typeof slot.resourceId !== "string" ||
    !slot.resourceId.trim() ||
    slot.resourceId.length > 80 ||
    typeof slot.title !== "string" ||
    !slot.title.trim() ||
    slot.title.length > 160
  )
    throw new Error("Informe um recurso e um título válidos.");
  if (
    !(slot.startTime instanceof Date) ||
    !(slot.endTime instanceof Date) ||
    !Number.isFinite(slot.startTime.getTime()) ||
    !Number.isFinite(slot.endTime.getTime()) ||
    slot.startTime.getTime() >= slot.endTime.getTime()
  )
    throw new Error(
      "O fim deve ser posterior ao início e as datas devem ser válidas.",
    );
}
function copy(slot: TimeSlot): TimeSlot {
  return {
    ...slot,
    startTime: new Date(slot.startTime),
    endTime: new Date(slot.endTime),
  };
}
export function findSchedulingConflicts(
  newSlot: SlotInput,
  existingSlots: TimeSlot[],
): TimeSlot[] {
  validateSlot(newSlot);
  const start = newSlot.startTime.getTime(),
    end = newSlot.endTime.getTime();
  const conflicts: TimeSlot[] = [];
  for (const slot of existingSlots) {
    validateSlot(slot);
    if (
      slot.resourceId === newSlot.resourceId &&
      start < slot.endTime.getTime() &&
      end > slot.startTime.getTime()
    )
      conflicts.push(copy(slot));
  }
  return conflicts;
}
export function hasSchedulingConflict(
  newSlot: SlotInput,
  existingSlots: TimeSlot[],
): boolean {
  return findSchedulingConflicts(newSlot, existingSlots).length > 0;
}
export function sortAndGroupSlots(
  slots: TimeSlot[],
): Record<string, TimeSlot[]> {
  const grouped: Record<string, TimeSlot[]> = Object.create(null);
  for (const slot of slots) {
    validateSlot(slot);
    (grouped[slot.resourceId] ??= []).push(copy(slot));
  }
  for (const group of Object.values(grouped))
    group.sort(
      (a, b) =>
        a.startTime.getTime() - b.startTime.getTime() ||
        a.id.localeCompare(b.id),
    );
  return grouped;
}
/** Serializes writes to one in-memory instance. Not a distributed booking service. */
export class SchedulerEngine {
  private slots: TimeSlot[];
  private tail: Promise<void> = Promise.resolve();
  constructor(seed: TimeSlot[] = []) {
    this.slots = [];
    for (const slot of seed) {
      validateSlot(slot);
      if (!slot.id || this.slots.some((s) => s.id === slot.id))
        throw new Error("IDs de reserva devem ser únicos.");
      if (hasSchedulingConflict(slot, this.slots))
        throw new SchedulingConflictError(
          findSchedulingConflicts(slot, this.slots).map((s) => s.id),
        );
      this.slots.push(copy(slot));
    }
  }
  snapshot() {
    return this.slots.map(copy);
  }
  private serialize<T>(operation: () => T): Promise<T> {
    const result = this.tail.then(operation);
    this.tail = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }
  reserve(slot: SlotInput) {
    return this.reserveBatch([slot]).then((slots) => slots[0]);
  }
  reserveBatch(inputs: SlotInput[]): Promise<TimeSlot[]> {
    // Snapshot inputs before entering the queue so callers cannot alter a pending request.
    if (!Array.isArray(inputs) || !inputs.length || inputs.length > 20)
      return Promise.reject(new Error("Envie de 1 a 20 reservas por lote."));
    let snapshots: SlotInput[];
    try {
      snapshots = inputs.map((s) => {
        validateSlot(s);
        return {
          ...s,
          startTime: new Date(s.startTime),
          endTime: new Date(s.endTime),
        };
      });
    } catch (e) {
      return Promise.reject(e);
    }
    return this.serialize(() => {
      const candidate = this.snapshot();
      const created: TimeSlot[] = [];
      for (const input of snapshots) {
        const conflicts = findSchedulingConflicts(input, candidate);
        if (conflicts.length)
          throw new SchedulingConflictError(conflicts.map((s) => s.id));
        const slot = { ...input, id: crypto.randomUUID() };
        candidate.push(slot);
        created.push(slot);
      }
      this.slots = candidate;
      return created.map(copy);
    });
  }
  cancel(id: string) {
    return this.serialize(() => {
      const exists = this.slots.some((s) => s.id === id);
      if (!exists) throw new Error("Reserva não encontrada.");
      this.slots = this.slots.filter((s) => s.id !== id);
    });
  }
}
/** Parse a wall-clock input with the demo's explicit fixed UTC-03:00 offset. */
export function parseDemoDateTime(value: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!m) throw new Error("Informe data e hora completas.");
  const [y, mo, d, h, mi] = m.slice(1).map(Number);
  const check = new Date(Date.UTC(y, mo - 1, d, h, mi));
  if (
    y < 2000 ||
    y > 2100 ||
    check.getUTCFullYear() !== y ||
    check.getUTCMonth() !== mo - 1 ||
    check.getUTCDate() !== d ||
    check.getUTCHours() !== h ||
    check.getUTCMinutes() !== mi
  )
    throw new Error("Data ou hora inválida.");
  return new Date(value + ":00-03:00");
}
