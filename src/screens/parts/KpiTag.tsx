"use client";

// R42 seq24 (M28 ANALYTICAL archetype) -- ANALYTICAL.GLOBAL: "3 KPI tags
// max" summarising the current slice above the chart+table. Selectable
// (toggles which measure the chart plots), never more than a handful.
export type KpiTagProps = {
  label: string;
  value: string;
  selected?: boolean;
  onClick?: () => void;
};

export function KpiTag({ label, value, selected, onClick }: KpiTagProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-3 py-1.5 text-left ${selected ? "border-ct-teal bg-ct-cloud" : "border-ct-border"}`}
    >
      <div className="text-[11px] text-ct-muted">{label}</div>
      <div className="text-[15px] font-medium text-ct-navy">{value}</div>
    </button>
  );
}
