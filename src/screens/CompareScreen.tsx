"use client";

// R44 seq3 (M28 COMPARE archetype -- the sixth of seven; TIMELINE is the
// seventh, see TimelineScreen.tsx). R42 had reported "all seven archetypes"
// built when only five existed (LIST/OBJECT/FORM/DASHBOARD/REPORT) -- this
// closes that gap.
//
// Same reuse principle as every other screen in this kit: this component
// owns NO networking and knows NOTHING about BOQs specifically. A caller
// (e.g. compliance-tracker's /boq/[id]/compare route via PROJEXA) fetches
// two revisions' worth of rows, diffs them however it likes, and hands this
// component the result -- so the identical component renders a BOQ
// revision diff today and a permit-terms diff tomorrow. `columns` comes
// from the registry row (M28: "a function is a row, not a folder"), the
// same ScreenColumn shape ListScreen/ObjectScreen already consume.
import { Plus, Minus, PenSquare } from "lucide-react";
import { ScreenFrame } from "./ScreenFrame";
import { EMPTY_VALUE_DISPLAY } from "./types";
import type { ScreenColumn, FieldMessage } from "./types";

export type CompareRow = Record<string, unknown>;

export type CompareChangedRow = {
  key: string;
  previous: CompareRow;
  current: CompareRow;
  /** Field names that actually differ -- drives which cells highlight. Caller computes this (it already has to, to decide `changed` vs unchanged). */
  changedFields: string[];
};

export type CompareResult = {
  added: CompareRow[];
  removed: CompareRow[];
  changed: CompareChangedRow[];
  /** e.g. a scope-reduction warning -- rendered above the diff, not silently dropped. */
  warnings?: string[];
};

export type CompareScreenProps = {
  /** Registry function_id -- no local state keyed by it today, kept for parity with ListScreen/ObjectScreen and any future back-restore need. */
  functionId: string;
  breadcrumb: React.ReactNode;
  columns: ScreenColumn[];
  /** e.g. "Rev 1" / "Rev 2" -- whatever the two things being compared are called. */
  fromLabel: string;
  toLabel: string;
  result: CompareResult;
  getRowId: (row: CompareRow) => string;
  onBack?: () => void;
  emptyStateLabel?: string;
  messages?: FieldMessage[];
  onMessageClick?: (message: FieldMessage) => void;
};

function formatCell(column: ScreenColumn, value: unknown): string {
  if (value === null || value === undefined || value === "") return EMPTY_VALUE_DISPLAY;
  const opt = column.options?.find((o) => o.value === value);
  if (opt) return opt.label;
  if (column.type === "date" && typeof value === "string") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString();
  }
  if (column.type === "number" && column.unit) return `${String(value)} ${column.unit}`;
  return String(value);
}

// M28: importance-driven, same cap ListScreen enforces -- a diff table is
// still a table, and "max 7 High columns" is a GLOBAL rule, not a
// LIST-specific one.
const MAX_HIGH_COLUMNS = 7;
function visibleColumns(columns: ScreenColumn[]): ScreenColumn[] {
  const high = columns.filter((c) => c.importance === "High").slice(0, MAX_HIGH_COLUMNS);
  const rest = columns.filter((c) => c.importance !== "High");
  return [...high, ...rest];
}

function DiffSection({
  icon: Icon, iconClassName, title, count, children,
}: { icon: typeof Plus; iconClassName: string; title: string; count: number; children: React.ReactNode }) {
  if (count === 0) return null;
  return (
    <section className="px-4 py-3 border-b border-ct-border">
      <h2 className="flex items-center gap-1.5 text-[13px] font-medium text-ct-navy mb-2">
        <Icon className={`size-3.5 shrink-0 ${iconClassName}`} aria-hidden />
        {title} ({count})
      </h2>
      {children}
    </section>
  );
}

