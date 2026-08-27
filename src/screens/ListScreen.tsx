"use client";

// R42 seq21 (M28 LIST archetype) -- importance-driven columns (max 7 High),
// BACK RESTORES FILTERS+SORT+SCROLL+PAGE (mandatory, not deferred, per
// GLOBAL/M29). State restore is self-contained via sessionStorage keyed by
// functionId, so a consuming app gets this for free just by mounting the
// same ListScreen again after navigating back -- no router integration
// required of the caller.
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import type { ScreenColumn } from "./types";
import { EMPTY_VALUE_DISPLAY } from "./types";

const PAGE_SIZE = 25;
const MAX_HIGH_COLUMNS = 7; // M28

type ListState = {
  filters: Record<string, unknown>;
  sortField: string | null;
  sortDir: "asc" | "desc";
  scrollY: number;
  page: number;
};

function stateKey(functionId: string) {
  return `veri-list-state:${functionId}`;
}

function loadState(functionId: string): ListState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(stateKey(functionId));
    return raw ? (JSON.parse(raw) as ListState) : null;
  } catch {
    return null;
  }
}

function saveState(functionId: string, state: ListState) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(stateKey(functionId), JSON.stringify(state));
  } catch {
    // sessionStorage unavailable (private browsing etc) -- state restore is a convenience, never a hard requirement to render.
  }
}

export type ListScreenProps<T extends Record<string, unknown>> = {
  /** Used as the back-state-restore storage key -- must be stable per screen (the registry's own function_id). */
  functionId: string;
  columns: ScreenColumn[];
  rows: T[];
  getRowId: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyStateLabel?: string;
  /** Per-column custom cell renderer (e.g. a StatusBadge for a derived "days left" column) -- overrides the default text formatter for that field only. */
  renderCell?: Record<string, (row: T) => React.ReactNode>;
};

export function ListScreen<T extends Record<string, unknown>>({ functionId, columns, rows, getRowId, onRowClick, emptyStateLabel = "No records yet.", renderCell }: ListScreenProps<T>) {
  // R45 seq4 fix: sessionStorage must NEVER be read during the render that
  // produces the FIRST client output -- the server has no sessionStorage
  // (always renders these as null/"asc"/0), so reading it eagerly via
  // useMemo in the render body made the client's very first render diverge
  // from the server's, which is a real, deterministic hydration mismatch
  // every time a screen had ever saved state before (i.e. on literally
  // every back-navigation, the exact case this feature exists for). Both
  // renders now start from the SAME defaults the server used; the actual
  // restore happens in an effect (client-only, post-hydration, matching the
  // scroll-restore effect below), so the mismatch can't occur.
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Restore saved filters/sort/page/scroll once, after mount (never during
  // render/SSR). Runs before the save-effect below thanks to effect order.
  useEffect(() => {
    const restored = loadState(functionId);
    if (!restored) return;
    if (restored.sortField !== null) setSortField(restored.sortField);
    if (restored.sortDir) setSortDir(restored.sortDir);
    if (restored.page) setPage(restored.page);
    if (restored.scrollY && scrollRef.current) {
      scrollRef.current.scrollTop = restored.scrollY;
    }
    // Only on mount -- this is a one-time restore, not a live sync.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [functionId]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => saveState(functionId, { filters: {}, sortField, sortDir, scrollY: el.scrollTop, page });
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [functionId, sortField, sortDir, page]);

  useEffect(() => {
    saveState(functionId, { filters: {}, sortField, sortDir, scrollY: scrollRef.current?.scrollTop ?? 0, page });
  }, [functionId, sortField, sortDir, page]);

  // M28: importance-driven column selection -- High capped at 7, Medium/Low
  // included after (a real responsive drop-by-breakpoint is the consuming
  // app's container-query concern; this enforces the HARD cap M28 states).
  const visibleColumns = useMemo(() => {
    const high = columns.filter((c) => c.importance === "High").slice(0, MAX_HIGH_COLUMNS);
    const rest = columns.filter((c) => c.importance !== "High");
    return [...high, ...rest];
  }, [columns]);

  const sorted = useMemo(() => {
    if (!sortField) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = a[sortField];
      const bv = b[sortField];
      if (av === bv) return 0;
      const cmp = av === null || av === undefined ? -1 : bv === null || bv === undefined ? 1 : av < bv ? -1 : 1;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [rows, sortField, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageRows = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function toggleSort(field: string) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  function formatCell(column: ScreenColumn, value: unknown): string {
    if (value === null || value === undefined || value === "") return EMPTY_VALUE_DISPLAY;
    const opt = column.options?.find((o) => o.value === value);
    if (opt) return opt.label;
    if (column.type === "date" && typeof value === "string") {
      const d = new Date(value);
      return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString();
    }
    if (column.type === "number" && column.unit) return `${value} ${column.unit}`;
    return String(value);
  }

  return (
    <div ref={scrollRef} className="h-full overflow-auto">
      <div className="px-4 py-2 text-[12.5px] text-ct-muted">
        {rows.length} record{rows.length === 1 ? "" : "s"}
      </div>
      {rows.length === 0 ? (
        <p className="px-4 py-6 text-[13px] text-ct-muted text-center">{emptyStateLabel}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-ct-border text-left text-ct-slate">
                {visibleColumns.map((column) => (
                  <th key={column.field} className="px-4 py-2 font-medium whitespace-nowrap">
                    <button type="button" onClick={() => toggleSort(column.field)} className="inline-flex items-center gap-1 hover:text-ct-navy">
                      {column.label}
                      {sortField === column.field && (sortDir === "asc" ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />)}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => (
                <tr
                  key={getRowId(row)}
                  onClick={() => onRowClick?.(row)}
                  tabIndex={onRowClick ? 0 : undefined}
                  role={onRowClick ? "button" : undefined}
                  onKeyDown={
                    onRowClick
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onRowClick(row);
                          }
                        }
                      : undefined
                  }
                  className={
                    onRowClick
                      ? "border-b border-ct-border hover:bg-ct-cloud cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ct-navy"
                      : "border-b border-ct-border"
                  }
                >
                  {visibleColumns.map((column) => (
                    <td key={column.field} className={`px-4 py-2 whitespace-nowrap ${column.type === "number" ? "text-right tabular-nums" : ""}`}>
                      {renderCell?.[column.field] ? renderCell[column.field](row) : formatCell(column, row[column.field])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-3 px-4 py-2 text-[12.5px] text-ct-slate">
          <button type="button" disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="disabled:opacity-40">
            Previous
          </button>
          <span>
            Page {page + 1} of {pageCount}
          </span>
          <button type="button" disabled={page >= pageCount - 1} onClick={() => setPage((p) => p + 1)} className="disabled:opacity-40">
            Next
          </button>
        </div>
      )}
    </div>
  );
}
