"use client";

// M24 -- the LEFT pane (30%). Not a chat thread: chat built one here once and
// M24 records that as one of the three things it got wrong. This is TASK
// MASTER.
//
// DATA SOURCE, RULED: compliance.pipeline_tasks -- what the composer creates
// and what carries the chain. NOT compliance.tasks, which is a different,
// older system with 1,913 rows. This component takes rows as props and does
// not fetch, so the ruling is enforced at the call site in the product.

import type { ChainLoad, Chain } from "./chain";
import { loadChain } from "./chain";

/**
 * M24: "Line 1 must START WITH A VERB from a CLOSED SET ... Six words the user
 * learns once. 'Approve variation VO-014' tells you what to do; 'Variation
 * VO-014' does not."
 *
 * M24 also says why a closed set is enforceable at all: "TASK NAMES ARE
 * SYSTEM-GENERATED, SO THE CONVENTION IS ENFORCEABLE."
 */
export const TASK_VERBS = ["Approve", "Confirm", "Sign off", "Review", "Import", "Record"] as const;
export type TaskVerb = (typeof TASK_VERBS)[number];

/** M24: "IF NAMES TRUNCATE IN REAL USE THAT IS A NAMING FAILURE, NOT A LAYOUT
 *  ONE - shorten the name, do not widen the pane." These are the budgets that
 *  make that failure visible instead of silently clipping. */
export const LINE1_MAX = 40;
export const LINE2_MAX = 55;
/** M24: "TEN ROWS VISIBLE." */
export const VISIBLE_ROWS = 10;

/** M24: four glyphs, FIXED COLUMN, NEVER COLOUR ALONE (~8% of men have
 *  colour-vision deficiency and construction skews male). Each glyph carries a
 *  word for assistive tech; colour is only ever the third signal. */
export type TaskState = "needs-you" | "running" | "waiting" | "done";

const GLYPH: Record<TaskState, { char: string; label: string; color: string }> = {
  "needs-you": { char: "●", label: "Needs you", color: "var(--color-veri-status-needs-you)" },
  running: { char: "◐", label: "Running", color: "var(--color-veri-status-context)" },
  waiting: { char: "○", label: "Waiting on others", color: "var(--color-ct-muted)" },
  done: { char: "✓", label: "Done", color: "var(--color-veri-status-done)" },
};

/** M24: "URGENCY PILL right-aligned: rose '2d late', amber 'today', grey
 *  later, green 'done'. Only the late one is loud." */
export type Urgency = "late" | "today" | "later" | "done";

const URGENCY: Record<Urgency, { bg: string; fg: string; loud: boolean }> = {
  // The only loud one, per M24, and used sparingly.
  late: { bg: "#F7EDF1", fg: "var(--color-veri-status-late)", loud: true },
  today: { bg: "#FBF3E8", fg: "var(--color-veri-status-needs-you)", loud: false },
  later: { bg: "var(--color-ct-cloud)", fg: "var(--color-ct-muted)", loud: false },
  done: { bg: "#EDF4F0", fg: "var(--color-veri-status-done)", loud: false },
};

export type TaskRow = {
  id: string;
  state: TaskState;
  /** Line 1, and it must begin with a TASK_VERB. */
  verb: TaskVerb;
  /** The rest of line 1: "variation VO-014". */
  object: string;
  /** M24: "line 2 <amount> . <who> . <where> ... Line 2 is the DECIDING
   *  information - without it the user clicks in to find out, which is the
   *  load being removed." Shown for "Needs you" rows only. */
  detail?: string;
  urgency: Urgency;
  urgencyLabel: string;
  /** The chain this task carries. Clicking LOADS it. */
  chain: Chain;
  route?: string;
};

export type TaskTabId = "home" | "approval-pending" | "in-queue" | "completed" | "history";

export type TaskTab = {
  id: TaskTabId;
  label: string;
  /** M24: "Completed and History carry no count - nothing there needs action." */
  count?: number;
};

export type TaskMasterProps = {
  tabs: TaskTab[];
  activeTab: TaskTabId;
  onTabChange: (id: TaskTabId) => void;
  /** M24: GROUPED BY WHOSE MOVE IT IS, NOT BY DATE. */
  needsYou: TaskRow[];
  waitingOnOthers: TaskRow[];
  /** Loads the chain and opens the screen. NEVER executes -- same rule as
   *  history, and the same ChainLoad type that cannot express execution. */
  onLoad: (load: ChainLoad) => void;
};

function UrgencyPill({ urgency, label }: { urgency: Urgency; label: string }) {
  const u = URGENCY[urgency];
  return (
    <span
      className="ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[10px]"
      style={{ background: u.bg, color: u.fg, fontWeight: u.loud ? 600 : 500 }}
    >
      {label}
    </span>
  );
}