export function CompareScreen({
  functionId: _functionId,
  breadcrumb,
  columns,
  fromLabel,
  toLabel,
  result,
  getRowId,
  onBack,
  emptyStateLabel = "No differences -- these are identical.",
  messages = [],
  onMessageClick,
}: CompareScreenProps) {
  const cols = visibleColumns(columns);
  const totalDiffs = result.added.length + result.removed.length + result.changed.length;

  return (
    <ScreenFrame
      breadcrumb={
        <span className="flex items-center gap-2">
          {onBack && (
            <button type="button" onClick={onBack} className="text-ct-muted hover:text-ct-navy">
              ← Back
            </button>
          )}
          {breadcrumb}
        </span>
      }
      messages={messages}
      onMessageClick={onMessageClick}
    >
      <div className="px-4 py-3 border-b border-ct-border">
        <div className="flex items-center gap-2 text-[13px]">
          <span className="text-ct-muted">{fromLabel}</span>
          <span className="text-ct-muted" aria-hidden>→</span>
          <span className="font-medium text-ct-navy">{toLabel}</span>
        </div>
      </div>

      {result.warnings && result.warnings.length > 0 && (
        <div className="px-4 py-2 border-b border-ct-border bg-ct-cloud">
          {result.warnings.map((w, i) => (
            <p key={i} className="text-[12.5px] text-[color:var(--color-veri-status-late)]">{w}</p>
          ))}
        </div>
      )}

      {totalDiffs === 0 ? (
        <p className="px-4 py-6 text-[13px] text-ct-muted text-center">{emptyStateLabel}</p>
      ) : (
        <>
          <DiffSection icon={Plus} iconClassName="text-[color:var(--color-veri-status-done)]" title="Added" count={result.added.length}>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-ct-border text-left text-ct-slate">
                    {cols.map((c) => <th key={c.field} className="px-2 py-1.5 font-medium whitespace-nowrap">{c.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {result.added.map((row) => (
                    <tr key={getRowId(row)} className="border-b border-ct-border">
                      {cols.map((c) => (
                        <td key={c.field} className={`px-2 py-1.5 whitespace-nowrap ${c.type === "number" ? "text-right tabular-nums" : ""}`}>
                          {formatCell(c, row[c.field])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DiffSection>

          <DiffSection icon={Minus} iconClassName="text-[color:var(--color-veri-status-late)]" title="Removed" count={result.removed.length}>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-ct-border text-left text-ct-slate">
                    {cols.map((c) => <th key={c.field} className="px-2 py-1.5 font-medium whitespace-nowrap">{c.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {result.removed.map((row) => (
                    <tr key={getRowId(row)} className="border-b border-ct-border opacity-70">
                      {cols.map((c) => (
                        <td key={c.field} className={`px-2 py-1.5 whitespace-nowrap line-through ${c.type === "number" ? "text-right tabular-nums" : ""}`}>
                          {formatCell(c, row[c.field])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DiffSection>

          <DiffSection icon={PenSquare} iconClassName="text-[color:var(--color-veri-status-needs-you)]" title="Changed" count={result.changed.length}>
            <div className="space-y-3">
              {result.changed.map((c) => (
                <div key={getRowId(c.current)} className="rounded-md border border-ct-border2 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-[13px]">
                      <thead>
                        <tr className="border-b border-ct-border text-left text-ct-slate bg-ct-cloud">
                          <th className="px-2 py-1.5 font-medium w-20"></th>
                          {cols.map((col) => <th key={col.field} className="px-2 py-1.5 font-medium whitespace-nowrap">{col.label}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-ct-border">
                          <td className="px-2 py-1.5 text-ct-muted">{fromLabel}</td>
                          {cols.map((col) => (
                            <td
                              key={col.field}
                              className={`px-2 py-1.5 whitespace-nowrap ${col.type === "number" ? "text-right tabular-nums" : ""} ${c.changedFields.includes(col.field) ? "bg-[color:var(--color-veri-status-late)]/10" : ""}`}
                            >
                              {formatCell(col, c.previous[col.field])}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="px-2 py-1.5 text-ct-muted">{toLabel}</td>
                          {cols.map((col) => (
                            <td
                              key={col.field}
                              className={`px-2 py-1.5 whitespace-nowrap font-medium ${col.type === "number" ? "text-right tabular-nums" : ""} ${c.changedFields.includes(col.field) ? "bg-[color:var(--color-veri-status-done)]/10" : ""}`}
                            >
                              {formatCell(col, c.current[col.field])}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </DiffSection>
        </>
      )}
    </ScreenFrame>
  );
}
