// Shared capability-tree / chain-selector types. Identical shape to what
// both VERIDIAN AI OS's and PROJEXA's own veri-chat-context.tsx already
// define independently today -- consolidated here so there's one type
// definition instead of two copies that can drift (PROJEXA's already
// dropped `engineKey`/`reportUrl`/`deterministic` compared to VERIDIAN's;
// re-adding them here costs nothing and removes that gap).
export type CapabilityInputField = {
  key: string;
  label: string;
  type: "number" | "text" | "select" | "number_list";
  optional?: boolean;
  options?: { value: string; label: string }[];
};

export type CapabilityNode = {
  key: string;
  label: string;
  leaf: boolean;
  multi?: boolean;
  codeReference?: string | null;
  projectId?: string | null;
  engineKey?: string | null;
  inputFields?: CapabilityInputField[];
  agentId?: string | null;
  fixedInputs?: Record<string, string>;
  reportUrl?: string | null;
  deterministic?: boolean;
  children?: CapabilityNode[];
};

export type PathSegment = string | { multi: true; values: string[] };

/** Every product's composer always has these 3 -- Discuss (free-text AI), Chats (human-to-human), To Do (a plain checklist, never routed through the assistant). Chain modes (Tasks + any product-specific dynamic modes like "Reports"/"Analysis"/"Email" in the mockup) are supplied per-product via the capability tree's own top-level nodes, not hardcoded here. */
export const FIXED_MODES = ["discuss", "chats", "todo"] as const;
export type FixedMode = (typeof FIXED_MODES)[number];

/** The 4 baseline right-panel tabs shown in the mockup -- Overview/Tasks/Chats/To Do. A product may extend this union with its own additional tabs (VERIDIAN's real product adds Meetings/Approvals/Voice) by widening `rightPanelView`'s type at the call site; the shared PanelShell component (see ../panel) renders whatever tab list it's given, it doesn't hardcode these 4. */
export const BASE_PANEL_VIEWS = ["overview", "tasks", "chats", "todo"] as const;
export type BasePanelView = (typeof BASE_PANEL_VIEWS)[number];
