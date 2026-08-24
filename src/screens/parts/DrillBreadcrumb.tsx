"use client";

// R42 seq24 -- ANALYTICAL.GLOBAL: "DRILL STATE VISIBLE AS A BREADCRUMB OF
// SLICES ... each independently removable. A user who cannot see how they
// reached a number does not trust it."
export type DrillSlice = { label: string; onRemove: () => void };

export function DrillBreadcrumb({ slices }: { slices: DrillSlice[] }) {
  if (slices.length === 0) return <span className="text-[12.5px] text-ct-muted">All</span>;
  return (
    <div className="flex flex-wrap items-center gap-1 text-[12.5px]">
      <span className="text-ct-muted">All</span>
      {slices.map((s) => (
        <span key={s.label} className="inline-flex items-center gap-1">
          <span className="text-ct-muted">{'>'}</span>
          <span className="inline-flex items-center gap-1 rounded-md bg-ct-cloud px-2 py-0.5">
            {s.label}
            <button type="button" onClick={s.onRemove} aria-label={`Remove ${s.label}`} className="text-ct-muted hover:text-ct-navy">
              ×
            </button>
          </span>
        </span>
      ))}
    </div>
  );
}
