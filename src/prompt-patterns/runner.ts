// The canonical runner: executes one prompt pattern end-to-end through
// the 6-step sequence every real LLM call site should follow, using the
// repo-specific hooks the caller injects. This is the single place the
// sequence lives; adopting repos call this instead of hand-writing the
// sequence, which is the whole point of V2-4 (prompts stop diverging
// because there's one runner, not N copy-pasted sequences).
//
// Steps (the same ones ticket-intelligence-service.ts etc. hand-write):
//   1. resolveModel   -- model/provider/key, guard null (503)
//   2. resolvePrompt  -- versioned system prompt
//   3. enforcePolicy  -- Constitution gate, BEFORE any LLM call
//   4. callLLMJson    -- the actual structured-LLM call (json mode)
//   5. recordExecution -- observability row (completed | denied | failed)
//
// A policy refusal (step 3 denies) returns { ok:false, refused:true } and
// NEVER reaches a model -- zero tokens, zero cost, same guarantee
// policy-enforcement-engine.ts's own enforcePolicy() gives. The denial IS
// logged via recordExecution (status "denied"), matching enforcePolicy()'s
// own logging posture; a success is logged after the call returns.

import { getPromptPattern } from "./catalog";
import type {
  PatternOutcome,
  PolicyEnforcementContext,
  RecordExecutionInput,
  RunPromptPatternInput,
} from "./types";

export async function runPromptPattern<T>(
  input: RunPromptPatternInput<T>
): Promise<PatternOutcome<T>> {
  const pattern = getPromptPattern(input.patternKey);
  const options = { ...pattern.defaultOptions, ...input.options };

  // 1. Resolve model. No configured provider is a hard 503, not a fallback.
  const modelConfig = await input.hooks.resolveModel(input.orgId, pattern.layerKey);
  if (!modelConfig) {
    throw new Error(
      `No AI provider configured for organisation ${input.orgId} on layer ${pattern.layerKey}`
    );
  }

  // 2. Resolve the versioned system prompt.
  const systemPrompt = await input.hooks.resolvePrompt(pattern.templateKey);

  // 3. Policy gate, BEFORE any LLM call. The enforcement context carries
  //    the pattern's layerKey + eventType so the denial's observability
  //    row is attributable to the right place.
  const policyCtx: PolicyEnforcementContext = {
    orgId: input.orgId,
    userId: input.userId,
    layerKey: pattern.layerKey,
    eventType: pattern.eventType,
  };
  const decision = input.hooks.enforcePolicy(policyCtx, input.userMessage);
  if (!decision.allowed) {
    // Note: enforcePolicy()'s own implementation already logs the denial
    // (status "denied", zero cost) in compliance-tracker; we still return
    // the refusal here so the caller can surface refusalMessageFor(decision)
    // rather than proceeding to a model call.
    return {
      ok: false,
      refused: true,
      decision,
      message: refusalMessageFor(decision),
    };
  }

  // 4. The actual structured-LLM call.
  const startedAt = Date.now();
  let result;
  try {
    result = await input.hooks.callLLMJson<T>(
      modelConfig.provider,
      modelConfig.model,
      modelConfig.apiKey,
      systemPrompt,
      input.userMessage,
      options,
      modelConfig.fallback
    );
  } catch (err) {
    // 5. Record the failure (fire-and-forget), then rethrow -- the caller
    //    decides its own failure handling (e.g. mark the row analysis_failed),
    //    same as ticket-intelligence-service.ts's catch around callLLMJson.
    const failedInput: RecordExecutionInput = {
      orgId: input.orgId,
      userId: input.userId,
      layerKey: pattern.layerKey,
      eventType: pattern.eventType,
      input: { ...input.extraInput, userMessage: input.userMessage.slice(0, 500) },
      output: { error: err instanceof Error ? err.message : String(err) },
      status: "failed",
      durationMs: Date.now() - startedAt,
      provider: modelConfig.provider,
      model: modelConfig.model,
    };
    input.hooks.recordExecution(failedInput);
    throw err;
  }

  // 5. Record the successful execution (fire-and-forget).
  const completedInput: RecordExecutionInput = {
    orgId: input.orgId,
    userId: input.userId,
    layerKey: pattern.layerKey,
    eventType: pattern.eventType,
    input: { ...input.extraInput, userMessage: input.userMessage.slice(0, 500) },
    output: { data: result.data as unknown as Record<string, unknown> },
    status: "completed",
    durationMs: result.durationMs,
    provider: modelConfig.provider,
    model: modelConfig.model,
    usage: result.usage,
  };
  input.hooks.recordExecution(completedInput);

  return {
    ok: true,
    data: result.data,
    usage: result.usage,
    durationMs: result.durationMs,
    provider: modelConfig.provider,
    model: modelConfig.model,
  };
}

/**
 * User-facing refusal text. Mirrors compliance-tracker's
 * refusalMessageFor() shape: polite, explains scope, never echoes the
 * denylist pattern that matched (a matched pattern source is an internal
 * implementation detail and must not leak).
 */
export function refusalMessageFor(decision: {
  allowed: boolean;
  category: string;
  reason?: string;
}): string {
  if (decision.allowed) return "";
  switch (decision.category) {
    case "personal_use":
      return "I can only help with business tasks for your organization. This request looks like personal use, so I can't action it here.";
    case "prompt_injection":
      return "I can't follow instructions that try to override my guidelines or reveal my configuration. Let me know what business task I can help with.";
    case "out_of_domain":
      return "That falls outside the business domains I support on this platform.";
    default:
      return "I can't proceed with that request.";
  }
}
