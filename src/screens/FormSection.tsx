"use client";

// R42 seq21 (M30 GROUPING): 5-7 fields per section, plain-word heading,
// required fields first and visibly marked, optional fields collapsed
// behind "More details", closed by default. SUPPRESSED fields do not
// render at all -- absent, not greyed, not collapsed (M31).
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { FieldRenderer } from "./fields/FieldRenderer";
import type { ScreenColumn } from "./types";

export type FormSectionProps = {
  title: string;
  columns: ScreenColumn[];
  values: Record<string, unknown>;
  mode: "display" | "edit";
  onFieldChange?: (field: string, value: unknown) => void;
  onFieldBlur?: (field: string) => void;
  errors?: Record<string, string>;
  /** Optional fields start collapsed (M30) -- only relevant when this section has both required and optional fields. */
  defaultOptionalCollapsed?: boolean;
};

export function FormSection({
  title,
  columns,
  values,
  mode,
  onFieldChange,
  onFieldBlur,
  errors,
  defaultOptionalCollapsed = true,
}: FormSectionProps) {
  const [optionalOpen, setOptionalOpen] = useState(!defaultOptionalCollapsed);

  const visible = columns.filter((c) => c.fieldStatus !== "SUPPRESSED");
  const required = visible.filter((c) => c.fieldStatus !== "OPTIONAL" && c.required !== false);
  const optional = visible.filter((c) => c.fieldStatus === "OPTIONAL" || c.required === false);

  const renderField = (column: ScreenColumn) => (
    <div key={column.field} className="space-y-1">
      <label htmlFor={column.field} className="block text-[12.5px] font-medium text-ct-slate">
        {column.label}
        {mode === "edit" && column.required !== false && column.fieldStatus !== "OPTIONAL" && (
          <span className="text-[color:var(--color-veri-status-late)] ml-0.5">*</span>
        )}
      </label>
      <FieldRenderer
        column={column}
        value={values[column.field]}
        mode={mode}
        onChange={onFieldChange ? (v) => onFieldChange(column.field, v) : undefined}
        onBlur={onFieldBlur ? () => onFieldBlur(column.field) : undefined}
        error={errors?.[column.field]}
      />
    </div>
  );

  return (
    <section className="border-t border-ct-border px-4 py-3">
      <h3 className="text-[13px] font-medium text-ct-navy mb-3">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{required.map(renderField)}</div>

      {optional.length > 0 && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setOptionalOpen((v) => !v)}
            className="inline-flex items-center gap-1 text-[12.5px] text-ct-muted hover:text-ct-navy"
          >
            {optionalOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
            More details
          </button>
          {optionalOpen && <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">{optional.map(renderField)}</div>}
        </div>
      )}
    </section>
  );
}
