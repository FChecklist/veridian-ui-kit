// Phase C DONE test: "classification NEVER authorizes -- prove a pill
// selection alone cannot perform a write."
//
// The proof is structural, not behavioural. A test that clicked a pill and then
// checked no row appeared would only prove that THIS build does not write --
// the next edit could add one. Instead the value a pill click produces is
// asserted to have no capability on it at all: no function, no token, nothing
// that could reach a server. To make a pill write, you would have to change the
// type, which is the tripwire.

import { describe, expect, it } from "bun:test";
import { selectPill } from "./PillStrip";
import { UNIVERSAL_PILLS } from "./pillConfig";

const projects = UNIVERSAL_PILLS.find((p) => p.key === "projects")!;
const other = UNIVERSAL_PILLS.find((p) => p.key === "other")!;

describe("a pill selection cannot authorize anything", () => {
  it("carries authorizes:false", () => {
    expect(selectPill(projects).authorizes).toBe(false);
  });

  it("exposes NO callable member -- there is nothing on it that could perform a write", () => {
    const sel = selectPill(projects) as unknown as Record<string, unknown>;
    const keys = Object.keys(sel);
    expect(keys.length).toBeGreaterThan(0);
    for (const k of keys) {
      expect(typeof sel[k]).not.toBe("function");
    }
  });

  it("carries no endpoint, url, token or method that a caller could dispatch", () => {
    const sel = selectPill(projects) as unknown as Record<string, unknown>;
    for (const forbidden of ["url", "endpoint", "href", "method", "token", "apiKey", "execute", "run", "submit"]) {
      expect(sel).not.toHaveProperty(forbidden);
    }
  });

  it("is true for every pill in the set, not just the one we happened to pick", () => {
    for (const p of UNIVERSAL_PILLS) {
      const sel = selectPill(p);
      expect(sel.authorizes).toBe(false);
      expect(sel.pillKey).toBe(p.key);
    }
  });

  it("marks the free-text Other pill, M24's safety net, without granting it more power", () => {
    expect(selectPill(other).isFreeText).toBe(true);
    expect(selectPill(other).authorizes).toBe(false);
    expect(selectPill(projects).isFreeText).toBe(false);
  });
});
