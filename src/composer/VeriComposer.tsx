"use client";

// The persistent bottom composer -- same DOM position on every page, mounted
// once by the consuming product's own AppShellFrame usage, never remounted
// on navigation. Ported from the mockup's composer bar + VERIDIAN AI OS's
// real VeriComposer.tsx, scoped to exactly the mockup's behavior: mode
// pills -> chain-selector rows -> queue -> send. Deliberately does NOT
// include VERIDIAN's more advanced, product-specific real features (the
// high-impact-action confirmation dialog, FDE "capability not available"
// fallback, multi-thread AI switcher, VCEL calculator input fields) -- those
// are real business logic belonging to VERIDIAN's own task-execution engine,
// not a generic UI shell concern. A product that wants them wraps its own
// `onDispatch`/`onSendMessage` callback with that logic; this component
// never needs to know it exists.
import { useEffect, useRef, useState } from "react";
import { Send, Loader2, Plus } from "lucide-react";
import type { CapabilityNode, PathSegment } from "../context/types";
import { FIXED_MODES } from "../context/types";
import { ChainRows, expandPathsForSend, nodeChildrenAt, pathDisplayString, pathSegmentDisplay } from "./ChainSelector";

const DEFAULT_FIXED_LABELS: Record<string, string> = { discuss: "Discuss", chats: "Chats", todo: "To Do" };

export type QueuedItem = { path: PathSegment[]; text: string; display: string };

export type VeriComposerProps = {
  tree: CapabilityNode[];
  treeLoading: boolean;
  composerMode: string;
  setComposerMode: (mode: string) => void;
  isThreadOpen: boolean;
  onCloseThread: () => void;
  /** Called once a chain is complete (>= 2 levels selected) and the user sends -- one call per concrete path (a multi-select segment fans out to several). The product supplies its own real dispatch (POST /api/tasks, confirmation dialogs, whatever it needs) here. */
  onDispatch: (path: PathSegment[], text: string) => Promise<void>;
  /** Called for Discuss / open-thread free-text sends. */
  onSendMessage: (text: string) => Promise<void>;
  /** Override the 3 fixed-mode labels (e.g. PROJEXA could rename "Chats" if it ever needed to -- not currently used, kept for parity). */
  fixedLabels?: Record<string, string>;
  /** Minimum chain depth required before a chain counts as "complete" -- VERIDIAN enforces 2 (a category + a sub-option) both client- and server-side; defaults to 2 to match. */
  minChainDepth?: number;
};

function resolveLeaf(tree: CapabilityNode[], path: PathSegment[]): CapabilityNode | null {
  let level = tree;
  let node: CapabilityNode | null = null;
  for (const seg of path) {
    if (typeof seg !== "string") return null;
    const found = level.find((n) => n.key === seg);
    if (!found) return null;
    node = found;
    level = found.children ?? [];
  }
  return node;
}

