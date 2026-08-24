// R42 seq24 (M28 DASHBOARD/ANALYTICAL archetypes) -- a lightweight inline
// SVG sparkline, no charting library. GLOBAL/DASHBOARD.GLOBAL: "SPARKLINE
// beside a KPI for trend -- no full chart panel needed." Deliberately tiny
// (no axes, no legend, no tooltip) -- a sparkline that needs a legend has
// stopped being a sparkline (DASHBOARD.GLOBAL's own "rule of thumb").
export type SparklineProps = {
  values: number[];
  width?: number;
  height?: number;
  tone?: "context" | "done" | "needs-you" | "late";
};

export function Sparkline({ values, width = 80, height = 24, tone = "context" }: SparklineProps) {
  if (values.length < 2) return <svg width={width} height={height} aria-hidden />;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);
  const points = values.map((v, i) => `${i * step},${height - ((v - min) / range) * height}`).join(" ");
  const color = `var(--color-veri-status-${tone})`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
