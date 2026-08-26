"use client";

// M24 -- the option chain. After a pill narrows the mind to an entity, this is
// how the user walks ENTITY > ACTION > STEP one level at a time, and it is what
// fills the control strip in front of them.
//
// M24 on why this teaches rather than merely navigates:
//   "clicks a card -> THE STRIP FILLS IN AS HE WATCHES. He learns the grammar
//    by doing, without being taught."
//
// M24-B: this is ASSEMBLY, not new CSS. The chips are the kit's existing
// .veri-rchip (single-select row) and .veri-mchip (multi-select row), which the
// palette file describes as "shared exactly as the mockup defines them so every
// product's ChainSelector renders identically, pixel for pixel". A selected
// LEAF uses .veri-rchip.leaf.checked, which is already teal. No new class was
// added for this component.
//
// *** SELECTING AN OPTION NEVER EXECUTES *** -- the same rule as history and
// task clicks. onAdvance hands back a ChainSegment; building a chain is not
// running it. Execution is a separate, explicit submit, and permission is
// re-checked server-side there (R53 handshake id=28, rule 2).

import type { ChainSegment, SegmentKind } from "./chain";

export type ChainOption = {
  id: string;
  label: string;
  /** A leaf is the last step -- the thing that would actually be done. It is
   *  drawn differently (teal, via .veri-rchip.leaf.checked) so a user can see
   *  they have reached the end of the sentence. */
  isLeaf?: boolean;
  /** Present but not reachable yet. M24's rule is HIDE, not disable, for
   *  anything that cannot run -- so callers should normally filter these out
   *  rather than pass them. Kept so a caller can deliberately show a
   *  browse-only branch WITH a reason, instead of a dead end. */
  unavailableReason?: string;
};

export type OptionChainProps = {
  /** The question this level answers, e.g. "Which module?" / "Which step?" */
  legend: string;
  options: ChainOption[];
  /** What kind of segment picking one of these produces. */
  kind: SegmentKind;
  selectedId?: string | null;
  /** Adds the picked option to the chain. Never runs it. */
  onAdvance: (segment: ChainSegment) => void;
  /** Multi-select levels use .veri-mchip instead of .veri-rchip. */
  multi?: boolean;
  selectedIds?: string[];
  onToggle?: (id: string) => void;
};

export function OptionChain({
  legend,
  options,
  kind,
  selectedId,
  onAdvance,
  multi = false,
  selectedIds = [],
  onToggle,
}: OptionChainProps) {
  if (options.length === 0) {
    // EMPTY STATES MUST PROMPT, NEVER LOOK BROKEN (M24).
    return (
      <p className="text-[12px]" style={{ color: "var(--color-ct-muted)" }}>
        Nothing to choose here yet.
      </p>
    );
  }

  return (
    <fieldset className="flex flex-wrap items-center gap-1.5">
      <legend className="sr-only">{legend}</legend>
      <span className="mr-1 text-[11px]" style={{ color: "var(--color-ct-muted)" }}>
        {legend}
      </span>

      {options.map((o) => {
        if (multi) {
          const checked = selectedIds.includes(o.id);
          return (
            <label key={o.id} className={`veri-mchip${checked ? " checked" : ""}`}>
              <input type="checkbox" checked={checked} onChange={() => onToggle?.(o.id)} />
              <span>{o.label}</span>
            </label>
          );
        }

        const checked = selectedId === o.id;
        const cls = ["veri-rchip", o.isLeaf ? "leaf" : "", checked ? "checked" : ""]
          .filter(Boolean)
          .join(" ");

        if (o.unavailableReason) {
          // Never a dead end: if a branch is shown at all, it says in words why
          // it cannot be picked, rather than silently doing nothing on click.
          return (
            <span
              key={o.id}
              className={cls}
              style={{ opacity: 0.5, cursor: "not-allowed" }}
              title={o.unavailableReason}
              aria-disabled
            >
              {o.label}
              <span className="ml-1.5 text-[10px]" style={{ color: "var(--color-ct-muted)" }}>
                {o.unavailableReason}
              </span>
            </span>
          );
        }

        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={checked}
            className={cls}
            onClick={() => onAdvance({ id: o.id, label: o.label, kind })}
          >
            {o.label}
          </button>
        );
      })}
    </fieldset>
  );
}
