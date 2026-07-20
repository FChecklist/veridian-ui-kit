// @fchecklist/veridian-ui-kit/prompt-patterns
//
// Shared cross-repo LLM prompt-pattern module (SUPERBOSS v2 plan, TASK
// V2-4-SHARED-PROMPT-PATTERNS, CSV row #60 "Worker Agent cross-repo prompt
// reuse"). Server-side ONLY -- has zero UI/DOM/React deps and must never
// acquire any; it deliberately lives outside the UI shell's own scope (see
// this package's README "Scope boundary"). Consumed by VERIDIAN AI OS
// (compliance-tracker) and, when it eventually adds local prompt
// construction, by PROJEXA -- so worker-agent prompts stop diverging by
// each repo independently re-inventing the same call sequence.
//
// WHAT THIS MODULE OWNS vs. WHAT IT DOES NOT:
//   - OWNS: the canonical step SEQUENCE a real LLM call site follows
//     (resolve-model -> build-user-message -> resolve-prompt ->
//     enforce-policy -> call-LLM -> record-execution), the JSON-mode call
//     wrapper, and a versioned catalog of named prompt patterns.
//   - DOES NOT OWN: the repo-specific implementations of each step.
//     `resolvePromptTemplate`, `resolveModelConfig`, `enforcePolicy`, and
//     `recordOrchestraExecution` are each deeply coupled to a consuming
//     repo's OWN database / tenant context / schema (compliance-tracker's
//     prompt_templates table, orchestra_layers, orchestraExecutions, RLS
//     tenant context) and physically cannot live here. They are INJECTED
//     via PromptPatternHooks, so this module never imports a consuming
//     repo's db/tenant code -- which is exactly what makes it shareable
//     across repos without dragging one repo's server deps into the other.
//
// ADDITIVE by design: adopting repos wire one call site through
// runPromptPattern() with their own hooks; the existing hand-written
// sequence at every other call site is untouched (no behavior change to
// in-scope prompts, per the task's CONSTRAINTS).

/**
 * A single repo-specific step a call site needs, injected so this module
 * stays repo-agnostic. Each hook mirrors the signature of the real
 * compliance-tracker function it delegates to (see
 * src/lib/prompt-os-resolver.ts, orchestra-model-resolver.ts,
 * policy-enforcement-engine.ts, orchestra-execution-logger.ts), so an
 * adopting repo's wiring is a thin shim, not a re-implementation.
 */
export type PromptPatternHooks = {
  /** Resolve the active, labeled version of a prompt template (system prompt). */
  resolvePrompt: (templateKey: string) => Promise<string>;
  /** Resolve the model/provider/apiKey for this org + orchestra layer. */
  resolveModel: (
    orgId: string,
    layerKey: string
  ) => Promise<{
    provider: string;
    model: string;
    apiKey: string;
    fallback?: { provider: string; model: string; apiKey: string };
  } | null>;
  /**
   * Pre-call Constitution gate (business-purpose / prompt-injection /
   * domain-validity). Returns .allowed=false to refuse BEFORE any LLM is
   * called -- a denial never reaches a model or costs tokens.
   */
  enforcePolicy: (ctx: PolicyEnforcementContext, userMessage: string) => PolicyDecision;
  /** Fire-and-forget observability row (one real LLM call = one row). */
  recordExecution: (params: RecordExecutionInput) => void;
  /** The actual LLM dispatch. JSON-mode variant for structured output. */
  callLLMJson: <T>(
    provider: string,
    model: string,
    apiKey: string,
    systemPrompt: string,
    userMessage: string,
    options?: CallLLMOptions,
    fallback?: { provider: string; model: string; apiKey: string }
  ) => Promise<{ data: T; usage: LLMUsage; durationMs: number }>;
};

/**
 * The policy gate's input context. Mirrors compliance-tracker's
 * PolicyEnforcementContext exactly (domain defaults to DEFAULT_DOMAIN when
 * omitted, layerKey/eventType are for the observability row).
 */
export type PolicyEnforcementContext = {
  orgId: string;
  userId?: string;
  clientId?: string;
  domain?: string;
  layerKey: string;
  eventType: string;
};

export type PolicyDecision = {
  allowed: boolean;
  category: "personal_use" | "prompt_injection" | "out_of_domain" | "ok";
  reason?: string;
};

export type LLMUsage = {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
};

export type CallLLMOptions = {
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  expectedKeys?: string[];
};

export type RecordExecutionInput = {
  orgId: string;
  clientId?: string;
  userId?: string;
  taskId?: string;
  layerKey: string;
  eventType: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  status: "completed" | "failed" | "denied" | "gated";
  durationMs: number;
  provider?: string;
  model?: string;
  usage?: LLMUsage;
  routingRationale?: string;
};

/**
 * A refusal returned by runPromptPattern() when the policy gate denies the
 * request before any LLM is called. Carries the user-facing message the
 * caller should surface (never echoes the denylist pattern that matched).
 */
export type PatternRefusal = {
  ok: false;
  refused: true;
  decision: PolicyDecision;
  message: string;
};

/** A successful structured-LLM-call result. */
export type PatternResult<T> = {
  ok: true;
  data: T;
  usage: LLMUsage;
  durationMs: number;
  provider: string;
  model: string;
};

export type PatternOutcome<T> = PatternRefusal | PatternResult<T>;

/**
 * A versioned, named prompt pattern from the catalog. The `version` field
 * lets consumers pin/observe which pattern shape produced a given output,
 * the same way prompt-os-resolver.ts versions template *content* -- this
 * versions the *construction shape* around it.
 */
export type PromptPattern = {
  key: string;
  version: number;
  description: string;
  templateKey: string;
  layerKey: string;
  eventType: string;
  defaultOptions?: CallLLMOptions;
};

/**
 * The single input to runPromptPattern(): which catalog pattern to run,
 * under whose tenant, with what user message, and which injected hooks to
 * use. `extraInput` is merged into the observability row's `input` (e.g.
 * the ticketIntelligenceItemId a caller wants recorded alongside the call).
 */
export type RunPromptPatternInput<T> = {
  patternKey: string;
  orgId: string;
  userId?: string;
  userMessage: string;
  extraInput?: Record<string, unknown>;
  options?: CallLLMOptions;
  hooks: PromptPatternHooks;
};
