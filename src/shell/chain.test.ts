// M24's two SAFETY-CRITICAL rules, tested as rules rather than as rendering.
// M24 calls them safety-critical rather than cosmetic, so they are asserted
// here against the pure functions the components are required to route
// through -- a rule proven only through a component is a rule that holds only
// on the render path that happened to be exercised.

import { describe, expect, it } from "bun:test";
import {
  canCutAt,
  chainKey,
  chainToSentence,
  cutChainFrom,
  firstCuttableIndex,
  loadChain,
  prepareHistory,
  resetChain,
  type Chain,
  type HistoryEntry,
} from "./chain";

const chain: Chain = {
  mode: "projects",
  segments: [
    { id: "oakwood", label: "Oakwood", kind: "root" },
    { id: "scope", label: "Scope", kind: "action" },
    { id: "import-boq", label: "Import BOQ", kind: "step" },
  ],
};

const rootStillThere = (c: Chain) =>
  c.segments.length >= 1 && c.segments[0]!.kind === "root" && c.segments[0]!.id === "oakwood";

describe("RULE 1 -- (x) MUST NEVER REMOVE THE PROJECT", () => {
  it("offers no (x) on the root", () => {
    expect(canCutAt(chain, 0)).toBe(false);
    expect(firstCuttableIndex(chain)).toBe(1);
  });

  it("offers (x) on the action and the step", () => {
    expect(canCutAt(chain, 1)).toBe(true);
    expect(canCutAt(chain, 2)).toBe(true);
  });

  it("cuts from the step onward", () => {
    const out = cutChainFrom(chain, 2);
    expect(out.segments.map((s) => s.id)).toEqual(["oakwood", "scope"]);
  });

  it("cuts from the action onward", () => {
    const out = cutChainFrom(chain, 1);
    expect(out.segments.map((s) => s.id)).toEqual(["oakwood"]);
  });

  it("KEEPS THE PROJECT when asked to cut at the root", () => {
    const out = cutChainFrom(chain, 0);
    expect(rootStillThere(out)).toBe(true);
    expect(out.segments.map((s) => s.id)).toEqual(["oakwood"]);
  });

  it("KEEPS THE PROJECT for every hostile index, including negatives and overruns", () => {
    for (const i of [-999, -1, 0, 1, 2, 3, 99, Number.MAX_SAFE_INTEGER]) {
      const out = cutChainFrom(chain, i);
      expect(rootStillThere(out)).toBe(true);
    }
  });

  it("KEEPS THE PROJECT on reset -- reset is not an escape hatch either", () => {
    const out = resetChain(chain);
    expect(rootStillThere(out)).toBe(true);
    expect(out.mode).toBe("projects");
  });

  it("never changes the mode as a side effect of a cut", () => {
    expect(cutChainFrom({ ...chain, mode: "vendors" }, 1).mode).toBe("vendors");
  });

  it("is a no-op on a chain that is only a root", () => {
    const only: Chain = { mode: "projects", segments: [chain.segments[0]!] };
    expect(cutChainFrom(only, 0).segments).toHaveLength(1);
    expect(canCutAt(only, 0)).toBe(false);
  });
});

describe("RULE 2 -- A HISTORY OR TASK CLICK LOADS AND STOPS", () => {
  it("produces a load that cannot express execution", () => {
    const load = loadChain(chain, "/scope");
    expect(load.executes).toBe(false);
    expect(load.chain).toEqual(chain);
    expect(load.route).toBe("/scope");
  });

  it("ALSO SETS MODE, so the strip never contradicts itself", () => {
    expect(loadChain({ ...chain, mode: "customers" }).mode).toBe("customers");
  });

  it("exposes no callable that could fire the action", () => {
    const load = loadChain(chain) as unknown as Record<string, unknown>;
    for (const k of Object.keys(load)) {
      expect(typeof load[k]).not.toBe("function");
    }
  });
});

describe("history list", () => {
  const mk = (id: string, at: number, extra: Partial<HistoryEntry> = {}): HistoryEntry => ({
    chain: { mode: "projects", segments: [chain.segments[0]!, { id, label: id, kind: "step" }] },
    pinned: false,
    failed: false,
    lastUsedAt: at,
    ...extra,
  });

  it("DEDUPLICATES -- running Daily entry six times leaves ONE row", () => {
    const six = [1, 2, 3, 4, 5, 6].map((n) => mk("daily-entry", n));
    const { recent } = prepareHistory(six);
    expect(recent).toHaveLength(1);
    expect(recent[0]!.lastUsedAt).toBe(6);
  });

  it("keeps a pin through a dedup, so a later unpinned run cannot silently unpin", () => {
    const { pinned } = prepareHistory([mk("a", 1, { pinned: true }), mk("a", 9)]);
    expect(pinned).toHaveLength(1);
    expect(pinned[0]!.lastUsedAt).toBe(9);
  });

  it("INCLUDES FAILED CHAINS", () => {
    const { recent } = prepareHistory([mk("boom", 1, { failed: true })]);
    expect(recent).toHaveLength(1);
    expect(recent[0]!.failed).toBe(true);
  });

  it("shows five or six, never twenty", () => {
    const twenty = Array.from({ length: 20 }, (_, i) => mk(`s${i}`, i));
    expect(prepareHistory(twenty).recent.length).toBeLessThanOrEqual(6);
  });

  it("does not let pinned entries be squeezed out by the limit", () => {
    const many = Array.from({ length: 20 }, (_, i) => mk(`s${i}`, i));
    const { pinned } = prepareHistory([...many, mk("old-but-pinned", 0, { pinned: true })]);
    expect(pinned.map((p) => p.chain.segments[1]!.id)).toContain("old-but-pinned");
  });
});

describe("the grammar reads as ONE SENTENCE", () => {
  it("renders ENTITY > ACTION > STEP", () => {
    expect(chainToSentence(chain)).toBe("Oakwood > Scope > Import BOQ");
  });

  it("keys the same words under a different root as a different task", () => {
    expect(chainKey(chain)).not.toBe(chainKey({ ...chain, mode: "vendors" }));
  });
});
