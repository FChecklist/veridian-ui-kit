"use client";

// M24-A -- THE CHAT BOX IS THE PRODUCT, NOT A TOOLBAR.
//
// RAJAT, VERBATIM: "THE CHAT BOX SHOULD NOT BE VERY NARROW, IT SHOULD BE
// VISIBLE. YOU CAN TAKE CLAUDE CODE CHAT BOX FOR INSPIRATION. EVERYTHING
// HAPPENS INSIDE OUR CHAT BOX. THAT IS IMPORTANT."
//
// M24-A is a CORRECTION of an earlier mockup that drew this as two thin lines
// (~60px) and "reads as a toolbar bolted to the bottom of the screen. WRONG."
// At rest this box is ~132px, inside RESTING_HEIGHT below. It must LOOK like
// somewhere you type before you have typed anything.
//
// M24-A: "WHY THIS MATTERS AND MUST NOT DRIFT AGAIN: the whole design rests on
// the box being where work happens. A thin bar invites a user to ignore it and
// hunt for menus - which is the product this design exists to avoid. If a
// future session finds itself shrinking the box to give the panes more room,
// IT HAS MISUNDERSTOOD THE DESIGN."
//
// EVERYTHING LIVES INSIDE THE BOX, top to bottom:
//   1. CONTROL STRIP  - Mode | chain with the (x) | HISTORY  HOME  (reset)
//   2. CONVERSATION   - grows upward as the chain is worked
//   3. PILLS          - the ranked set (Phase C fills this slot)
//   4. INPUT          - text + attach, with real height, not a single line
//
// NO DRAGGING, NO RESIZE HANDLE, NO PIN. M24: "RAJAT'S SKETCH ORIGINALLY HAD A
// USER-RESIZABLE BOX. REJECTED AND HE AGREED: window management is load MOVED,
// not load removed. The box must size itself." There is deliberately no
// useResizable import here.

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ControlStrip } from "./ControlStrip";
import { HistoryDrop } from "./HistoryDrop";
import type { Chain, ChainLoad, ChainMode, HistoryEntry } from "./chain";

/**
 * The space the shell reserves beneath the panes. Anything above it is overlay,
 * so expanding never reflows the panes.
 *
 * M24 (original): "RESTING = control strip + one input line."
 * M24-A (correction): "At rest it should be roughly 120-150px, not 60px" -- a
 * box you can see is a place to type, not a toolbar.
 *
 * 112px is control strip (~36) + one real input line (~56) + padding, which
 * satisfies both: it reads as a box, and it is two lines, not a panel. Measured
 * against the live shell on 2026-08-26, where the resting composer was taking
 * roughly 40% of the viewport and clipping the project cards and the Create
 * Project button off the bottom of the screen. That was NOT this constant --
 * it was the product's own input slot rendering a mode row plus an oversized
 * textarea -- but the floor is lowered here too so the kit cannot contribute to
 * it. Note this is a MINIMUM: the box still grows for real content.
 */
export const COMPOSER_RESTING_HEIGHT = 112;

/** The ceiling the box grows to. It sizes itself between the two. */
export const COMPOSER_MAX_HEIGHT_VH = 62;

export type ComposerProps = {
  chain: Chain;
  onModeChange: (mode: ChainMode) => void;
  onCutFrom: (index: number) => void;
  onSegmentClick?: (index: number) => void;
  onHome: () => void;
  onReset: () => void;

  history: HistoryEntry[];
  suggestedHistory?: HistoryEntry[];
  onLoadChain: (load: ChainLoad) => void;
  onTogglePin?: (key: string) => void;

  /** 2. CONVERSATION -- rendered only once there is something to show, so the
   *  resting box stays at its resting height. */
  conversation?: ReactNode;
  /** 3. PILLS -- Phase C (PillStrip). Appears ONLY when composing, per M24:
   *  "PILLS APPEAR ONLY WHEN COMPOSING - they belong to building a task, so
   *  they arrive and leave with the composer." */
  pills?: ReactNode;

  /**
   * Replaces band 4 (INPUT) with the product's own working input surface, so a
   * product can adopt the M24 frame -- top rail, two panes, the control strip
   * and its two safety-critical rules -- WITHOUT first having to rebuild a
   * composer that already works.
   *
   * NARROWED 2026-08-26, after looking at the live shell. This used to replace
   * bands 3 AND 4, which meant a product supplying its own input could not get
   * the kit's ranked PillStrip and would render its own mode row instead. That
   * is exactly what happened on projexa-ai.com: the control strip showed
   * Projects|Customers|Vendors and VeriComposer rendered
   * Discuss|Chats|To Do|Construction Intelligence directly beneath it -- TWO
   * BANDS ANSWERING THE SAME QUESTION, which is the one thing M24's band rule
   * forbids. Band 3 is now always the kit's, so a product cannot accidentally
   * grow a second mode row underneath the strip.
   *
   * This exists because PROJEXA's VeriComposer is 440 lines of real, wired
   * chain/dispatch behaviour reaching /api/assistant and /api/discuss. Throwing
   * that away to adopt a frame would be paying twice, which is the exact
   * mistake M24's own phase ordering is arranged to avoid.
   *
   * Bands 1 and 2 (CONTROL STRIP, CONVERSATION) are NOT overridable: the strip
   * carries (x)-cannot-remove-the-project and history-loads-but-never-executes,
   * and those must not be substitutable by a consumer.
   *
   * A slot passed here MUST NOT render a second mode selector -- the strip
   * already owns Mode, and M24's band rule is that nothing appears twice.
   */
  inputSlot?: ReactNode;

  value: string;
  onChange: (v: string) => void;
  onSubmit?: () => void;
  /** Disabled reason, shown in words. Empty/undefined means enabled. When set,
   *  the primary action is disabled -- the DEFINITION OF DONE forbids
   *  fail-after-click. */
  disabledReason?: string;
  placeholder?: string;
  attachSlot?: ReactNode;
};

