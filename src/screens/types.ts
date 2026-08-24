// R42 seq21 (M28/M29/M30/M31) -- the shared shape every screen archetype
// component in this directory renders from. Mirrors
// compliance.screen_definitions/screen_drafts (R42 seq20) field-for-field so
// a consuming app can pass a fetched row straight in with no reshaping.

export type FieldStatus = "REQUIRED" | "OPTIONAL" | "SUPPRESSED";
export type DocumentLevel = "org" | "header" | "item" | "schedule";
export type Importance = "High" | "Medium" | "Low";

export type ScreenColumn = {
  label: string;
  field: string;
  type: string;
  control?: "RADIO" | "CHECKBOX" | "SELECT" | "COMBOBOX" | "MULTISELECT" | "DATE" | "NUMBER" | "TEXT" | "DERIVED" | "HIDDEN";
  optionsSource?: string;
  options?: { value: string; label: string }[]; // resolved options, when the consuming app has already fetched optionsSource
  defaultValue?: unknown;
  required?: boolean;
  unit?: string;
  importance?: Importance;
  derivedFrom?: string;
  fieldStatus?: FieldStatus;
  inheritsFromHeader?: boolean;
  level?: DocumentLevel;
};

export type ScreenAction = { label: string; kind: string; enabledWhen?: string };

export type ScreenArchetype = "LIST" | "OBJECT" | "FORM" | "DASHBOARD" | "REPORT" | "TIMELINE" | "COMPARE" | "CUSTOM";

export type ScreenDefinition = {
  functionId: string;
  archetype: ScreenArchetype;
  dataSource: string;
  columns: ScreenColumn[];
  filters?: unknown;
  actions?: ScreenAction[] | null;
  drillTo?: string | null;
  breadcrumbTemplate?: string | null;
  flowParent?: string | null;
  flowChildren?: string[] | null;
  createWithReference?: string | null;
};

// M31: every document knows its ancestors/children.
export type DocumentFlowLink = { label: string; href: string };
export type DocumentFlowData = {
  from: DocumentFlowLink[]; // what this came from
  to: DocumentFlowLink[]; // what came from this
};

// M24/M31: status shown at both header and item level, glyph + colour, never colour alone.
export type StatusTone = "needs-you" | "running" | "waiting" | "done" | "late" | "neutral";

export type MessageLevel = "error" | "warning" | "success" | "info";
export type FieldMessage = { field?: string; level: MessageLevel; text: string };

// M29 draft lifecycle, mirrors screen_drafts.
export type DraftState<T = Record<string, unknown>> = {
  id: string;
  payload: T;
  lockExpiresAt: string | null; // ISO
  lockedByOther?: { userId: string; lockExpiresAt: string } | null;
};

export const EMPTY_VALUE_DISPLAY = "–"; // en-dash, GLOBAL: "empty values render as the en-dash, never blank"
