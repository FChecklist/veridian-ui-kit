// R42 seq24 -- DASHBOARD.GLOBAL: "BULLET CHART REPLACES GAUGES. Value +
// target + bands in a compact horizontal bar." A gauge "looks impressive
// but wastes space for very little information" -- this is the deliberate
// replacement, everywhere a gauge would otherwise go.
export type BulletChartProps = {
  value: number;
  target: number;
  max?: number; // defaults to max(value, target) * 1.15 so the bar never clips
  /** Lower-is-better metrics (cost/unit, days late, variance) invert which side of target is "good" -- DASHBOARD.GLOBAL's own direction-convention warning. */
  lowerIsBetter?: boolean;
  unit?: string;
};

export function BulletChart({ value, target, max, lowerIsBetter = false, unit }: BulletChartProps) {
  const ceiling = max ?? (Math.max(value, target) * 1.15 || 1);
  const isGood = lowerIsBetter ? value <= target : value >= target;
  const valueTone = isGood ? "done" : value === target ? "context" : "needs-you";
  const valuePct = Math.min(100, (value / ceiling) * 100);
  const targetPct = Math.min(100, (target / ceiling) * 100);
  return (
    <div className="w-full">
      <div className="relative h-3 rounded-sm bg-ct-cloud">
        <div
          className="absolute inset-y-0 left-0 rounded-sm"
          style={{ width: `${valuePct}%`, backgroundColor: `var(--color-veri-status-${valueTone})` }}
        />
        <div className="absolute top-[-2px] bottom-[-2px] w-[2px] bg-ct-navy" style={{ left: `${targetPct}%` }} aria-hidden />
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-ct-muted">
        <span>{value.toLocaleString()}{unit}</span>
        <span>target {target.toLocaleString()}{unit}</span>
      </div>
    </div>
  );
}
