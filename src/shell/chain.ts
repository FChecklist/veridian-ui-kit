// M24 (claude_log id=13) -- the task chain, and the two rules M24 calls
// safety-critical rather than cosmetic. Both live here, as pure functions,
// deliberately: a rule enforced inside a component is a rule that is only
// true on the render path that happens to call it. These are the shapes the
// components are not allowed to work around.
//
// THE GRAMMAR IS ENTITY > ACTION > STEP, and M24 records why it generalises:
//   Oakwood        > Scope         > Import BOQ     (project-rooted)
//   Skyline Builders > Quotation   > Create         (customer-rooted)
//   Rajesh Kumar   > Payroll       > Run October    (employee-rooted)
//   October 2026   > Reconciliation > Close         (period-rooted)
// "One sentence shape. A user who learns the strip once has learned every
// module that will ever be added. TEST EVERY FUTURE CHANGE AGAINST: does it
// still read as one sentence?"

/** The entity a chain roots on. M24: sticky WITHIN a session, resets on a new one. */
export type ChainMode = "projects" | "customers" | "vendors";

export const CHAIN_MODES: { id: ChainMode; label: string }[] = [
  { id: "projects", label: "Projects" },
  { id: "customers", label: "Customers" },
  { id: "vendors", label: "Vendors" },
];

/** M24: "MODE ... RESETS to Projects on a new session, so nobody returns to a
 *  view they forgot they set." */
export const DEFAULT_CHAIN_MODE: ChainMode = "projects";

export type SegmentKind =
  /** The entity root -- the project (or customer/vendor). NEVER removable. */
  | "root"
  /** What is being done to it: Scope, Material, Payroll. */
  | "action"
  /** The specific step: Import BOQ, Daily entry, Run October. */
  | "step";

export type ChainSegment = {
  id: string;
  label: string;
  kind: SegmentKind;
};

export type Chain = {
  mode: ChainMode;
  segments: ChainSegment[];
};

/**
 * M24, VERBATIM: "IT MUST NEVER REMOVE THE PROJECT. The divider after Mode
 * marks that boundary. A user who resets and silently loses project context
 * will act on the wrong project."
 *
 * The index of the first segment `(x)` is allowed to cut at. Everything at or
 * before the root is protected. Returns segments.length when there is nothing
 * cuttable, which callers read as "no (x) anywhere".
 */
export function firstCuttableIndex(chain: Chain): number {
  const lastRoot = chain.segments.map((s) => s.kind).lastIndexOf("root");
  return lastRoot + 1;
}

/** Whether `(x)` may be offered on the segment at `index`. */
export function canCutAt(chain: Chain, index: number): boolean {
  if (index < 0 || index >= chain.segments.length) return false;
  return index >= firstCuttableIndex(chain);
}

/**
 * Cut the chain from `index` onward -- M24's replacement for a Back button,
 * "shown on the thing being removed".
 *
 * SAFETY: a cut that would reach into the root is CLAMPED to the first
 * cuttable index, never applied. It does not throw and it does not silently
 * do nothing either: the caller gets a chain with the root intact and
 * everything after it gone, which is the nearest safe reading of the intent.
 * The root and the mode survive every possible argument, including a
 * negative index or one past the end.
 */
export function cutChainFrom(chain: Chain, index: number): Chain {
  const floor = firstCuttableIndex(chain);
  const at = Math.max(floor, Math.min(index, chain.segments.length));
  return { mode: chain.mode, segments: chain.segments.slice(0, at) };
}

/**
 * The (reset) glyph at the far end of the strip. M24 puts it "deliberately far
 * from HISTORY, which is the most-clicked control on the strip" -- and even
 * this does not drop the root, for the same reason (x) cannot.
 */
export function resetChain(chain: Chain): Chain {
  return cutChainFrom(chain, 0);
}

/** Renders the chain as the one sentence M24 requires it to read as. */
export function chainToSentence(chain: Chain): string {
  return chain.segments.map((s) => s.label).join(" > ");
}

/** Stable identity for dedup + history lookups. Mode is part of it, because
 *  the same words under a different root are a different task. */
export function chainKey(chain: Chain): string {
  return `${chain.mode}::${chain.segments.map((s) => `${s.kind}:${s.id}`).join(">")}`;
}

// ---------------------------------------------------------------------------
// HISTORY
// ---------------------------------------------------------------------------

export type HistoryEntry = {
  chain: Chain;
  pinned: boolean;
  /** M24: "INCLUDE FAILED CHAINS - the commonest reason to re-run something is
   *  that it went wrong." A failed entry is shown, not hidden. */
  failed: boolean;
  /** Epoch ms. Most recent wins on dedup. */
  lastUsedAt: number;
};

/** M24: "Five or six entries, never twenty." */
export const HISTORY_VISIBLE_LIMIT = 6;

/**
 * M24: "DEDUPLICATE. Running Daily entry six times leaves ONE row. The list is
 * 'things I do'." Pinned entries sort above a divider, then recent. The most
 * recent occurrence of a duplicate wins, and a duplicate that is pinned in any
 * of its occurrences stays pinned.
 */
export function prepareHistory(entries: HistoryEntry[], limit = HISTORY_VISIBLE_LIMIT): {
  pinned: HistoryEntry[];
  recent: HistoryEntry[];
} {
  const byKey = new Map<string, HistoryEntry>();
  for (const e of entries) {
    const k = chainKey(e.chain);
    const prev = byKey.get(k);
    if (!prev) {
      byKey.set(k, e);
      continue;
    }
    byKey.set(k, {
      ...(e.lastUsedAt >= prev.lastUsedAt ? e : prev),
      // Pinned survives the merge: a pin is a user decision, and losing it to
      // a later unpinned run would silently un-pin something they chose.
      pinned: prev.pinned || e.pinned,
    });
  }
  const all = [...byKey.values()].sort((a, b) => b.lastUsedAt - a.lastUsedAt);
  const pinned = all.filter((e) => e.pinned);
  // The limit governs the unpinned tail. Pinned entries are explicit user
  // choices and are not what "never twenty" is protecting against.
  const recent = all.filter((e) => !e.pinned).slice(0, limit);
  return { pinned, recent };
}

// ---------------------------------------------------------------------------
// THE LOAD-NEVER-EXECUTE CONTRACT
// ---------------------------------------------------------------------------

/**
 * M24, VERBATIM: "A HISTORY CLICK LOADS THE CHAIN AND STOPS. IT MUST NEVER
 * EXECUTE. Pills selected, right pane opened, cursor in the box - but the
 * action does not fire. 'Material > Inbound receipt' clicked by accident and
 * executed would write a real record. That single rule is the difference
 * between a shortcut and a hazard."
 *
 * This type is the contract in the type system. A history or task click hands
 * back a ChainLoad and nothing else -- there is deliberately no callback, no
 * `execute`, and no `submit` on it, so a future component CANNOT wire one up
 * without changing this file and reading this comment.
 */
export type ChainLoad = {
  chain: Chain;
  /** M24: "A history click ALSO SETS MODE, so the strip never contradicts
   *  itself." Carried explicitly rather than left to the caller to remember. */
  mode: ChainMode;
  /** Where the right pane should navigate. Opening a screen is a read. */
  route?: string;
  /** Always false. Present so the invariant is legible at every call site and
   *  so a grep for `executes` finds this comment rather than nothing. */
  readonly executes: false;
};

/** The ONLY way to build a ChainLoad. There is no variant that executes. */
export function loadChain(chain: Chain, route?: string): ChainLoad {
  return { chain, mode: chain.mode, route, executes: false };
}
