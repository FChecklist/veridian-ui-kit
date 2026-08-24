"use client";

// R42 seq24 (M28 DASHBOARD archetype) -- a LAUNCHPAD, not a destination
// (DASHBOARD.GLOBAL: "the user should LEAVE it within seconds"). F-pattern,
// evidence-based layout (top-left gets ~80% of attention): the ONE number
// top-left at 2-3x size, 2-3 secondary KPIs top-right, trend context left,
// breakdown right, quick actions + recent activity along the bottom.
// SPACE RULE 40-30-20-10 is approximated by the grid proportions below, not
// pixel-exact (a real design pass would measure it; this is the structural
// shape GLOBAL asks for).
import { ScreenFrame, type HeaderActionState } from "./ScreenFrame";
import type { ReactNode } from "react";

export type DashboardScreenProps = {
  breadcrumb: ReactNode;
  oneNumber: ReactNode; // the single most important KpiCard, size="primary"
  secondaryKpis: ReactNode; // 2-3 KpiCard size="secondary", laid out top-right
  trendColumn?: ReactNode; // left column -- LineChart over time
  breakdownColumn?: ReactNode; // right column -- BarChart by category
  linkList?: ReactNode; // bottom-left -- LinkListCard
  recentActivity?: ReactNode; // bottom-right -- recent entries table/list
  filterAction?: HeaderActionState;
  exportAction?: HeaderActionState;
  newAction?: HeaderActionState; // DASHBOARD.PROJECT's own row: "+ New suppressed" is a documented per-screen override, not an omission
};

export function DashboardScreen({
  breadcrumb,
  oneNumber,
  secondaryKpis,
  trendColumn,
  breakdownColumn,
  linkList,
  recentActivity,
  filterAction,
  exportAction,
  newAction,
}: DashboardScreenProps) {
  return (
    <ScreenFrame breadcrumb={breadcrumb} filterAction={filterAction} exportAction={exportAction} newAction={newAction} messages={[]}>
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-4">
          <div>{oneNumber}</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">{secondaryKpis}</div>
        </div>
        {(trendColumn || breakdownColumn) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {trendColumn && <div className="rounded-md border border-ct-border p-3">{trendColumn}</div>}
            {breakdownColumn && <div className="rounded-md border border-ct-border p-3">{breakdownColumn}</div>}
          </div>
        )}
        {(linkList || recentActivity) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {linkList}
            {recentActivity}
          </div>
        )}
      </div>
    </ScreenFrame>
  );
}
