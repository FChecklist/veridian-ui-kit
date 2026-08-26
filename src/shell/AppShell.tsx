"use client";

// M24 -- THE FRAME.
//
//   TWO PANES ONLY. NO LEFT RAIL. NO BOTTOM RAIL.
//     LEFT  30% = TASK MASTER
//     RIGHT 70% = TRADITIONAL ERP - tables, Gantts, dashboards, reports
//   TOP RAIL above both. COMPOSER docked full width across both.
//
// WHY 30/70, in M24's own words: "the left pane's content is FIXED WIDTH
// (glyph, name, date pill) and gains nothing from more room. The right pane's
// content GROWS with the product - the BOQ table wants budget% and vendor
// columns, a Gantt gains a week per 150px, RPT-01 asks for reports in
// interactive dashboard format. At 1366px: left 410px, name gets ~300px after
// furniture. That fits."
//
// THIS COMPONENT REPLACES AppShellFrame, which was sidebar + left working
// column + right column. M24 DELETES the left rail: "HOME = THE GROUPED MODULE
// DIRECTORY, rendered in the RIGHT pane. It REPLACES the left rail, which is
// why the rail could be deleted at all." AppShellFrame and AppSidebar remain
// exported from the kit for products that have not migrated yet; PROJEXA moves
// to this one.
//
// THE PANES DO NOT REFLOW WHEN THE COMPOSER EXPANDS. The pane area reserves
// exactly COMPOSER_RESTING_HEIGHT at the bottom; the composer is an overlay
// anchored there and grows UPWARD over the panes. M24-A: "CONSEQUENCE FOR THE
// PANES: at rest the two panes get the height above the box, not the full
// frame. That is correct and intended. The ERP surface is what you READ; the
// box is what you WORK IN."

import type { ReactNode } from "react";
import { COMPOSER_RESTING_HEIGHT } from "./Composer";

export type AppShellProps = {
  /** <TopRail />. Always visible, never covered by the composer. */
  topRail: ReactNode;
  /** <TaskMaster />. The LEFT 30%. */
  taskMaster: ReactNode;
  /** The routed ERP screen -- the RIGHT 70%. */
  children: ReactNode;
  /** <Composer />. Docked, full width, overlaying the bottom of both panes. */
  composer: ReactNode;
};

/** M24: LEFT 30% / RIGHT 70% (left was 40%, "reduced 22 Aug once the module
 *  column was cut"). */
export const LEFT_PANE_PERCENT = 30;

export function AppShell({ topRail, taskMaster, children, composer }: AppShellProps) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden" style={{ background: "var(--color-ct-cream)" }}>
      {topRail}

      {/* relative: the composer overlay is positioned against this box, so it
          can grow upward over the panes without moving them. */}
      <div className="relative min-h-0 flex-1">
        <div
          className="flex h-full min-h-0"
          // The reserved strip at the bottom. This is the ONLY place the
          // resting height is applied to layout -- expansion beyond it is
          // overlay, never reflow.
          style={{ paddingBottom: COMPOSER_RESTING_HEIGHT }}
        >
          <aside
            className="min-h-0 shrink-0 overflow-hidden border-r"
            style={{ width: `${LEFT_PANE_PERCENT}%`, borderColor: "var(--color-ct-border)" }}
            aria-label="Task Master"
          >
            {taskMaster}
          </aside>

          <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">{children}</main>
        </div>

        {composer}
      </div>
    </div>
  );
}
