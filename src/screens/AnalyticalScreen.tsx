"use client";

// R42 seq24 (M28 ANALYTICAL archetype) -- "explore and act in place." Hybrid
// chart-above/table-below: DASHBOARD tells you something is wrong,
// ANALYTICAL tells you why and lets you fix it without leaving. THE TABLE
// HALF IS THE CALLER'S OWN <ListScreen>, reused wholesale (ANALYTICAL.GLOBAL:
// "If it diverges, the same data renders two ways and users will notice") --
// this component only owns the KPI-tag row, the chart slot, and the drill
// breadcrumb above it, never the table itself.
//
// Scope note (documented, not silent): SAP's variant/saved-view management
// (personal/public saved views, D-5/D-7) is NOT built in this pass -- it
// needs its own saved_views table and promotion workflow, real backend
// scope beyond this seq's UI-only mandate. Slices ARE real query
// parameters (a drilled state has a real, shareable, bookmarkable URL --
// the part of D-5 this pass does deliver), just not yet persisted as a
// named view.
import { ScreenFrame, type HeaderActionState } from "./ScreenFrame";
import { DrillBreadcrumb, type DrillSlice } from "./parts/DrillBreadcrumb";
import type { ReactNode } from "react";

export type AnalyticalScreenProps = {
  breadcrumb: ReactNode;
  kpiTags?: ReactNode; // up to 3 <KpiTag>
  chart: ReactNode; // <BarChart> or <LineChart>
  drillSlices?: DrillSlice[];
  table: ReactNode; // the caller's own <ListScreen>, reused wholesale
  filterAction?: HeaderActionState;
  exportAction?: HeaderActionState;
  newAction?: HeaderActionState;
};

export function AnalyticalScreen({ breadcrumb, kpiTags, chart, drillSlices = [], table, filterAction, exportAction, newAction }: AnalyticalScreenProps) {
  return (
    <ScreenFrame breadcrumb={breadcrumb} filterAction={filterAction} exportAction={exportAction} newAction={newAction} messages={[]}>
      <div className="flex flex-col h-full min-h-0">
        <div className="p-4 border-b border-ct-border space-y-3 shrink-0">
          {kpiTags && <div className="flex flex-wrap gap-2">{kpiTags}</div>}
          <DrillBreadcrumb slices={drillSlices} />
          <div>{chart}</div>
        </div>
        <div className="flex-1 min-h-0 overflow-auto">{table}</div>
      </div>
    </ScreenFrame>
  );
}
