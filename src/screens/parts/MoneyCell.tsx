"use client";

// R42 seq21 (M24/M28): "Numbers right-aligned, tabular figures, SAME DECIMAL
// PLACES DOWN A COLUMN. Misaligned money looks untrustworthy to a QS."
// Currency follows the org setting (TC-90) -- no rupee sign, no lakh
// grouping for an AED org. Deliberately takes `currency`/`locale` as props
// (never reads from context) so the same component can't silently drift
// between an org whose currency it was told and one it wasn't.
import { EMPTY_VALUE_DISPLAY } from "../types";
import type { KpiTone } from "./KpiCard";

export type MoneyCellProps = {
  value: number | null | undefined;
  currency?: string; // e.g. "AED" -- org setting, never hardcoded. Omit to render a plain grouped number (R42 seq24: a variance/delta cell that's already in the org's base currency by construction doesn't need re-labelling per row).
  locale?: string; // defaults to en-US (never en-IN's lakh/crore grouping unless the org genuinely is India-based and passes it explicitly)
  decimals?: number;
  /** R42 seq24: an optional status colour (e.g. rose for over-budget, sage for under) -- never the ONLY signal (M24: never colour alone), so callers pair it with a real status elsewhere on the row. */
  tone?: KpiTone;
};

export function MoneyCell({ value, currency, locale = "en-US", decimals = 2, tone }: MoneyCellProps) {
  if (value === null || value === undefined) {
    return <span className="tabular-nums text-right block text-ct-muted">{EMPTY_VALUE_DISPLAY}</span>;
  }
  const formatted = currency
    ? new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value)
    : new Intl.NumberFormat(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
  return (
    <span
      className={`tabular-nums text-right block ${tone ? "" : "text-ct-navy"}`}
      style={tone ? { color: `var(--color-veri-status-${tone})` } : undefined}
    >
      {formatted}
    </span>
  );
}
