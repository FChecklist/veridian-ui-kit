"use client";

// M24: TOP RAIL, ~36px, ONE LINE:
//   brand | organisation | PROJECT (tinted, click-to-switch) | search | alerts | account
//
// M24, VERBATIM: "*** THE PROJECT MUST BE VISIBLE AT ALL TIMES. The top rail is
// the only band the composer never covers. Logging progress or a variation
// against the wrong project is the most expensive mistake available in this
// product. ***"
//
// That sentence is the whole reason this component exists as its own band
// rather than as part of the right pane header. The composer expands UPWARD
// over both panes; this rail is above it and is never covered. Nothing here
// may be moved into a band the composer can cover.
//
// BAND RULE (M24): this band answers exactly one question -- who am I, which
// org, which project. Nothing that belongs to the screen or to the task chain
// may be added here.

import type { ReactNode } from "react";

export type TopRailProject = { id: string; name: string };

export type TopRailProps = {
  brand: ReactNode;
  organisationName: string;
  /** null renders M24's null state. The selector NEEDS one: "THE PROJECT
   *  SELECTOR NEEDS A NULL STATE ('All projects') so CRM, pipeline and
   *  org-level work are reachable." */
  project: TopRailProject | null;
  onSwitchProject: () => void;
  onSwitchOrganisation?: () => void;
  search?: ReactNode;
  alerts?: ReactNode;
  account?: ReactNode;
};

/** M24's null state, and the string HOME teaches a new user with. */
export const ALL_PROJECTS_LABEL = "All projects";

export function TopRail({
  brand,
  organisationName,
  project,
  onSwitchProject,
  onSwitchOrganisation,
  search,
  alerts,
  account,
}: TopRailProps) {
  return (
    <header
      className="flex h-9 shrink-0 items-center gap-3 border-b px-3"
      style={{
        borderColor: "var(--color-ct-border)",
        background: "var(--color-ct-cream)",
      }}
    >
      <div className="flex items-center" style={{ color: "var(--color-ct-navy)" }}>
        {brand}
      </div>

      <span aria-hidden style={{ color: "var(--color-ct-border2)" }}>
        /
      </span>

      {onSwitchOrganisation ? (
        <button
          type="button"
          onClick={onSwitchOrganisation}
          className="rounded px-1.5 py-0.5 text-[12px] hover:underline"
          style={{ color: "var(--color-ct-slate)" }}
        >
          {organisationName}
        </button>
      ) : (
        <span className="text-[12px]" style={{ color: "var(--color-ct-slate)" }}>
          {organisationName}
        </span>
      )}

      <span aria-hidden style={{ color: "var(--color-ct-border2)" }}>
        /
      </span>

      {/* THE PROJECT. Tinted so it reads as the one piece of context you act
          against, using the kit's existing scope-tint tokens rather than a new
          colour (M24-B / E-118: the palette is not to be re-invented).
          aria-live so a switch is announced -- acting on the wrong project is
          the expensive mistake, and a screen-reader user gets no tint. */}
      <button
        type="button"
        onClick={onSwitchProject}
        aria-label={
          project ? `Project: ${project.name}. Click to switch project.` : "No project selected. Click to choose a project."
        }
        className="rounded-md border px-2 py-0.5 text-[12px] font-medium"
        style={{
          background: "var(--color-scope-tint)",
          borderColor: "var(--color-scope-tint-border)",
          color: "var(--color-ct-navy)",
        }}
      >
        <span aria-live="polite">{project ? project.name : ALL_PROJECTS_LABEL}</span>
        <span aria-hidden className="ml-1.5" style={{ color: "var(--color-ct-muted)" }}>
          ▾
        </span>
      </button>

      <div className="ml-auto flex items-center gap-1">
        {search}
        {alerts}
        {account}
      </div>
    </header>
  );
}
