"use client";

// R42 seq21 (M30) -- THE ONLY PLACE A CONTROL IS CHOSEN. Control selection
// by cardinality, not taste:
//   1 choice, 2 opts    -> radio pair (or a single checkbox if genuinely boolean)
//   1 choice, 3-5       -> radio group, all visible
//   1 choice, 6-15      -> select
//   1 choice, 16+       -> searchable combobox
//   multi, 2-7          -> checkbox group, all visible
//   multi, 8+           -> multiselect with removable chips
//   boolean             -> single checkbox
//   date                -> date picker, never free text
//   number w/ unit      -> numeric input + unit label beside it, unit never typed
//   free text           -> last resort, only when genuinely unbounded
// A column's own `control` (set by whoever authored the screen_definitions
// row) wins when present; this only derives one from cardinality when the
// author left it unset, so the table above is enforced even for a
// hand-authored row that skipped it.
import { useId, useState } from "react";
import type { ScreenColumn } from "../types";
import { EMPTY_VALUE_DISPLAY } from "../types";

export type FieldRendererProps = {
  column: ScreenColumn;
  value: unknown;
  mode: "display" | "edit";
  onChange?: (value: unknown) => void;
  /** Called on blur, not per keystroke (GLOBAL: "validate ON BLUR, not per keystroke"). */
  onBlur?: () => void;
  error?: string;
};

function deriveControl(column: ScreenColumn): NonNullable<ScreenColumn["control"]> {
  if (column.control) return column.control;
  if (column.type === "boolean") return "CHECKBOX";
  if (column.type === "date") return "DATE";
  if (column.type === "number") return "NUMBER";
  const n = column.options?.length ?? 0;
  const multi = column.type === "multiselect" || column.type === "array";
  if (multi) return n <= 7 ? "CHECKBOX" : "MULTISELECT";
  if (n === 0) return "TEXT";
  if (n <= 5) return "RADIO";
  if (n <= 15) return "SELECT";
  return "COMBOBOX";
}

function formatDisplay(column: ScreenColumn, value: unknown): string {
  if (value === null || value === undefined || value === "") return EMPTY_VALUE_DISPLAY;
  if (column.type === "boolean") return value ? "Yes" : "No";
  if (value instanceof File) return value.name;
  if (column.type === "date" && typeof value === "string") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString();
  }
  if (Array.isArray(value)) {
    const labels = value.map((v) => column.options?.find((o) => o.value === v)?.label ?? String(v));
    return labels.length ? labels.join(", ") : EMPTY_VALUE_DISPLAY;
  }
  const opt = column.options?.find((o) => o.value === value);
  if (opt) return opt.label;
  if (column.type === "number" && column.unit) return `${value} ${column.unit}`;
  return String(value);
}

