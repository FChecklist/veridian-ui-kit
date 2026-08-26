"use client";

// M24:
//   Scope / BOQ . Sumeet Sample Scope . rev 1 (v)        Filter  Export  + New
//
// "Breadcrumb + revision picker + THREE actions, the SAME three in the SAME
// order on every screen. This line exists because ERP screen controls had
// nowhere else to live - and they must NOT go in the strip, which is about the
// task chain, not the screen."
//
// *** M24: "RAJAT PROPOSED PUTTING THE CHAIN HERE TOO. REJECTED: it would
// duplicate the strip one band below, and the composer covers this pane when it
// expands. ONE CHAIN, ONE PLACE." ***
// Do not add chain segments, mode pills, or history to this component.
//
// BAND RULE: this band answers "what is this screen, and what can I do TO it".
// The three actions are fixed and ordered so a user never hunts: the same
// control is in the same place on all 53 routes.

import type { ReactNode } from "react";

export type Revision = { id: string; label: string };

export type RightPaneHeaderProps = {
  /** e.g. ["Scope", "BOQ"] -- rendered "Scope / BOQ". */
  breadcrumb: string[];
  /** e.g. "Sumeet Sample Scope". */
  title?: string;
  revisions?: Revision[];
  activeRevisionId?: string;
  onRevisionChange?: (id: string) => void;
  onFilter?: () => void;
  onExport?: () => void;
  onNew?: () => void;
  /** Label for the + New action, e.g. "+ New BOQ". Defaults to "+ New". */
  newLabel?: string;
  /** Rendered after the three fixed actions, never before them -- the order is
   *  the point. Use sparingly. */
  extraActions?: ReactNode;
};

export function RightPaneHeader({
  breadcrumb,
  title,
  revisions = [],
  activeRevisionId,
  onRevisionChange,
  onFilter,
  onExport,
  onNew,
  newLabel = "+ New",
  extraActions,
}: RightPaneHeaderProps) {
  return (
    <div
      className="flex h-11 shrink-0 items-center gap-2 border-b px-3"
      style={{ borderColor: "var(--color-ct-border)", background: "var(--color-ct-cream)" }}
    >
      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5">
        {breadcrumb.map((crumb, i) => (
          <span key={`${crumb}-${i}`} className="flex items-center gap-1.5">
            {i > 0 && (
              <span aria-hidden style={{ color: "var(--color-ct-border2)" }}>
                /
              </span>
            )}
            <span
              className="truncate text-[13px]"
              style={{
                color: "var(--color-ct-navy)",
                fontWeight: i === breadcrumb.length - 1 ? 600 : 400,
              }}
            >
              {crumb}
            </span>
          </span>
        ))}
      </nav>

      {title && (
        <>
          <span aria-hidden style={{ color: "var(--color-ct-border2)" }}>
            ·
          </span>
          <span className="truncate text-[13px]" style={{ color: "var(--color-ct-slate)" }}>
            {title}
          </span>
        </>
      )}

      {revisions.length > 0 && (
        <>
          <span aria-hidden style={{ color: "var(--color-ct-border2)" }}>
            ·
          </span>
          <label className="sr-only" htmlFor="veri-revision-picker">
            Revision
          </label>
          <select
            id="veri-revision-picker"
            value={activeRevisionId}
            onChange={(e) => onRevisionChange?.(e.target.value)}
            className="rounded-md border px-1.5 py-0.5 text-[12px]"
            style={{ borderColor: "var(--color-ct-border2)", color: "var(--color-ct-navy)", background: "#fff" }}
          >
            {revisions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </>
      )}

      {/* THE SAME THREE, IN THE SAME ORDER, ON EVERY SCREEN. A screen that has
          no meaningful Filter or Export still renders the control disabled
          rather than omitting it, so the row never reflows between screens and
          the user's muscle memory holds. */}
      <div className="ml-auto flex shrink-0 items-center gap-1">
        <button type="button" onClick={onFilter} disabled={!onFilter} className="veri-view-tab disabled:opacity-40">
          Filter
        </button>
        <button type="button" onClick={onExport} disabled={!onExport} className="veri-view-tab disabled:opacity-40">
          Export
        </button>
        <button
          type="button"
          onClick={onNew}
          disabled={!onNew}
          className="rounded-md px-2.5 py-1 text-[12px] font-medium text-white disabled:opacity-40"
          style={{ background: "var(--color-ct-saffron)" }}
        >
          {newLabel}
        </button>
        {extraActions}
      </div>
    </div>
  );
}
