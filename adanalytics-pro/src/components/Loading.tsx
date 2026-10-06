export default function Loading() {
  return (
    <div className="loading" role="status" aria-live="polite">
      <div className="metric-grid">
        {[1, 2, 3, 4].map((n) => (
          <div className="skeleton skeleton-card" key={n} />
        ))}
      </div>
      <div className="skeleton chart-skeleton" />
      <p>Carregando métricas de demonstração…</p>
    </div>
  );
}
