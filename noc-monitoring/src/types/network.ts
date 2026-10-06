export interface NetworkDevice {
  id: string;
  name: string;
  ip: string;
  type: "Router" | "Switch" | "Server" | "Fiber Link";
  status: "Online" | "Offline" | "Warning";
  ping: number;
  jitter: number;
  packetLoss: number;
}

export interface TrafficHistory {
  time: string;
  download: number;
  upload: number;
}

export interface NOCSummary {
  totalDevices: number;
  onlineDevices: number;
  criticalAlerts: number;
  averageLatency: number;
}
