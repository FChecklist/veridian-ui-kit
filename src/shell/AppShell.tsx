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
  /**
   * F_019 fix (2026-08-27): additional px added on top of
   * COMPOSER_RESTING_HEIGHT when reserving space for the composer's OWN
   * static resting footprint. Zero by default -- unchanged behaviour for any
   * caller whose composer really does stay at "control strip + one input
   * line" while at rest, exactly as COMPOSER_RESTING_HEIGHT assumes.
   *
   * A caller that (like PROJEXA's M24Shell) always renders the composer's
   * `pills` slot -- never omitting it, so band 3 is part of every resting
   * state, not just "while composing" -- must pass enough extra reserve to
   * cover it (see COMPOSER_PILLS_BAND_RESERVE in Composer.tsx), or the
   * composer's real, taller footprint silently overlaps whatever page
   * content has scrolled to the pane's own bottom edge and swallows its
   * clicks. See Composer.tsx's COMPOSER_PILLS_BAND_RESERVE doc comment for
   * the live reproduction this fixes.
   *
   * Deliberately a static number the caller supplies once, not a measured
   * live height fed back into this padding -- see that same doc comment for
   * why a live-measurement approach would reintroduce R48_LAYOUT_REFLOW_01's
   * failure class instead of this one.
   */
  composerReserveExtra?: number;
};

/** M24: LEFT 30% / RIGHT 70% (left was 40%, "reduced 22 Aug once the module
 *  column was cut"). */
export const LEFT_PANE_PERCENT = 30;

export function AppShell({ topRail, taskMaster, children, composer, composerReserveExtra = 0 }: AppShellProps) {
  return (
    // h-[100svh], not h-dvh. dvh tracks the mobile URL bar, so the whole shell
    // resizes vertically mid-scroll and both panes reflow -- a post-mount shift
    // this component introduced that the old shell (h-screen) did not have.
    // svh is the stable small-viewport unit: it does not move when the URL bar
    // shows or hides.
    <div className="flex h-[100svh] flex-col overflow-hidden" style={{ background: "var(--color-ct-cream)" }}>
      {topRail}

      {/* relative: the composer overlay is positioned against this box, so it
          can grow upward over the panes without moving them. */}
      <div className="relative min-h-0 flex-1">
        <div
          className="flex h-full min-h-0"
          // The reserved strip at the bottom. This is the ONLY place the
          // resting height is applied to layout -- expansion beyond it is
          // overlay, never reflow. composerReserveExtra (default 0, see the
          // prop doc above) covers a caller whose composer's real resting
          // footprint is taller than the kit's own "control strip + one
          // input line" baseline.
          style={{ paddingBottom: COMPOSER_RESTING_HEIGHT + composerReserveExtra }}
        >
          {/* scrollbarGutter: "stable" on BOTH panes.
              R48_LAYOUT_REFLOW_01's original mechanism (the old shell's
              post-mount column-width jump) is gone from this shell, but an
              adversarial re-read found a second, independent source that
              survived: this project forces a 6px space-taking scrollbar in
              globals.css and declared scrollbar-gutter nowhere. So the moment a
              route's async data crossed the overflow threshold, the pane's
              content box narrowed by 6px and every control inside it moved --
              after load, under the user's cursor, and again on every crossing.
              That is the same user-visible failure the fault describes, and it
              is the mechanism most likely to have kept reproducing it.
              Reserving the gutter makes the content box the same width whether
              or not the scrollbar is present. */}
          <aside
            className="min-h-0 shrink-0 overflow-hidden border-r"
            style={{
              width: `${LEFT_PANE_PERCENT}%`,
              borderColor: "var(--color-ct-border)",
              scrollbarGutter: "stable",
            }}
            aria-label="Task Master"
          >
            {taskMaster}
          </aside>

          <main className="min-h-0 min-w-0 flex-1 overflow-y-auto" style={{ scrollbarGutter: "stable" }}>
            {children}
          </main>
        </div>

        {composer}
      </div>
    </div>
  );
}
