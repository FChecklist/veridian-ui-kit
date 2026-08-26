// ---------------------------------------------------------------------------
// M24 SHELL (cc_spec point 187). The two-pane frame ruled on 22 Aug.
// ---------------------------------------------------------------------------
export { AppShell, LEFT_PANE_PERCENT } from "./AppShell";
export type { AppShellProps } from "./AppShell";
export { TopRail, ALL_PROJECTS_LABEL } from "./TopRail";
export type { TopRailProps, TopRailProject } from "./TopRail";
export { Composer, COMPOSER_RESTING_HEIGHT, COMPOSER_MAX_HEIGHT_VH } from "./Composer";
export type { ComposerProps } from "./Composer";
export { ControlStrip } from "./ControlStrip";
export type { ControlStripProps } from "./ControlStrip";
export { HistoryDrop } from "./HistoryDrop";
export type { HistoryDropProps } from "./HistoryDrop";
export { TaskMaster, TASK_VERBS, VISIBLE_ROWS, LINE1_MAX, LINE2_MAX } from "./TaskMaster";
export type { TaskMasterProps, TaskRow, TaskTab, TaskTabId, TaskState, TaskVerb, Urgency } from "./TaskMaster";
export { RightPaneHeader } from "./RightPaneHeader";
export type { RightPaneHeaderProps, Revision } from "./RightPaneHeader";

// The chain, and M24's two safety-critical rules. Every consumer must route
// (x) through cutChainFrom() and every history/task click through loadChain().
export {
  CHAIN_MODES,
  DEFAULT_CHAIN_MODE,
  HISTORY_VISIBLE_LIMIT,
  canCutAt,
  chainKey,
  chainToSentence,
  cutChainFrom,
  firstCuttableIndex,
  loadChain,
  prepareHistory,
  resetChain,
} from "./chain";
export type { Chain, ChainLoad, ChainMode, ChainSegment, HistoryEntry, SegmentKind } from "./chain";

// ---------------------------------------------------------------------------
// PHASE C -- the pill set (M24 / MP-RULE-3 / MP-RISK-2 / MP-RISK-3).
// ---------------------------------------------------------------------------
export { PillStrip, selectPill } from "./PillStrip";
export type { PillStripProps, PillSelection } from "./PillStrip";
export { OptionChain } from "./OptionChain";
export type { OptionChainProps, ChainOption } from "./OptionChain";
export {
  UNIVERSAL_PILLS,
  MERGED_TASKS_PILL,
  TASKS_PILL_MERGED,
  VISIBLE_PILLS,
  WINDOW_DAYS,
  rankPills,
  renderedPillSet,
} from "./pillConfig";
export type { PillDef, PillKey, PillUsage } from "./pillConfig";

// ---------------------------------------------------------------------------
// PRE-M24 SHELL. Still exported for products that have not migrated.
// PROJEXA moves to AppShell above; M24 deletes its left rail entirely
// ("HOME = THE GROUPED MODULE DIRECTORY, rendered in the RIGHT pane. It
// REPLACES the left rail, which is why the rail could be deleted at all").
// Do not use these in new PROJEXA work.
// ---------------------------------------------------------------------------
export { AppShellFrame } from "./AppShellFrame";
export type { AppShellFrameProps } from "./AppShellFrame";
export { AppSidebar } from "./AppSidebar";
export type { AppSidebarProps, NavItem, NavSection, MiddleColumnToggle } from "./AppSidebar";
export { AppHeader } from "./AppHeader";
export type { AppHeaderProps } from "./AppHeader";
export { HomeGreeting } from "./HomeGreeting";
export type { HomeGreetingProps, HomeStat } from "./HomeGreeting";
export { useResizableWidth } from "./useResizable";