export function Composer({
  chain,
  onModeChange,
  onCutFrom,
  onSegmentClick,
  onHome,
  onReset,
  history,
  suggestedHistory,
  onLoadChain,
  onTogglePin,
  conversation,
  pills,
  inputSlot,
  value,
  onChange,
  onSubmit,
  disabledReason,
  placeholder = "Describe what you need, or pick a module above.",
  attachSlot,
}: ComposerProps) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  // The box sizes ITSELF. This is the whole of the sizing logic, and it is
  // deliberately not user-controllable.
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 220)}px`;
  }, [value]);

  const disabled = Boolean(disabledReason);

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center px-3 pb-3"
      style={{ maxHeight: `${COMPOSER_MAX_HEIGHT_VH}vh` }}
    >
      {/* FULL WIDTH ACROSS BOTH PANES. Not confined to one pane -- M24 records
          chat getting this wrong once already ("it confined the composer to
          the left 40% when his sketch clearly spans full width"). */}
      <div
        className="pointer-events-auto relative flex w-full flex-col overflow-visible rounded-xl border shadow-sm"
        style={{
          minHeight: COMPOSER_RESTING_HEIGHT,
          maxHeight: `${COMPOSER_MAX_HEIGHT_VH}vh`,
          background: "#fff",
          borderColor: "var(--color-ct-border2)",
        }}
      >
        {/* 1. CONTROL STRIP */}
        <div className="relative shrink-0 border-b" style={{ borderColor: "var(--color-ct-border)" }}>
          <ControlStrip
            chain={chain}
            onModeChange={onModeChange}
            onCutFrom={onCutFrom}
            onSegmentClick={onSegmentClick}
            onToggleHistory={() => setHistoryOpen((o) => !o)}
            onHome={onHome}
            onReset={onReset}
            historyOpen={historyOpen}
          />
          {/* Drops DOWN over the conversation. Absolute, so NOTHING REFLOWS. */}
          <HistoryDrop
            open={historyOpen}
            entries={history}
            suggested={suggestedHistory}
            onLoad={(load) => {
              setHistoryOpen(false);
              // LOADS AND STOPS. onLoadChain receives a ChainLoad, which has no
              // way to express execution. See chain.ts.
              onLoadChain(load);
            }}
            onTogglePin={onTogglePin}
            onClose={() => setHistoryOpen(false)}
          />
        </div>

        {/* 2. CONVERSATION -- grows upward as the chain is worked. */}
        {conversation && (
          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">{conversation}</div>
        )}

        {/* 3. PILLS -- always the kit's, never substitutable. Arrive and leave
            with the composer (M24: "PILLS APPEAR ONLY WHEN COMPOSING"). */}
        {pills && (
          <div className="shrink-0 px-3 pb-1.5 pt-1" style={{ borderColor: "var(--color-ct-border)" }}>
            {pills}
          </div>
        )}

        {/* 4. INPUT -- product-supplied when inputSlot is given. */}
        {inputSlot ? (
          <div className="shrink-0">{inputSlot}</div>
        ) : (
          <>

        {/* 4. INPUT -- real height, generous padding. Not a single line. */}
        <div className={`shrink-0 px-3 pb-2.5 pt-1${disabled ? " veri-composer-disabled" : ""}`}>
          <textarea
            ref={taRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !disabled && onSubmit) {
                e.preventDefault();
                onSubmit();
              }
            }}
            rows={2}
            placeholder={placeholder}
            aria-label="Describe the task"
            className="w-full resize-none bg-transparent text-[13px] leading-relaxed outline-none"
            style={{ color: "var(--color-ct-navy)", minHeight: 46 }}
          />
          <div className="mt-1 flex items-center gap-2">
            {attachSlot}
            {/* NO FAIL-AFTER-CLICK: when the action cannot succeed the button is
                disabled and the reason is beside it, in words. */}
            {disabled && (
              <span className="text-[11px]" style={{ color: "var(--color-ct-muted)" }}>
                {disabledReason}
              </span>
            )}
            <button
              type="button"
              onClick={onSubmit}
              disabled={disabled || !onSubmit || value.trim().length === 0}
              className="ml-auto rounded-lg px-3 py-1.5 text-[12px] font-medium text-white disabled:opacity-40"
              style={{ background: "var(--color-ct-saffron)" }}
            >
              Send
            </button>
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  );
}
