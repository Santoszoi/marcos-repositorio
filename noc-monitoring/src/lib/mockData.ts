import type {
  NetworkDevice,
  TrafficHistory,
  NOCSummary,
} from "../types/network";

export const INTERVAL_MS = 3000;
export const HISTORY_LIMIT = 24;
export const initialDevices: NetworkDevice[] = [
  {
    id: "1",
    name: "Core Router · HQ Brasília",
    ip: "10.0.0.1",
    type: "Router",
    status: "Online",
    ping: 12,
    jitter: 1.5,
    packetLoss: 0,
  },
  {
    id: "2",
    name: "Distribution Switch · Floor 1",
    ip: "10.0.1.5",
    type: "Switch",
    status: "Online",
    ping: 4,
    jitter: 0.8,
    packetLoss: 0,
  },
  {
    id: "3",
    name: "Database Server · Provedor",
    ip: "192.168.10.50",
    type: "Server",
    status: "Online",
    ping: 15,
    jitter: 2.1,
    packetLoss: 0.2,
  },
  {
    id: "4",
    name: "Backbone Fiber Link · Filial",
    ip: "172.16.0.2",
    type: "Fiber Link",
    status: "Warning",
    ping: 45,
    jitter: 8.4,
    packetLoss: 1.8,
  },
  {
    id: "5",
    name: "Backup Gateway",
    ip: "10.0.0.254",
    type: "Router",
    status: "Offline",
    ping: 0,
    jitter: 0,
    packetLoss: 100,
  },
];

export function makeTrafficSample(
  now = new Date(),
  random = Math.random,
): TrafficHistory {
  return {
    time: now.toLocaleTimeString("pt-BR", { hour12: false }),
    download: Math.floor(random() * 251) + 150,
    upload: Math.floor(random() * 101) + 50,
  };
}

export function generateTrafficHistory(
  now = new Date(),
  random = Math.random,
): TrafficHistory[] {
  return Array.from({ length: HISTORY_LIMIT }, (_, i) =>
    makeTrafficSample(
      new Date(now.getTime() - (HISTORY_LIMIT - 1 - i) * INTERVAL_MS),
      random,
    ),
  );
}

export function appendTraffic(
  history: TrafficHistory[],
  sample: TrafficHistory,
): TrafficHistory[] {
  return [...history, sample].slice(-HISTORY_LIMIT);
}

export function updateLiveMetrics(
  devices: NetworkDevice[],
  random = Math.random,
): NetworkDevice[] {
  return devices.map((device) => {
    if (device.status === "Offline") return device;
    const ping = Math.max(2, Math.round(device.ping + (random() - 0.5) * 4));
    const jitter = Math.max(
      0.2,
      Number((device.jitter + (random() - 0.5) * 0.6).toFixed(2)),
    );
    const status =
      ping > 40 || jitter > 5 || device.packetLoss > 1 ? "Warning" : "Online";
    return { ...device, ping, jitter, status };
  });
}

export function getSummary(devices: NetworkDevice[]): NOCSummary {
  const active = devices.filter((d) => d.status !== "Offline");
  return {
    totalDevices: devices.length,
    onlineDevices: devices.filter((d) => d.status === "Online").length,
    criticalAlerts: devices.filter((d) => d.status === "Offline").length,
    averageLatency: active.length
      ? Math.round(active.reduce((sum, d) => sum + d.ping, 0) / active.length)
      : 0,
  };
}
