// Tests for the shared prompt-pattern module. Pure unit tests -- the
// repo-specific hooks are fakes, so these verify the runner's SEQUENCE and
// branching (refusal never reaches a model; success records; failure
// records + rethrows; options merge) without touching any real DB or LLM.

import { describe, expect, it, mock } from "bun:test";
import {
  getPromptPattern,
  listPromptPatternKeys,
  runPromptPattern,
  refusalMessageFor,
  type PromptPatternHooks,
} from "./index";

function makeHooks(overrides: Partial<PromptPatternHooks> = {}): PromptPatternHooks {
  return {
    resolvePrompt: mock(async () => "SYSTEM PROMPT"),
    resolveModel: mock(async () => ({
      provider: "openrouter",
      model: "glm-5.2",
      apiKey: "k",
      fallback: { provider: "openrouter", model: "gpt-oss-120b", apiKey: "k2" },
    })),
    enforcePolicy: mock(() => ({ allowed: true, category: "ok" as const })),
    recordExecution: mock(() => {}),
    callLLMJson: mock(async () => ({
      data: { summary: "s", suggestedWorkItems: [] },
      usage: { promptTokens: 10, completionTokens: 5 },
      durationMs: 42,
    })),
    ...overrides,
  };
}

describe("catalog", () => {
  it("registers the ticket-intelligence + email-intelligence proof patterns", () => {
    const keys = listPromptPatternKeys();
    expect(keys).toContain("ticket_intelligence.detect");
    expect(keys).toContain("email_intelligence.detect");
  });

  it("throws on an unknown pattern key (fails loud, no silent default)", () => {
    expect(() => getPromptPattern("does.not.exist")).toThrow(/Unknown prompt pattern/);
  });

  it("every pattern has a unique key + a positive version", () => {
    const seen = new Set<string>();
    for (const p of [
      getPromptPattern("ticket_intelligence.detect"),
      getPromptPattern("email_intelligence.detect"),
    ]) {
      expect(seen.has(p.key)).toBe(false);
      seen.add(p.key);
      expect(p.version).toBeGreaterThan(0);
      expect(p.templateKey.length).toBeGreaterThan(0);
      expect(p.layerKey.length).toBeGreaterThan(0);
    }
  });
});

describe("runPromptPattern", () => {
  it("runs the full sequence on an allowed request and records a completed row", async () => {
    const hooks = makeHooks();
    const outcome = await runPromptPattern<{ summary: string; suggestedWorkItems: unknown[] }>({
      patternKey: "ticket_intelligence.detect",
      orgId: "org-1",
      userId: "user-1",
      userMessage: "Ticket: cannot log in",
      extraInput: { ticketIntelligenceItemId: "ti-1" },
      hooks,
    });

    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.data.summary).toBe("s");
      expect(outcome.model).toBe("glm-5.2");
    }
    // Sequence: resolveModel -> resolvePrompt -> enforcePolicy -> callLLMJson -> recordExecution
    expect(hooks.resolveModel).toHaveBeenCalledTimes(1);
    expect(hooks.resolvePrompt).toHaveBeenCalledWith("ticket_intelligence.detect");
    expect(hooks.enforcePolicy).toHaveBeenCalledTimes(1);
    expect(hooks.callLLMJson).toHaveBeenCalledTimes(1);
    expect(hooks.recordExecution).toHaveBeenCalledTimes(1);
    const recorded = hooks.recordExecution.mock.calls[0][0];
    expect(recorded.status).toBe("completed");
    expect(recorded.input).toMatchObject({ ticketIntelligenceItemId: "ti-1" });
    expect(recorded.layerKey).toBe("task_oa");
    expect(recorded.eventType).toBe("ticket_intelligence.detect");
  });

  it("returns a refusal + never calls the LLM when policy denies", async () => {
    const hooks = makeHooks({
      enforcePolicy: mock(() => ({
        allowed: false,
        category: "personal_use",
        reason: "matched: recipe for",
      })),
    });
    const outcome = await runPromptPattern<{ x: unknown }>({
      patternKey: "ticket_intelligence.detect",
      orgId: "org-1",
      userMessage: "give me a recipe for dinner",
      hooks,
    });

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.refused).toBe(true);
      expect(outcome.decision.category).toBe("personal_use");
      // refusal message must NOT echo the matched pattern source
      expect(outcome.message).not.toContain("recipe for");
    }
    // The model was never reached: zero tokens, zero cost.
    expect(hooks.callLLMJson).not.toHaveBeenCalled();
    // enforcePolicy's own impl logs the denial in the real repo; this
    // runner does not double-log a denial (it returns before recordExecution).
    expect(hooks.recordExecution).not.toHaveBeenCalled();
  });

  it("records a failed row and rethrows when the LLM call throws", async () => {
    const hooks = makeHooks({
      callLLMJson: mock(async () => {
        throw new Error("provider 500");
      }),
    });
    await expect(
      runPromptPattern<{ x: unknown }>({
        patternKey: "ticket_intelligence.detect",
        orgId: "org-1",
        userMessage: "hi",
        hooks,
      })
    ).rejects.toThrow(/provider 500/);

    expect(hooks.recordExecution).toHaveBeenCalledTimes(1);
    const recorded = hooks.recordExecution.mock.calls[0][0];
    expect(recorded.status).toBe("failed");
    expect(recorded.output).toMatchObject({ error: "provider 500" });
  });

  it("throws a clear error when no provider is configured (no silent fallback)", async () => {
    const hooks = makeHooks({
      resolveModel: mock(async () => null),
    });
    await expect(
      runPromptPattern<{ x: unknown }>({
        patternKey: "ticket_intelligence.detect",
        orgId: "org-1",
        userMessage: "hi",
        hooks,
      })
    ).rejects.toThrow(/No AI provider configured/);
    expect(hooks.resolvePrompt).not.toHaveBeenCalled();
    expect(hooks.callLLMJson).not.toHaveBeenCalled();
  });

  it("merges caller options over the pattern's defaults (caller wins)", async () => {
    const hooks = makeHooks();
    await runPromptPattern<{ x: unknown }>({
      patternKey: "email_intelligence.detect",
      orgId: "org-1",
      userMessage: "classify this",
      options: { maxTokens: 999 },
      hooks,
    });
    const opts = hooks.callLLMJson.mock.calls[0][5];
    // pattern default temperature 0.2 preserved, caller maxTokens 999 wins
    expect(opts).toMatchObject({ temperature: 0.2, maxTokens: 999 });
  });
});

describe("refusalMessageFor", () => {
  it("returns empty for an allowed decision", () => {
    expect(refusalMessageFor({ allowed: true, category: "ok" })).toBe("");
  });
  it("never echoes the matched reason for a personal_use denial", () => {
    const msg = refusalMessageFor({
      allowed: false,
      category: "personal_use",
      reason: "matched: /\\brecipe for\\b/i",
    });
    expect(msg.length).toBeGreaterThan(0);
    expect(msg).not.toContain("recipe");
    expect(msg).not.toContain("/");
  });
});
