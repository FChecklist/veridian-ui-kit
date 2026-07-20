// Versioned catalog of named prompt patterns. Each entry pins the
// construction shape (templateKey + layerKey + eventType + default call
// options) for one canonical LLM call site, so an adopting repo's call
// site stops hand-writing that shape and instead references a key here.
//
// Adding a pattern is additive and never changes an existing one -- bump
// `version` if a shape materially changes, and keep the old version's
// entry reachable (callers may have pinned it) until no call site uses it.
//
// The first two entries mirror compliance-tracker's real 6-step call sites
// (ticket-intelligence-service.ts, email-intelligence-service.ts -- the two
// "intelligence" siblings with identical call shape) and exist as the
// proof-of-adoption shape for V2-4. Note classifyTask() in team-service.ts
// is deliberately NOT mirrored here: it uses platformOpenRouterKey()
// directly with no enforcePolicy/recordOrchestraExecution step, so a catalog
// entry claiming to mirror it would be a false claim and adopting it would
// change that site's behavior -- both violate V2-4's CONSTRAINTS. Projexa
// has no prompt-construction sites today (see PROGRESS.md / the
// ACTIVE-CLAIMS finding) so it contributes no entries yet -- when it does,
// they land here and every repo immediately shares them.

import type { PromptPattern } from "./types";

export const PROMPT_PATTERNS: readonly PromptPattern[] = [
  {
    key: "ticket_intelligence.detect",
    version: 1,
    description:
      "Detect suggested work items from a support-ticket conversation transcript. " +
      "Returns { summary, suggestedWorkItems }. Mirrors compliance-tracker's " +
      "src/lib/services/ticket-intelligence-service.ts call site.",
    templateKey: "ticket_intelligence.detect",
    layerKey: "task_oa",
    eventType: "ticket_intelligence.detect",
    defaultOptions: { temperature: 0.2, maxTokens: 700 },
  },
  {
    key: "email_intelligence.detect",
    version: 1,
    description:
      "Detect suggested work items from an email conversation transcript. " +
      "Returns { summary, suggestedWorkItems }. Mirrors compliance-tracker's " +
      "src/lib/services/email-intelligence-service.ts call site -- the sibling " +
      "of ticket_intelligence.detect with an identical call shape.",
    templateKey: "email_intelligence.detect",
    layerKey: "task_oa",
    eventType: "email_intelligence.detect",
    defaultOptions: { temperature: 0.2, maxTokens: 700 },
  },
] as const;

const BY_KEY = new Map(PROMPT_PATTERNS.map((p) => [p.key, p]));

/**
 * Look up a pattern by key. Throws (fails loud) on an unknown key -- a
 * missing pattern is a real configuration error, not something to paper
 * over with a silent default, the same posture prompt-os-resolver.ts takes
 * for an unknown templateKey.
 */
export function getPromptPattern(key: string): PromptPattern {
  const pattern = BY_KEY.get(key);
  if (!pattern) throw new Error(`Unknown prompt pattern: ${key}`);
  return pattern;
}

/** All registered pattern keys, for tests + catalog drift detection. */
export function listPromptPatternKeys(): string[] {
  return PROMPT_PATTERNS.map((p) => p.key);
}
