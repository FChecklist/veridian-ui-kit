// R42 seq24 -- DASHBOARD.GLOBAL: "LINE for time." Plain SVG, light-grey
// gridlines, no drop shadows/gradients (Tufte data-ink rule). An optional
// baseline series renders as the "previous period / planned" grey line
// DASHBOARD.PROJECT's own left column calls for ("planned as a grey
// baseline").
export type LineChartPoint = { label: string; value: number };

export type LineChartProps = {
  series: LineChartPoint[];
  baseline?: LineChartPoint[];
  width?: number;
  height?: number;
  unit?: string;
};

function toPath(points: LineChartPoint[], width: number, height: number, min: number, range: number) {
  const step = points.length > 1 ? width / (points.length - 1) : 0;
  return points.map((p, i) => `${i === 0 ? "M" : "L"} ${i * step},${height - ((p.value - min) / range) * height}`).join(" ");
}

export function LineChart({ series, baseline, width = 320, height = 120, unit }: LineChartProps) {
  if (series.length === 0) return <p className="text-[12.5px] text-ct-muted">No data yet.</p>;
  const all = [...series, ...(baseline ?? [])].map((p) => p.value);
  const min = Math.min(0, ...all);
  const max = Math.max(...all, 1);
  const range = max - min || 1;
  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        {gridLines.map((g) => (
          <line key={g} x1={0} x2={width} y1={height * g} y2={height * g} stroke="var(--ct-border, #e5e7eb)" strokeWidth={1} />
        ))}
        {baseline && baseline.length > 1 && (
          <path d={toPath(baseline, width, height, min, range)} fill="none" stroke="#9ca3af" strokeWidth={1.5} strokeDasharray="4 3" />
        )}
        {series.length > 1 && (
          <path d={toPath(series, width, height, min, range)} fill="none" stroke="var(--color-veri-status-context)" strokeWidth={2} />
        )}
      </svg>
      <div className="flex justify-between text-[11px] text-ct-muted mt-1">
        <span>{series[0]?.label}</span>
        <span>{series[series.length - 1]?.label}</span>
      </div>
    </div>
  );
}
