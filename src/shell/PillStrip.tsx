"use client";

// M24 -- the ranked pill set, band 3 inside the composer.
//
// "PILLS APPEAR ONLY WHEN COMPOSING - they belong to building a task, so they
// arrive and leave with the composer. Resting footprint stays two lines."
// That is enforced by the CALLER: the Composer renders its `pills` slot only
// while composing. This component does not decide when it exists.
//
// "MP-RULE-3 ranking (rolling 7-day, per user) IS the load reduction - nobody
// sees 25 pills, they see their top five or six."
//
// *** CLASSIFICATION NEVER AUTHORIZES *** -- R53 handshake (claude_log id=28),
// rule 2: "A verdict of 'task' is not permission. Permission is checked
// server-side at execution, always, again." This component's only outward
// callback is onSelect(PillSelection), and PillSelection is a type with no
// callable member and a readonly `authorizes: false`. Picking a pill CANNOT
// perform a write, because there is nothing on the value it produces that
// could perform one.

import { rankPills, type PillDef, type PillKey, type PillUsage } from "./pillConfig";

/**
 * What a pill click produces. Deliberately inert, and deliberately mirrors
 * ChainLoad in chain.ts: a value, never a capability.
 *
 * There is no `run`, no `submit`, no `execute`, and no function-valued
 * property. Adding one means editing this file and reading this comment --
 * which is the entire point of stating the rule in the type system rather than
 * in a code review.
 */
export type PillSelection = {
  pillKey: PillKey;
  label: string;
  /** True only for the free-text "Other" pill, M24's safety net. */
  isFreeText: boolean;
  /** Always false. A selection narrows the mind, not the system. */
  readonly authorizes: false;
};

export function selectPill(pill: PillDef): PillSelection {
  return { pillKey: pill.key, label: pill.label, isFreeText: Boolean(pill.isFreeText), authorizes: false };
}

export type PillStripProps = {
  /** compliance.pill_usage rows for THIS user, via R53's API. Ranking is a
   *  query there; this component re-expresses the same order for rendering and
   *  must not diverge from it. */
  usage: PillUsage[];
  /** Injected so the ordering is deterministic and testable. */
  now: number;
  activeKey?: PillKey | null;
  onSelect: (selection: PillSelection) => void;
  onTogglePin?: (key: PillKey) => void;
  limit?: number;
};

export function PillStrip({ usage, now, activeKey, onSelect, onTogglePin, limit }: PillStripProps) {
  const pills = rankPills(usage, now, limit ? { limit } : {});
  const pinnedKeys = new Set(usage.filter((r) => r.pinned).map((r) => r.pillKey));

  return (
    <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Modules">
      {pills.map((p) => {
        const isPinned = pinnedKeys.has(p.key);
        return (
          <span key={p.key} className="inline-flex items-center">
            <button
              type="button"
              onClick={() => onSelect(selectPill(p))}
              aria-pressed={activeKey === p.key}
              className={`veri-mode-pill${activeKey === p.key ? " active" : ""}`}
            >
              {isPinned && (
                <span aria-hidden className="mr-1" style={{ color: "var(--color-ct-saffron)" }}>
                  ★
                </span>
              )}
              {p.label}
              {p.isFreeText && (
                <span aria-hidden className="ml-1" style={{ color: "var(--color-ct-muted)" }}>
                  …
                </span>
              )}
            </button>
            {onTogglePin && (
              <button
                type="button"
                onClick={() => onTogglePin(p.key)}
                // Pinning is how a user defeats the 7-day decay for work they
                // know is periodic. It needs a real label, not just a star.
                aria-label={isPinned ? `Unpin ${p.label}` : `Pin ${p.label} so it never drops off`}
                title={isPinned ? "Unpin" : "Pin — never drops off"}
                className="veri-icon-btn"
                style={{ width: 20, height: 20, fontSize: 11 }}
              >
                {isPinned ? "★" : "☆"}
              </button>
            )}
          </span>
        );
      })}
    </div>
  );
}
