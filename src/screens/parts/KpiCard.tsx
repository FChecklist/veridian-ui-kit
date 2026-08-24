"use client";

// R42 seq24 (M28 DASHBOARD archetype) -- IDENTICAL LAYOUT ON EVERY CARD
// (label, value, trend, sparkline in the same positions), and EVERY KPI
// SHOWS THREE THINGS OR IT DOES NOT SHIP: current value, trend direction,
// comparison baseline (DASHBOARD.GLOBAL). "Revenue AED 847,300" with no
// target or trend is a FAILED CARD per that row's own example -- this
// component makes omitting them a conscious choice (baseline/trend are
// required props, not optional), not an accident.
//
// *** HYPERLINKS ARE THE POINT OF A DASHBOARD (Rajat, 23 Aug). EVERY KPI
// VALUE IS CLICKABLE. A KpiCard with no onClick is a dead end and, per
// GLOBAL, MUST NOT SHIP -- callers are expected to always pass one; this
// component doesn't enforce it (a build-time lint can't know "somewhere
// real" from "nowhere"), so the live-user verification pass (this seq's own
// S4 checklist) is what actually catches an omitted one. ***
import type { ReactNode } from "react";

// Deliberately NOT the full StatusTone union (types.ts) -- only these four
// have a real --color-veri-status-* CSS variable defined (globals.css);
// "running"/"waiting"/"neutral" have no matching variable and would
// silently render as an invalid custom property. If StatusTone ever gains
// matching variables for those, widen this to match.
export type KpiTone = "context" | "needs-you" | "done" | "late";

export type KpiTrend = { direction: "up" | "down" | "flat"; label: string; tone: KpiTone };

export type KpiCardProps = {
  label: string;
  value: string;
  trend: KpiTrend;
  baseline: string; // "target 5,000" / "prior period 620" / "3% behind plan"
  visual?: ReactNode; // a <Sparkline> or <BulletChart>
  size?: "primary" | "secondary"; // primary = the ONE number (2-3x larger), secondary = supporting KPI card
  onClick?: () => void;
};

const ARROW: Record<KpiTrend["direction"], string> = { up: "↑", down: "↓", flat: "→" };

export function KpiCard({ label, value, trend, baseline, visual, size = "secondary", onClick }: KpiCardProps) {
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`block w-full text-left rounded-md border border-ct-border p-3 ${onClick ? "cursor-pointer hover:border-ct-teal" : ""}`}
    >
      <div className="text-[12.5px] text-ct-muted">{label}</div>
      <div className={size === "primary" ? "font-heading text-4xl text-ct-navy mt-1" : "font-heading text-xl text-ct-navy mt-1"}>
        {value}
      </div>
      <div className="flex items-center gap-1.5 mt-1 text-[12.5px]" style={{ color: `var(--color-veri-status-${trend.tone})` }}>
        <span aria-hidden>{ARROW[trend.direction]}</span>
        <span>{trend.label}</span>
      </div>
      <div className="text-[11.5px] text-ct-muted mt-0.5">{baseline}</div>
      {visual && <div className="mt-2">{visual}</div>}
    </Wrapper>
  );
}
