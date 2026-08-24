"use client";

// R42 seq21 (M24/M28): "Numbers right-aligned, tabular figures, SAME DECIMAL
// PLACES DOWN A COLUMN. Misaligned money looks untrustworthy to a QS."
// Currency follows the org setting (TC-90) -- no rupee sign, no lakh
// grouping for an AED org. Deliberately takes `currency`/`locale` as props
// (never reads from context) so the same component can't silently drift
// between an org whose currency it was told and one it wasn't.
import { EMPTY_VALUE_DISPLAY } from "../types";

export type MoneyCellProps = {
  value: number | null | undefined;
  currency: string; // e.g. "AED" -- org setting, never hardcoded
  locale?: string; // defaults to en-US (never en-IN's lakh/crore grouping unless the org genuinely is India-based and passes it explicitly)
  decimals?: number;
};

export function MoneyCell({ value, currency, locale = "en-US", decimals = 2 }: MoneyCellProps) {
  if (value === null || value === undefined) {
    return <span className="tabular-nums text-right block text-ct-muted">{EMPTY_VALUE_DISPLAY}</span>;
  }
  const formatted = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
  return <span className="tabular-nums text-right block text-ct-navy">{formatted}</span>;
}