function Row({ row, twoLine, onLoad }: { row: TaskRow; twoLine: boolean; onLoad: (l: ChainLoad) => void }) {
  const g = GLYPH[row.state];
  const line1 = `${row.verb} ${row.object}`;
  return (
    <li>
      <button
        type="button"
        onClick={() => onLoad(loadChain(row.chain, row.route))}
        className="flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-[var(--color-ct-cloud)]"
      >
        {/* FIXED COLUMN. The glyph never moves, so the eye can scan it. */}
        <span
          aria-hidden
          className="mt-[2px] w-3.5 shrink-0 text-center text-[11px]"
          style={{ color: g.color }}
        >
          {g.char}
        </span>
        <span className="sr-only">{g.label}. </span>

        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex items-center gap-2">
            <span
              className="truncate"
              style={{ fontSize: "12.5px", color: "var(--color-ct-navy)" }}
              title={line1.length > LINE1_MAX ? line1 : undefined}
            >
              {line1}
            </span>
            <UrgencyPill urgency={row.urgency} label={row.urgencyLabel} />
          </span>
          {twoLine && row.detail && (
            <span className="truncate" style={{ fontSize: "11px", color: "var(--color-ct-muted)" }}>
              {row.detail}
            </span>
          )}
        </span>
      </button>
    </li>
  );
}

export function TaskMaster({ tabs, activeTab, onTabChange, needsYou, waitingOnOthers, onLoad }: TaskMasterProps) {
  return (
    <div className="flex h-full min-h-0 flex-col" style={{ background: "var(--color-ct-cream)" }}>
      {/* HEADER TABS WITH LIVE COUNTS, using the kit's existing .veri-view-tab
          + .veri-view-badge -- exactly what M24-B says Task Master's header
          needs, rather than new CSS. */}
      {/* WRAPS, never scrolls horizontally. Fixed 2026-08-26 after looking at
          the live shell: in the 30% pane these five tabs overflowed, so
          "History" rendered as "Hi" behind a horizontal scrollbar. M24 is
          explicit that the answer to a name not fitting is never to widen the
          pane -- so the row wraps to a second line instead, and no label is
          ever clipped. flex-wrap + whitespace-nowrap together mean a tab moves
          down whole rather than being cut in half. */}
      <div
        className="flex shrink-0 flex-wrap items-center gap-x-1 gap-y-0.5 border-b px-2 py-1.5"
        style={{ borderColor: "var(--color-ct-border)" }}
        role="tablist"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={activeTab === t.id}
            onClick={() => onTabChange(t.id)}
            className={`veri-view-tab shrink-0 whitespace-nowrap${activeTab === t.id ? " active" : ""}`}
          >
            {t.label}
            {/* M24: live counts so the user knows before clicking. Completed and
                History pass no count at all -- nothing there needs action --
                and a zero count renders no badge, because a row of "0" badges
                is noise, not information. */}
            {typeof t.count === "number" && t.count > 0 && <span className="veri-view-badge">{t.count}</span>}
          </button>
        ))}
      </div>

      {/* *** M24: "PIN THE 'NEEDS YOU' GROUP so it is never the part that
          scrolls under the expanded composer." *** It is therefore OUTSIDE the
          scroll container below, not merely first inside it. */}
      <div className="shrink-0 px-2 pt-2">
        <p className="px-2 pb-1 text-[11px] font-semibold" style={{ color: "var(--color-ct-navy)" }}>
          Needs you
        </p>
        {needsYou.length === 0 ? (
          <p className="px-2 pb-2 text-[11.5px]" style={{ color: "var(--color-ct-muted)" }}>
            Nothing is waiting on you.
          </p>
        ) : (
          <ul className="space-y-0.5">
            {needsYou.slice(0, VISIBLE_ROWS).map((r) => (
              <Row key={r.id} row={r} twoLine onLoad={onLoad} />
            ))}
          </ul>
        )}
      </div>

      {/* THE HARD DIVIDER between "whose move it is". */}
      <div className="mx-2 my-2 h-px shrink-0" style={{ background: "var(--color-ct-border2)" }} />

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        <p className="px-2 pb-1 text-[11px] font-semibold" style={{ color: "var(--color-ct-muted)" }}>
          Waiting on others
        </p>
        {waitingOnOthers.length === 0 ? (
          <p className="px-2 text-[11.5px]" style={{ color: "var(--color-ct-muted)" }}>
            Nothing outstanding with anyone else.
          </p>
        ) : (
          <ul className="space-y-0.5">
            {waitingOnOthers.map((r) => (
              // ONE-LINE for waiting. The density difference is itself a
              // signal about which group matters (M24).
              <Row key={r.id} row={r} twoLine={false} onLoad={onLoad} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
