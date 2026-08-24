"use client";

// R42 seq24 -- DASHBOARD.GLOBAL: "HORIZONTAL BAR for category comparison,
// SORTED. Answers 'which is worst' instantly." + "DEMOTE PIE CHARTS ...
// NEVER a pie with more than 5 segments; prefer a sorted horizontal bar
// always." This is that bar -- the ONLY category-comparison chart this kit
// offers, deliberately, so a pie never gets reached for out of habit.
import type { StatusTone } from "../types";

export type BarChartDatum = { label: string; value: number; tone?: StatusTone };

export type BarChartProps = {
  data: BarChartDatum[];
  onBarClick?: (datum: BarChartDatum) => void;
  unit?: string;
};

export function BarChart({ data, onBarClick, unit }: BarChartProps) {
  const sorted = [...data].sort((a, b) => b.value - a.value); // GLOBAL: sorted, always
  const max = Math.max(...sorted.map((d) => d.value), 1);
  return (
    <div className="space-y-2">
      {sorted.map((d) => {
        const pct = (d.value / max) * 100;
        const color = d.tone ? `var(--color-veri-status-${d.tone})` : "var(--color-veri-status-context)";
        return (
          <button
            key={d.label}
            type="button"
            onClick={onBarClick ? () => onBarClick(d) : undefined}
            disabled={!onBarClick}
            className={`w-full text-left ${onBarClick ? "cursor-pointer" : "cursor-default"}`}
          >
            <div className="flex justify-between text-[12px] text-ct-slate mb-0.5">
              <span>{d.label}</span>
              <span className="tabular-nums">{d.value.toLocaleString()}{unit}</span>
            </div>
            <div className="h-2 rounded-sm bg-ct-cloud">
              <div className="h-2 rounded-sm" style={{ width: `${pct}%`, backgroundColor: color }} />
            </div>
          </button>
        );
      })}
    </div>
  );
}
