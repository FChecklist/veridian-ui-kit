"use client";

// R42 seq21 (M24/M31): glyph + colour, NEVER colour alone (~8% of men have
// colour-vision deficiency). Four fixed tones map to four fixed glyphs in a
// fixed order -- a consuming screen picks the tone, this component owns the
// glyph+colour pairing so it can never drift screen to screen.
import { Circle, Loader2, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import type { StatusTone } from "../types";

export type StatusBadgeProps = {
  tone: StatusTone;
  label: string;
};

const TONE_STYLE: Record<StatusTone, { icon: typeof Circle; className: string }> = {
  "needs-you": { icon: Circle, className: "text-[color:var(--color-veri-status-needs-you)]" },
  running: { icon: Loader2, className: "text-[color:var(--color-veri-status-context)]" },
  waiting: { icon: Clock, className: "text-ct-muted" },
  done: { icon: CheckCircle2, className: "text-[color:var(--color-veri-status-done)]" },
  late: { icon: AlertTriangle, className: "text-[color:var(--color-veri-status-late)]" },
  neutral: { icon: Circle, className: "text-ct-muted" },
};

export function StatusBadge({ tone, label }: StatusBadgeProps) {
  const { icon: Icon, className } = TONE_STYLE[tone];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[13px] ${className}`}>
      <Icon className="size-3.5 shrink-0" aria-hidden />
      <span>{label}</span>
    </span>
  );
}
