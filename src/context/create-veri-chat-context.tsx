"use client";

// The shared VERI Chat state machine -- ported from VERIDIAN AI OS's real
// veri-chat-context.tsx (compliance-tracker), which itself documents the
// core design insight this factory preserves exactly: two INDEPENDENT axes.
// `composerMode` answers "what am I about to DO" (drives the composer);
// `rightPanelView` (generic name here: `activeView`) answers "what am I
// currently LOOKING AT" (drives the panel's list) -- switching one must
// never disturb the other. Opening a specific task or conversation is the
// one thing genuinely shared between them, since continuing it requires
// both sides to agree on what's open.
//
// DELIBERATE SCOPE BOUNDARY (see veridian-ui-kit's own README / the plan
// this package was built from): this factory owns the STATE MACHINE shape
// only. It never fetches data itself -- every data source (the capability
// tree, tasks/queries, conversations, todos) is supplied by the consuming
// product as a callback, so VERIDIAN AI OS keeps calling its own
// /api/capability-tree + /api/tasks and PROJEXA keeps calling its own
// /api/capability-tree (proxied to VERIDIAN) + /api/assistant -- neither
// product's real business logic (dynamic-chain dedup, high-impact-action
// confirmation, FDE fallback, multi-thread AI conversations) lives here.
// Those stay in each product's own service layer, wrapped around the
// callbacks this factory exposes.
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { CapabilityNode } from "./types";
import { FIXED_MODES } from "./types";

export type VeriChatState<PanelView extends string = string> = {
  tree: CapabilityNode[];
  treeLoading: boolean;
  composerMode: string;
  setComposerMode: (mode: string) => void;
  activeTaskId: string | null;
  activeConversationId: string | null;
  openTask: (id: string) => void;
  openConversation: (id: string) => void;
  closeThread: () => void;
  isThreadOpen: boolean;
  activeView: PanelView;
  setActiveView: (v: PanelView) => void;
  refreshCounter: number;
  bumpRefresh: () => void;
};

export type CreateVeriChatContextOptions<PanelView extends string> = {
  /** Fetches the capability tree for the (optional) current module scope -- pass the product's own `/api/capability-tree` call. Re-invoked whenever the route's top-level path segment changes, mirroring VERIDIAN's real module-scoping behavior (capability-tree-service.ts's MODULE_SCOPE_TOP_LEVEL_KEYS). Return `[]` on any error; this factory never throws out of a failed fetch. */
  fetchTree: (moduleScope: string | undefined) => Promise<CapabilityNode[]>;
  /** The panel view to land on for a mode with no chain-selector equivalent view (e.g. "chats"/"todo" force that same view when picked from the composer, matching the mockup's `applyComposerMode`). Defaults to "overview". */
  defaultView?: PanelView;
  /** Initial composer mode -- VERIDIAN defaults to "tasks", PROJEXA to "discuss". Defaults to "discuss" if unset (the safest baseline -- always renders even with an empty capability tree). */
  defaultComposerMode?: string;
};

/**
 * Builds one product's own `{ VeriChatProvider, useVeriChat }` pair. A
 * factory (not a shared singleton context) so multiple products in the same
 * monorepo-of-git-dependencies never collide on the same React context
 * identity, and so each product's `PanelView` union can differ (PROJEXA's
 * "queries" vs VERIDIAN's "tasks" label, VERIDIAN's extra "meetings"/
 * "approvals"/"voice" tabs) while sharing this exact state-machine code.
 */
export function createVeriChatContext<PanelView extends string = "overview" | "tasks" | "chats" | "todo">(
  options: CreateVeriChatContextOptions<PanelView>
) {
  const VeriChatContext = createContext<VeriChatState<PanelView> | null>(null);

  function moduleFromPathname(pathname: string | null): string | undefined {
    if (!pathname) return undefined;
    const segment = pathname.split("/").filter(Boolean)[0];
    return segment || undefined;
  }

  function VeriChatProvider({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const moduleScope = moduleFromPathname(pathname);
    const [tree, setTree] = useState<CapabilityNode[]>([]);
    const [treeLoading, setTreeLoading] = useState(true);
    const [composerMode, setComposerModeState] = useState(options.defaultComposerMode ?? "discuss");
    const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const defaultView = (options.defaultView ?? "overview") as PanelView;
    const [activeView, setActiveView] = useState<PanelView>(defaultView);
    const [refreshCounter, setRefreshCounter] = useState(0);

    useEffect(() => {
      let cancelled = false;
      setTreeLoading(true);
      options
        .fetchTree(moduleScope)
        .then((nodes) => { if (!cancelled) setTree(nodes); })
        .catch(() => { if (!cancelled) setTree([]); })
        .finally(() => { if (!cancelled) setTreeLoading(false); });
      return () => { cancelled = true; };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [moduleScope]);

    const setComposerMode = (mode: string) => {
      setComposerModeState(mode);
      setActiveTaskId(null);
      setActiveConversationId(null);
      if (mode === "chats") setActiveView("chats" as PanelView);
      else if (mode === "todo") setActiveView("todo" as PanelView);
    };

    const openTask = (id: string) => {
      setActiveTaskId(id);
      setActiveConversationId(null);
      setComposerModeState("tasks");
    };

    const openConversation = (id: string) => {
      setActiveConversationId(id);
      setActiveTaskId(null);
      setComposerModeState("chats");
    };

    const closeThread = () => {
      setActiveTaskId(null);
      setActiveConversationId(null);
    };

    const bumpRefresh = () => setRefreshCounter((c) => c + 1);

    const value = useMemo<VeriChatState<PanelView>>(
      () => ({
        tree, treeLoading, composerMode, setComposerMode,
        activeTaskId, activeConversationId, openTask, openConversation, closeThread,
        isThreadOpen: Boolean(activeTaskId || activeConversationId),
        activeView, setActiveView, refreshCounter, bumpRefresh,
      }),
      [tree, treeLoading, composerMode, activeTaskId, activeConversationId, activeView, refreshCounter]
    );

    return <VeriChatContext.Provider value={value}>{children}</VeriChatContext.Provider>;
  }

  function useVeriChat(): VeriChatState<PanelView> {
    const ctx = useContext(VeriChatContext);
    if (!ctx) throw new Error("useVeriChat must be used within its matching VeriChatProvider");
    return ctx;
  }

  function useVeriChatOptional(): VeriChatState<PanelView> | null {
    return useContext(VeriChatContext);
  }

  return { VeriChatProvider, useVeriChat, useVeriChatOptional };
}

export { FIXED_MODES };
export type { CapabilityNode, PathSegment } from "./types";