export function FieldRenderer({ column, value, mode, onChange, onBlur, error }: FieldRendererProps) {
  const inputId = useId();
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const control = deriveControl(column);

  if (mode === "display" || control === "DERIVED") {
    return (
      <div>
        <div className="text-[13px] text-ct-slate">{formatDisplay(column, value)}</div>
        {error && <p className="text-[12px] text-[color:var(--color-veri-status-late)] mt-0.5">{error}</p>}
      </div>
    );
  }

  const baseInputClass = "w-full rounded-md border border-ct-border2 px-2.5 py-1.5 text-[13px] text-ct-navy focus:outline-none focus:ring-2 focus:ring-ct-teal/40";

  let control_node: React.ReactNode;
  switch (control) {
    case "CHECKBOX": {
      if (column.type === "boolean") {
        control_node = (
          <label className="inline-flex items-center gap-2 text-[13px] text-ct-navy cursor-pointer">
            <input type="checkbox" checked={!!value} onChange={(e) => onChange?.(e.target.checked)} onBlur={onBlur} className="size-4 accent-ct-teal" />
            {column.label}
          </label>
        );
      } else {
        const selected = new Set(Array.isArray(value) ? (value as string[]) : []);
        control_node = (
          <div className="flex flex-col gap-1.5">
            {(column.options ?? []).map((opt) => (
              <label key={opt.value} className="inline-flex items-center gap-2 text-[13px] text-ct-navy cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.has(opt.value)}
                  onChange={(e) => {
                    const next = new Set(selected);
                    e.target.checked ? next.add(opt.value) : next.delete(opt.value);
                    onChange?.([...next]);
                  }}
                  onBlur={onBlur}
                  className="size-4 accent-ct-teal"
                />
                {opt.label}
              </label>
            ))}
          </div>
        );
      }
      break;
    }
    case "RADIO": {
      control_node = (
        <div className="flex flex-col gap-1.5">
          {(column.options ?? []).map((opt) => (
            <label key={opt.value} className="inline-flex items-center gap-2 text-[13px] text-ct-navy cursor-pointer">
              <input type="radio" name={inputId} checked={value === opt.value} onChange={() => onChange?.(opt.value)} onBlur={onBlur} className="size-4 accent-ct-teal" />
              {opt.label}
            </label>
          ))}
        </div>
      );
      break;
    }
    case "SELECT": {
      control_node = (
        <select id={inputId} className={baseInputClass} value={(value as string) ?? ""} onChange={(e) => onChange?.(e.target.value)} onBlur={onBlur}>
          <option value="" disabled>
            Select…
          </option>
          {(column.options ?? []).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
      break;
    }
    case "COMBOBOX": {
      const selectedLabel = column.options?.find((o) => o.value === value)?.label ?? (typeof value === "string" ? value : "");
      control_node = (
        <div className="relative">
          <input
            id={inputId}
            className={baseInputClass}
            defaultValue={selectedLabel}
            onFocus={() => setComboboxOpen(true)}
            onBlur={() => {
              setTimeout(() => setComboboxOpen(false), 150);
              onBlur?.();
            }}
            placeholder="Type to search…"
          />
          {comboboxOpen && (column.options?.length ?? 0) > 0 && (
            <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md border border-ct-border2 bg-white shadow-md">
              {column.options!.map((opt) => (
                <li key={opt.value}>
                  <button
                    type="button"
                    className="block w-full px-2.5 py-1.5 text-left text-[13px] hover:bg-ct-cloud"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onChange?.(opt.value);
                      setComboboxOpen(false);
                    }}
                  >
                    {opt.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      );
      break;
    }
    case "MULTISELECT": {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      control_node = (
        <div>
          <div className="flex flex-wrap gap-1.5 mb-1.5">
            {selected.map((v) => {
              const label = column.options?.find((o) => o.value === v)?.label ?? v;
              return (
                <span key={v} className="veri-mchip checked">
                  <span>{label}</span>
                  <button type="button" onClick={() => onChange?.(selected.filter((s) => s !== v))} aria-label={`Remove ${label}`}>
                    ×
                  </button>
                </span>
              );
            })}
          </div>
          <select
            className={baseInputClass}
            value=""
            onChange={(e) => {
              if (e.target.value && !selected.includes(e.target.value)) onChange?.([...selected, e.target.value]);
            }}
            onBlur={onBlur}
          >
            <option value="">Add…</option>
            {(column.options ?? []).filter((o) => !selected.includes(o.value)).map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      );
      break;
    }
    case "DATE": {
      // <input type="date"> only accepts an exact YYYY-MM-DD value -- a full
      // ISO datetime string (e.g. a Date column serialized straight through
      // NextResponse.json, "2026-09-02T00:00:00.000Z") is silently rejected
      // and the field renders empty even though a real value is present.
      // Caught live (R42 seq21 verification): PERMITS.OBJECT's own expiry
      // date field went blank in Edit mode this way.
      const raw = (value as string) ?? (column.defaultValue as string) ?? "";
      const dateValue = typeof raw === "string" ? raw.slice(0, 10) : "";
      control_node = (
        <input
          id={inputId}
          type="date"
          className={baseInputClass}
          value={dateValue}
          onChange={(e) => onChange?.(e.target.value)}
          onBlur={onBlur}
        />
      );
      break;
    }
    case "NUMBER": {
      control_node = (
        <div className="flex items-center gap-2">
          <input
            id={inputId}
            type="number"
            className={baseInputClass}
            value={(value as number) ?? ""}
            onChange={(e) => onChange?.(e.target.value === "" ? null : Number(e.target.value))}
            onBlur={onBlur}
          />
          {column.unit && <span className="text-[12px] text-ct-muted shrink-0">{column.unit}</span>}
        </div>
      );
      break;
    }
    case "FILE": {
      // Genuinely a new generic control (M30 vocabulary extension, not a
      // per-module bespoke widget) -- added in R42 seq22 for Work Progress's
      // site-photo attachment, but the control itself is module-agnostic:
      // any future FORM/OBJECT field that needs a file just sets
      // control:"FILE". Caller owns storage/upload -- onChange receives the
      // raw File, same "no networking owned by the kit" rule as everywhere
      // else in this directory.
      const file = value instanceof File ? value : null;
      control_node = (
        <div>
          <input
            id={inputId}
            type="file"
            onChange={(e) => onChange?.(e.target.files?.[0] ?? null)}
            onBlur={onBlur}
            className="block w-full text-[13px] text-ct-navy file:mr-3 file:rounded-md file:border-0 file:bg-ct-cloud file:px-2.5 file:py-1.5 file:text-[12.5px] file:text-ct-navy"
          />
          {file && <p className="mt-1 text-[12px] text-ct-muted">{file.name}</p>}
        </div>
      );
      break;
    }
    case "HIDDEN": {
      control_node = null;
      break;
    }
    case "TEXT":
    default: {
      control_node = (
        <input
          id={inputId}
          type="text"
          className={baseInputClass}
          value={(value as string) ?? ""}
          onChange={(e) => onChange?.(e.target.value)}
          onBlur={onBlur}
        />
      );
    }
  }

  return (
    <div>
      {control_node}
      {error && <p className="text-[12px] text-[color:var(--color-veri-status-late)] mt-0.5">{error}</p>}
    </div>
  );
}
