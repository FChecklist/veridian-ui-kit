"use client";

// The hierarchical chain-selector -- rchip (single-select) / mchip
// (multi-select) rows that drill into a CapabilityNode tree, exactly the
// mockup's `renderChain()`/`rchip()`/`mchip()` behavior. Ported from
// VERIDIAN AI OS's real ChainSelector.tsx (compliance-tracker), which
// itself was extracted from an earlier private-to-VeriComposer copy for
// reuse -- this is that same reusable unit, one level further out (shared
// across products, not just across components within one product).
import type { CapabilityNode, PathSegment } from "../context/types";

export function pathSegmentDisplay(seg: PathSegment | undefined): string {
  if (seg == null) return "";
  if (typeof seg === "string") return seg;
  return "[" + seg.values.join(" + ") + "]";
}

export function pathDisplayString(path: PathSegment[]): string {
  return path.map(pathSegmentDisplay).join(" › ");
}

/** A multi-select segment fans out into N concrete (all-string) paths -- one dispatch per selected value. Only the FIRST multi segment in a path is expanded; a tree with two multi-select levels in one path is not a supported shape (matches VERIDIAN's real behavior). */
export function expandPathsForSend(path: PathSegment[]): string[][] {
  const multiIdx = path.findIndex((seg) => typeof seg !== "string");
  if (multiIdx === -1) return [path as string[]];
  const seg = path[multiIdx] as { multi: true; values: string[] };
  return seg.values.map((v) => {
    const copy = path.slice() as (string | typeof seg)[];
    copy[multiIdx] = v;
    return copy as string[];
  });
}

function realKeysOf(node: Record<string, unknown>): string[] {
  return Object.keys(node).filter((k) => !k.startsWith("__"));
}

/** Walks the tree along `path` up to `depth`, returning that depth's real children (or null if the path has already resolved to a leaf). Mirrors the mockup's own `nodeChildrenAt`. */
export function nodeChildrenAt(tree: CapabilityNode[], path: PathSegment[], depth: number): { children: CapabilityNode[] | null } {
  let level = tree;
  for (let i = 0; i < depth; i++) {
    const seg = path[i];
    if (typeof seg === "string") {
      const found = level.find((n) => n.key === seg);
      if (!found || found.leaf) return { children: null };
      level = found.children ?? [];
    } else if (seg) {
      const union = new Map<string, CapabilityNode>();
      seg.values.forEach((v) => {
        const found = level.find((n) => n.key === v);
        (found?.children ?? []).forEach((c) => union.set(c.key, c));
      });
      level = Array.from(union.values());
    }
  }
  return { children: level };
}

function Rchip({ label, selected, isLeaf, onClick }: { label: string; selected: boolean; isLeaf: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`veri-rchip${isLeaf ? " leaf" : ""}${selected ? " checked" : ""}`}
    >
      {label}
    </button>
  );
}

function Mchip({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: (next: boolean) => void }) {
  return (
    <label className={`veri-mchip${checked ? " checked" : ""}`}>
      <input type="checkbox" checked={checked} onChange={(e) => onToggle(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

export type ChainRowsProps = {
  tree: CapabilityNode[];
  selectedPath: PathSegment[];
  onToggleSingle: (depth: number, key: string) => void;
  onToggleMulti: (depth: number, key: string) => void;
  filterQuery?: string;
};

/** Renders every drilled-down row of the chain up to (and including) the first not-yet-resolved row -- the mockup's `renderChain()` loop, as a pure render (state lives in the parent composer). Each row's "is this multi-select" flag comes from the PARENT node whose children populate that row (e.g. the mockup's `Customer: { __multi: true, ... }` -- `Customer.multi === true` means its children render as checkboxes, not radio-chips), not from the row's own options. */
export function ChainRows({ tree, selectedPath, onToggleSingle, onToggleMulti, filterQuery }: ChainRowsProps) {
  const rows: { depth: number; parentLabel: string; options: CapabilityNode[]; isMulti: boolean }[] = [];
  let options: CapabilityNode[] = tree;
  let parentLabel = "";
  let parentIsMulti = false;

  for (let depth = 0; ; depth++) {
    if (!options || options.length === 0) break;
    rows.push({ depth, parentLabel, options, isMulti: parentIsMulti });
    const sel = selectedPath[depth];
    if (sel === undefined) break;
    if (typeof sel === "string") {
      const found = options.find((o) => o.key === sel);
      if (!found || found.leaf) break;
      parentLabel = found.label;
      parentIsMulti = Boolean(found.multi);
      options = found.children ?? [];
    } else {
      const union = new Map<string, CapabilityNode>();
      sel.values.forEach((v) => {
        const found = options.find((o) => o.key === v);
        (found?.children ?? []).forEach((c) => union.set(c.key, c));
      });
      parentLabel = "";
      parentIsMulti = false;
      options = Array.from(union.values());
    }
  }

  return (
    <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
      {rows.map((row) => {
        const query = (filterQuery ?? "").trim().toLowerCase();
        const visibleOptions = query ? row.options.filter((o) => o.label.toLowerCase().includes(query)) : row.options;
        return (
          <div key={row.depth} className="flex items-center gap-1.5 flex-wrap">
            {row.depth > 0 && (
              <span className="text-[10.5px] text-ct-muted shrink-0">{row.parentLabel}:</span>
            )}
            {row.isMulti
              ? visibleOptions.map((opt) => {
                  const sel = selectedPath[row.depth];
                  const currentValues = sel && typeof sel !== "string" ? sel.values : [];
                  return (
                    <Mchip
                      key={opt.key}
                      label={opt.label}
                      checked={currentValues.includes(opt.key)}
                      onToggle={() => onToggleMulti(row.depth, opt.key)}
                    />
                  );
                })
              : visibleOptions.map((opt) => {
                  const sel = selectedPath[row.depth];
                  const selectedHere = sel === opt.key;
                  return (
                    <Rchip
                      key={opt.key}
                      label={opt.label}
                      selected={selectedHere}
                      isLeaf={opt.leaf}
                      onClick={() => onToggleSingle(row.depth, opt.key)}
                    />
                  );
                })}
          </div>
        );
      })}
    </div>
  );
}
