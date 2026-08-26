// M24 + MP-RULE-3 + MP-RISK-2 + MP-RISK-3. The pill set and its ordering.
//
// M24, VERBATIM: "ALL 14 UNIVERSAL PILLS STAY. *** CHAT PROPOSED DROPPING
// Projects/Customers/Vendors/Teams because the rails now own them. RAJAT
// OVERRULED AND WAS RIGHT: a rail costs a mouse journey to the screen edge; a
// pill costs a Tab. The rule that prevents confusion is NOT 'one door per
// thing' - it is 'THE SAME NAME MUST REACH THE SAME DESTINATION IN THE SAME
// STATE, WHICHEVER PATH YOU TOOK.' Two paths to one place is how every good
// tool works. ***"
//
// The 14 below are platform.mode_pills WHERE scope='UNIVERSAL', in its own
// sort_order. Those rows were set to AGREED on 2026-08-26 as a RECORD
// CORRECTION -- they had read PROPOSED only because no session updated the
// table when Rajat ruled.

export type PillKey =
  | "customers"
  | "vendors"
  | "projects"
  | "minutes_of_meeting"
  | "reports"
  | "analysis"
  | "email"
  | "policies"
  | "department"
  | "teams"
  | "calendar"
  | "task_master"
  | "to_do"
  | "other";

export type PillDef = {
  key: PillKey;
  label: string;
  sortOrder: number;
  /** M24: "THE 'OTHER' PILL (free text) IS THE SAFETY NET - a new user who does
   *  not know the vocabulary types a sentence and the classifier builds the
   *  chain, which then TEACHES by appearing in the strip." */
  isFreeText?: boolean;
};

export const UNIVERSAL_PILLS: PillDef[] = [
  { key: "customers", label: "Customers", sortOrder: 10 },
  { key: "vendors", label: "Vendors", sortOrder: 20 },
  { key: "projects", label: "Projects", sortOrder: 30 },
  { key: "minutes_of_meeting", label: "Minutes of Meeting", sortOrder: 40 },
  { key: "reports", label: "Reports", sortOrder: 50 },
  { key: "analysis", label: "Analysis", sortOrder: 60 },
  { key: "email", label: "Email", sortOrder: 70 },
  { key: "policies", label: "Policies", sortOrder: 80 },
  { key: "department", label: "Department", sortOrder: 90 },
  { key: "teams", label: "Teams", sortOrder: 100 },
  { key: "calendar", label: "Calendar", sortOrder: 110 },
  { key: "task_master", label: "Task Master", sortOrder: 120 },
  { key: "to_do", label: "To Do", sortOrder: 130 },
  { key: "other", label: "Other", sortOrder: 999, isFreeText: true },
];

/**
 * MP-RISK-2 -- "TASK MASTER vs TO DO is the confusable pair". This is RAJAT'S
 * ONLY OPEN DECISION on the pill set, and R52's instruction is explicit: do not
 * block on it, ship M24's recorded recommendation, and put it behind a single
 * constant so he can flip it in one line either way.
 *
 * true  = ONE pill "Tasks", with a My/All toggle in the right pane.
 * false = the two separate pills exactly as platform.mode_pills stores them.
 *
 * The DATABASE keeps both rows either way. This flag only changes what is
 * RENDERED, so flipping it loses nothing.
 */
export const TASKS_PILL_MERGED = true;

export const MERGED_TASKS_PILL: PillDef = { key: "task_master", label: "Tasks", sortOrder: 120 };

/** The pill set as actually rendered, after MP-RISK-2 is applied. */
export function renderedPillSet(merged: boolean = TASKS_PILL_MERGED): PillDef[] {
  if (!merged) return [...UNIVERSAL_PILLS];
  return UNIVERSAL_PILLS.filter((p) => p.key !== "task_master" && p.key !== "to_do")
    .concat(MERGED_TASKS_PILL)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

// ---------------------------------------------------------------------------
// RANKING -- MP-RULE-3, and the two fixes M24 says stop being optional at 80
// modules.
// ---------------------------------------------------------------------------

/** M24: "nobody sees 25 pills; they see their top five or six. That IS the load
 *  reduction." */
export const VISIBLE_PILLS = 6;

export const WINDOW_DAYS = 7;

/** One row of compliance.pill_usage, as R53 defines it (handshake, claude_log
 *  id=28). Ranking is computed from these; it is never a stored rank. */
export type PillUsage = {
  pillKey: PillKey;
  /** Epoch ms. */
  lastUsedAt: number;
  useCount: number;
  pinned: boolean;
};

/**
 * MP-RULE-3, with both of M24's mandatory fixes. The order is THREE TIERS and
 * the third one is not optional:
 *
 *   1. PINNED FIRST, ANY AGE. M24: "PINNED PILLS NEVER DECAY."
 *   2. Inside the rolling 7-day window, by use_count.
 *   3. OUTSIDE the window, by last-used-ever, to fill the remaining slots.
 *
 * Tier 3 is MP-RISK-3: "THE 7-DAY WINDOW CANNOT SEE PERIODIC WORK". M24 spells
 * out the consequence of dropping it -- "otherwise month-end work vanishes for
 * three weeks". A month-end reconciliation used heavily on the 30th is invisible
 * from the 8th onward if the window is the only tier.
 *
 * R53 computes the authoritative order in SQL (handshake id=28, note (a):
 * "THE RANKING IS A QUERY, NOT A STORED NUMBER"). This function is the same
 * order expressed once in TypeScript so the browser can render a set it has
 * already been given, and so the rule is testable without a database. It must
 * not diverge from R53's query.
 *
 * `now` is injected rather than read from the clock so this is deterministic
 * and the 8-days-of-non-use case can actually be tested.
 */
export function rankPills(
  usage: PillUsage[],
  now: number,
  opts: { limit?: number; merged?: boolean } = {}
): PillDef[] {
  const limit = opts.limit ?? VISIBLE_PILLS;
  const set = renderedPillSet(opts.merged);
  const byKey = new Map(set.map((p) => [p.key, p]));
  const windowStart = now - WINDOW_DAYS * 24 * 60 * 60 * 1000;

  // Only usage for pills that are actually rendered. When Tasks is merged,
  // to_do usage would otherwise rank a pill that is not on screen.
  const rows = usage.filter((u) => byKey.has(u.pillKey));

  const pinned = rows.filter((r) => r.pinned).sort((a, b) => b.lastUsedAt - a.lastUsedAt);
  const rest = rows.filter((r) => !r.pinned);

  const inWindow = rest
    .filter((r) => r.lastUsedAt >= windowStart)
    .sort((a, b) => b.useCount - a.useCount || b.lastUsedAt - a.lastUsedAt);

  const outOfWindow = rest
    .filter((r) => r.lastUsedAt < windowStart)
    .sort((a, b) => b.lastUsedAt - a.lastUsedAt);

  const ordered: PillDef[] = [];
  const seen = new Set<PillKey>();
  for (const r of [...pinned, ...inWindow, ...outOfWindow]) {
    if (seen.has(r.pillKey)) continue;
    seen.add(r.pillKey);
    ordered.push(byKey.get(r.pillKey)!);
    if (ordered.length >= limit) return ordered;
  }

  // M24: "EMPTY STATES MUST PROMPT, NEVER LOOK BROKEN ... pills default to
  // Sumeet's own module order." A user with no usage at all still gets a full,
  // sensibly-ordered strip rather than an empty one.
  for (const p of set) {
    if (seen.has(p.key)) continue;
    seen.add(p.key);
    ordered.push(p);
    if (ordered.length >= limit) break;
  }
  return ordered;
}
