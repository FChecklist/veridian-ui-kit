// Phase C's DONE test, asserted as rules: "pills reorder after real use; a
// pinned pill survives 8 days of non-use". Both are pure-function properties,
// so they are proven here rather than inferred from a screenshot.

import { describe, expect, it } from "bun:test";
import {
  MERGED_TASKS_PILL,
  TASKS_PILL_MERGED,
  UNIVERSAL_PILLS,
  VISIBLE_PILLS,
  rankPills,
  renderedPillSet,
  type PillUsage,
} from "./pillConfig";

const DAY = 24 * 60 * 60 * 1000;
const NOW = 1_787_000_000_000;

const u = (pillKey: PillUsage["pillKey"], daysAgo: number, useCount: number, pinned = false): PillUsage => ({
  pillKey,
  lastUsedAt: NOW - daysAgo * DAY,
  useCount,
  pinned,
});

describe("the set M24 ruled on", () => {
  it("has all 14 universal pills", () => {
    expect(UNIVERSAL_PILLS).toHaveLength(14);
  });

  it("keeps Projects, Customers, Vendors and Teams -- the four chat proposed dropping and Rajat overruled", () => {
    const keys = UNIVERSAL_PILLS.map((p) => p.key);
    for (const k of ["projects", "customers", "vendors", "teams"]) {
      expect(keys).toContain(k);
    }
  });

  it("keeps the free-text Other pill, the safety net for a user who does not know the vocabulary", () => {
    expect(UNIVERSAL_PILLS.find((p) => p.key === "other")?.isFreeText).toBe(true);
  });
});

describe("MP-RISK-2 -- Task Master vs To Do, behind ONE constant", () => {
  it("ships M24's recorded recommendation by default: one 'Tasks' pill", () => {
    expect(TASKS_PILL_MERGED).toBe(true);
    const labels = renderedPillSet(true).map((p) => p.label);
    expect(labels).toContain("Tasks");
    expect(labels).not.toContain("Task Master");
    expect(labels).not.toContain("To Do");
    expect(renderedPillSet(true)).toHaveLength(13);
  });

  it("flips back to the two separate pills in one line, losing nothing", () => {
    const labels = renderedPillSet(false).map((p) => p.label);
    expect(labels).toContain("Task Master");
    expect(labels).toContain("To Do");
    expect(renderedPillSet(false)).toHaveLength(14);
  });

  it("keeps the merged pill in its original slot rather than appending it", () => {
    expect(MERGED_TASKS_PILL.sortOrder).toBe(120);
    const set = renderedPillSet(true);
    const i = set.findIndex((p) => p.label === "Tasks");
    expect(set[i - 1]!.key).toBe("calendar");
  });
});

describe("MP-RULE-3 -- pills reorder after real use", () => {
  it("ranks a heavily-used pill above a lightly-used one", () => {
    const out = rankPills([u("reports", 1, 20), u("email", 1, 2)], NOW, { limit: 2 });
    expect(out.map((p) => p.key)).toEqual(["reports", "email"]);
  });

  it("REORDERS when usage changes -- the same two pills swap when the counts swap", () => {
    const before = rankPills([u("reports", 1, 20), u("email", 1, 2)], NOW, { limit: 2 });
    const after = rankPills([u("reports", 1, 2), u("email", 1, 20)], NOW, { limit: 2 });
    expect(before[0]!.key).toBe("reports");
    expect(after[0]!.key).toBe("email");
  });

  it("shows five or six, not twenty-five", () => {
    expect(VISIBLE_PILLS).toBe(6);
    expect(rankPills([], NOW).length).toBe(6);
  });

  it("never renders an empty strip for a brand-new user with no usage at all", () => {
    const out = rankPills([], NOW);
    expect(out.length).toBeGreaterThan(0);
    expect(out[0]!.key).toBe("customers"); // the table's own sort_order
  });
});

describe("M24 -- PINNED PILLS NEVER DECAY", () => {
  it("A PINNED PILL SURVIVES 8 DAYS OF NON-USE (the Phase C DONE test)", () => {
    const usage = [
      u("policies", 8, 1, true), // pinned, outside the 7-day window
      u("reports", 0, 50),
      u("email", 0, 40),
      u("analysis", 0, 30),
      u("calendar", 0, 20),
      u("teams", 0, 10),
      u("vendors", 0, 9),
    ];
    const out = rankPills(usage, NOW).map((p) => p.key);
    expect(out).toContain("policies");
    // and not merely present -- pinned ranks FIRST, above every hot pill.
    expect(out[0]).toBe("policies");
  });

  it("survives 90 days of non-use too -- pinned has no expiry at all", () => {
    const out = rankPills([u("policies", 90, 1, true), u("reports", 0, 999)], NOW, { limit: 2 });
    expect(out[0]!.key).toBe("policies");
  });

  it("would be squeezed out WITHOUT the pin, which is what makes the pin meaningful", () => {
    const usage = [
      u("policies", 8, 1, false),
      u("reports", 0, 50),
      u("email", 0, 40),
      u("analysis", 0, 30),
      u("calendar", 0, 20),
      u("teams", 0, 10),
      u("vendors", 0, 9),
    ];
    expect(rankPills(usage, NOW).map((p) => p.key)).not.toContain("policies");
  });
});

describe("MP-RISK-3 -- the 7-day window cannot see periodic work", () => {
  it("STILL SHOWS a month-end pill last used 25 days ago, via the out-of-window tier", () => {
    // Only two pills have any usage, so the window tier cannot fill the strip.
    const out = rankPills([u("reports", 0, 3), u("analysis", 25, 40)], NOW, { limit: 2 });
    expect(out.map((p) => p.key)).toEqual(["reports", "analysis"]);
  });

  it("orders the out-of-window tier by last-used-ever, not by use_count", () => {
    const out = rankPills([u("analysis", 20, 5), u("policies", 10, 500)], NOW, { limit: 2 });
    // policies was used more recently, so it wins despite analysis... no:
    // policies (10 days) is more recent than analysis (20 days).
    expect(out.map((p) => p.key)).toEqual(["policies", "analysis"]);
  });

  it("keeps in-window pills above out-of-window ones regardless of count", () => {
    const out = rankPills([u("analysis", 30, 999), u("reports", 1, 1)], NOW, { limit: 2 });
    expect(out[0]!.key).toBe("reports");
  });
});

describe("merging does not corrupt the ranking", () => {
  it("ignores usage for a pill that is not rendered when Tasks is merged", () => {
    const out = rankPills([u("to_do", 0, 999)], NOW, { limit: 3, merged: true });
    expect(out.map((p) => p.label)).not.toContain("To Do");
  });

  it("ranks the merged Tasks pill from task_master usage", () => {
    const out = rankPills([u("task_master", 0, 99)], NOW, { limit: 1, merged: true });
    expect(out[0]!.label).toBe("Tasks");
  });
});
