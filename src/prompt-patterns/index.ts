// Public surface of @fchecklist/veridian-ui-kit/prompt-patterns.
//
// Server-side only. See types.ts for the scope-boundary rationale (this is
// the shared cross-repo prompt-PATTERN module from SUPERBOSS v2 TASK V2-4;
// it owns the call SEQUENCE + JSON wrapper + versioned catalog, and
// delegates repo-specific steps to injected PromptPatternHooks).

export { runPromptPattern, refusalMessageFor } from "./runner";
export {
  getPromptPattern,
  listPromptPatternKeys,
  PROMPT_PATTERNS,
} from "./catalog";
export type {
  PromptPatternHooks,
  PolicyEnforcementContext,
  PolicyDecision,
  LLMUsage,
  CallLLMOptions,
  RecordExecutionInput,
  PatternRefusal,
  PatternResult,
  PatternOutcome,
  PromptPattern,
  RunPromptPatternInput,
} from "./types";