export function VeriComposer({
  tree, treeLoading, composerMode, setComposerMode, isThreadOpen, onCloseThread,
  onDispatch, onSendMessage, fixedLabels, minChainDepth = 2,
}: VeriComposerProps) {
  const labels = { ...DEFAULT_FIXED_LABELS, ...fixedLabels };
  const [selectedPath, setSelectedPath] = useState<PathSegment[]>([]);
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const [queue, setQueue] = useState<QueuedItem[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const chainModes = tree.filter((n) => !FIXED_MODES.includes(n.key as never)).map((n) => n.key);
  const isChainMode = chainModes.includes(composerMode) || composerMode === "tasks";

  function preseedKeyForMode(mode: string): string | null {
    if (mode === "tasks") return null;
    const node = tree.find((n) => n.key === mode);
    return node ? node.key : null;
  }

  // Re-seed the chain whenever the mode changes.
  useEffect(() => {
    const preseed = preseedKeyForMode(composerMode);
    setSelectedPath(preseed ? [preseed] : []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [composerMode]);

  const { children: currentChildren } = tree.length ? nodeChildrenAt(tree, selectedPath, selectedPath.length) : { children: [] };
  const chainComplete = !treeLoading && (currentChildren === null || (currentChildren?.length ?? 0) === 0) && selectedPath.length > 0;
  const completedLeaf = chainComplete && tree.length ? resolveLeaf(tree, selectedPath) : null;

  function toggleSingle(depth: number, key: string) {
    setSelectedPath((prev) => {
      const atDepth = prev[depth];
      if (typeof atDepth === "string" && atDepth === key) return prev.slice(0, depth);
      return [...prev.slice(0, depth), key];
    });
  }
  function toggleMulti(depth: number, key: string) {
    setSelectedPath((prev) => {
      const atDepth = prev[depth];
      const current = atDepth && typeof atDepth !== "string" ? atDepth.values : [];
      const has = current.includes(key);
      const nextVals = has ? current.filter((v) => v !== key) : [...current, key];
      const base = prev.slice(0, depth);
      return nextVals.length ? [...base, { multi: true, values: nextVals }] : base;
    });
  }

  function resetChain() {
    const preseed = preseedKeyForMode(composerMode);
    setSelectedPath(preseed ? [preseed] : []);
  }

  async function send() {
    if (sending) return;
    const text = value.trim();

    if (isThreadOpen || composerMode === "discuss") {
      if (!text) return;
      setSending(true);
      try {
        await onSendMessage(text);
        setValue("");
      } finally {
        setSending(false);
      }
      return;
    }

    if (isChainMode && chainComplete) {
      if (selectedPath.length < minChainDepth) return;
      if (!text) return;
      setSending(true);
      try {
        await onDispatch(selectedPath, text);
        setValue("");
        resetChain();
      } finally {
        setSending(false);
      }
    }
  }

  function queueCurrent() {
    const text = value.trim();
    if (!text || !chainComplete || selectedPath.length < minChainDepth) return;
    setQueue((q) => [...q, { path: selectedPath, text, display: pathDisplayString(selectedPath) }]);
    setValue("");
    resetChain();
  }

  async function sendAllQueued() {
    const items = queue;
    setQueue([]);
    setSending(true);
    try {
      for (const item of items) await onDispatch(item.path, item.text);
    } finally {
      setSending(false);
    }
  }

  const disabled = !isThreadOpen && composerMode !== "discuss" && composerMode !== "chats" && !(isChainMode && chainComplete);
  const placeholder = isThreadOpen
    ? "Message…"
    : composerMode === "discuss"
      ? "Ask me anything — no task selection needed…"
      : composerMode === "chats"
        ? "Pick a conversation to start typing"
        : chainComplete
          ? "Tell your AI Assistant what to do…"
          : "Select a task above to begin…";

  return (
    <div className="shrink-0 border-t border-ct-border bg-white/95 backdrop-blur px-6 py-3">
      <div className="w-full max-w-5xl mx-auto">
        {/* Mode pills */}
        <div className="inline-flex flex-wrap gap-0.5 rounded-full bg-ct-cloud p-1 mb-2">
          {FIXED_MODES.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setComposerMode(m)}
              className={`veri-mode-pill${composerMode === m && !isThreadOpen ? " active" : ""}`}
            >
              {labels[m]}
            </button>
          ))}
          {tree.filter((n) => !FIXED_MODES.includes(n.key as never)).map((n) => (
            <button
              key={n.key}
              type="button"
              onClick={() => setComposerMode(n.key)}
              className={`veri-mode-pill${composerMode === n.key && !isThreadOpen ? " active" : ""}`}
            >
              {n.label}
            </button>
          ))}
        </div>

        {isChainMode && !isThreadOpen && (
          <div className="rounded-2xl border border-scope-tint-border bg-scope-tint px-4 py-2.5 mb-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[13px] font-semibold text-ct-navy">Select the task you want me to do.</span>
              <span className={`text-[11px] font-medium shrink-0 ml-2 ${chainComplete ? "text-emerald-700" : "text-ct-muted"}`}>
                {selectedPath.length ? (chainComplete ? "" : "Building: ") + pathDisplayString(selectedPath) : ""}
              </span>
            </div>
            <ChainRows tree={tree} selectedPath={selectedPath} onToggleSingle={toggleSingle} onToggleMulti={toggleMulti} />
          </div>
        )}

        {queue.length > 0 && isChainMode && !isThreadOpen && (
          <div className="rounded-xl border border-ct-border bg-ct-cloud/50 px-3 py-2 mb-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-ct-slate">Queued</span>
              <button type="button" onClick={sendAllQueued} className="text-[11px] font-semibold text-ct-saffron">
                Send all ({queue.length})
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {queue.map((item, idx) => (
                <span key={idx} className="veri-qchip">
                  {item.display} — {item.text.length > 24 ? item.text.slice(0, 24) + "…" : item.text}
                  <button type="button" onClick={() => setQueue((q) => q.filter((_, i) => i !== idx))} className="text-ct-muted hover:text-red-500">
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className={`rounded-2xl border border-ct-border bg-white shadow-sm px-4 pt-3 pb-2.5${disabled ? " veri-composer-disabled" : ""}`}>
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full bg-transparent text-[15px] text-ct-navy placeholder:text-ct-muted focus:outline-none resize-none max-h-[160px] overflow-y-auto disabled:cursor-not-allowed"
          />
          <div className="flex items-center justify-end gap-2 mt-2">
            {isChainMode && !isThreadOpen && (
              <button
                type="button"
                onClick={queueCurrent}
                disabled={!chainComplete || !value.trim()}
                title="Stage this and start another instruction"
                className="px-3 h-9 rounded-lg text-[12.5px] font-semibold text-ct-slate border border-ct-border hover:bg-ct-cloud disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1"
              >
                <Plus className="size-3.5" /> Add another
              </button>
            )}
            <button
              type="button"
              onClick={send}
              disabled={disabled || sending || !value.trim()}
              className="grid size-9 place-items-center rounded-lg bg-ct-saffron text-white hover:bg-ct-saffron-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-[18px]" />}
            </button>
          </div>
        </div>
        <p className="text-[11px] text-ct-muted mt-1.5 px-1">
          {isThreadOpen
            ? "Enter sends"
            : isChainMode
              ? chainComplete
                ? "Enter sends, chain resets after each message"
                : `Complete the chain above (at least ${minChainDepth} levels) to start typing`
              : composerMode === "discuss"
                ? "Enter sends — ask anything, no task selection needed"
                : composerMode === "chats"
                  ? "Pick a conversation to start typing"
                  : "Add items in the To Do panel"}
        </p>

        {isThreadOpen && (
          <button type="button" onClick={onCloseThread} className="text-[11.5px] font-semibold text-ct-saffron mt-1">
            Back
          </button>
        )}
      </div>
    </div>
  );
}

export { expandPathsForSend, pathDisplayString, pathSegmentDisplay };
