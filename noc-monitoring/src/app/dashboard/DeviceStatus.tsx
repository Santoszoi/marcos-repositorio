"use client";

import { Router, Server, Cable, Network } from "lucide-react";
import type { NetworkDevice } from "@/types/network";

const labels = {
  Online: "Saudável",
  Warning: "Atenção",
  Offline: "Indisponível",
};
const icons = { Router, Switch: Network, Server, "Fiber Link": Cable };
const classes = { Online: "green", Warning: "amber", Offline: "red" };
export default function DeviceStatus({
  devices,
}: {
  devices: NetworkDevice[];
}) {
  return (
    <section className="panel device-panel" aria-labelledby="device-title">
      <div className="panel-heading">
        <div>
          <div className="eyebrow">INVENTÁRIO DE REDE</div>
          <h2 id="device-title">Ativos & links</h2>
        </div>
        <span className="muted">{devices.length} dispositivos monitorados</span>
      </div>
      <div
        className="table-scroll"
        role="region"
        aria-label="Métricas dos dispositivos; role horizontalmente em telas pequenas"
        tabIndex={0}
      >
        <table>
          <thead>
            <tr>
              <th scope="col">Dispositivo</th>
              <th scope="col">Endereço IP</th>
              <th scope="col">Tipo</th>
              <th scope="col">Status</th>
              <th scope="col" className="numeric">
                Ping
              </th>
              <th scope="col" className="numeric">
                Jitter
              </th>
              <th scope="col" className="numeric">
                Perda
              </th>
            </tr>
          </thead>
          <tbody>
            {devices.map((d) => {
              const Icon = icons[d.type];
              return (
                <tr key={d.id}>
                  <td>
                    <div className="device-name">
                      <span className="device-icon">
                        <Icon size={18} strokeWidth={1.6} />
                      </span>
                      <strong>{d.name}</strong>
                    </div>
                  </td>
                  <td className="mono muted">{d.ip}</td>
                  <td className="muted">{d.type}</td>
                  <td>
                    <span className={`badge ${classes[d.status]}`}>
                      <i className={`status-dot ${classes[d.status]}-bg`} />
                      {labels[d.status]}
                    </span>
                  </td>
                  <td className="numeric mono">
                    {d.status === "Offline" ? "—" : `${d.ping} ms`}
                  </td>
                  <td className="numeric mono">
                    {d.status === "Offline" ? "—" : `${d.jitter.toFixed(2)} ms`}
                  </td>
                  <td
                    className={`numeric mono ${d.packetLoss > 1 ? "red-text" : ""}`}
                  >
                    {d.packetLoss}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="panel-foot">
        <span>
          Atenção: ping &gt; 40 ms, jitter &gt; 5 ms ou perda &gt; 1%.
        </span>
        <span>Indisponíveis não entram na latência média.</span>
      </div>
    </section>
  );
}
