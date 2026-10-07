import type { TimeSlot } from "./schedulerEngine";
export const resources = [
  {
    id: "sala-a",
    name: "Sala de reunião A",
    description: "Reuniões e planejamento",
  },
  {
    id: "sala-b",
    name: "Sala de reunião B",
    description: "Atendimento e apresentações",
  },
  {
    id: "marcos",
    name: "Marcos · Desenvolvimento",
    description: "Blocos de trabalho técnico",
  },
];
export const exampleSlots: TimeSlot[] = [
  {
    id: "ex-1",
    resourceId: "sala-a",
    startTime: new Date("2026-10-07T09:00:00-03:00"),
    endTime: new Date("2026-10-07T10:00:00-03:00"),
    title: "Planejamento do projeto",
  },
  {
    id: "ex-2",
    resourceId: "sala-a",
    startTime: new Date("2026-10-07T11:00:00-03:00"),
    endTime: new Date("2026-10-07T12:00:00-03:00"),
    title: "Revisão com o cliente",
  },
  {
    id: "ex-3",
    resourceId: "sala-b",
    startTime: new Date("2026-10-07T09:30:00-03:00"),
    endTime: new Date("2026-10-07T10:30:00-03:00"),
    title: "Apresentação comercial",
  },
  {
    id: "ex-4",
    resourceId: "marcos",
    startTime: new Date("2026-10-07T10:00:00-03:00"),
    endTime: new Date("2026-10-07T12:00:00-03:00"),
    title: "Desenvolvimento de interface",
  },
];
