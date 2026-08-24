"use client";

// R42 seq21 (M29 footer message area -- one of the GLOBAL spec's "three
// places" for a message, the other two being field-level, rendered inline
// by FieldRenderer/FormSection, and the header message strip, rendered
// directly by ObjectScreen). Persistent, grouped, colour = most critical
// level, shows the count -- NEVER a toast (GLOBAL: "toasts vanish; errors
// must persist until resolved").
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import type { FieldMessage, MessageLevel } from "../types";

export type MessageAreaProps = {
  messages: FieldMessage[];
  /** Clicking a message scrolls to and focuses the offending field (GLOBAL). */
  onMessageClick?: (message: FieldMessage) => void;
};

const LEVEL_ORDER: MessageLevel[] = ["error", "warning", "info", "success"];
const LEVEL_STYLE: Record<MessageLevel, { icon: typeof AlertCircle; className: string }> = {
  error: { icon: AlertCircle, className: "text-[color:var(--color-veri-status-late)]" },
  warning: { icon: AlertTriangle, className: "text-[color:var(--color-veri-status-needs-you)]" },
  success: { icon: CheckCircle2, className: "text-[color:var(--color-veri-status-done)]" },
  info: { icon: Info, className: "text-[color:var(--color-veri-status-context)]" },
};

function mostCritical(messages: FieldMessage[]): MessageLevel | null {
  for (const level of LEVEL_ORDER) {
    if (messages.some((m) => m.level === level)) return level;
  }
  return null;
}

export function MessageArea({ messages, onMessageClick }: MessageAreaProps) {
  if (messages.length === 0) return null;
  const critical = mostCritical(messages)!;
  const { className } = LEVEL_STYLE[critical];

  const bySection = new Map<string, FieldMessage[]>();
  for (const m of messages) {
    const key = m.field ?? "__general__";
    const list = bySection.get(key) ?? [];
    list.push(m);
    bySection.set(key, list);
  }

  return (
    <div className={`border-t border-ct-border px-4 py-2 text-[13px] ${className}`} role="status" aria-live="polite">
      <div className="font-medium mb-0.5">
        {messages.length} message{messages.length === 1 ? "" : "s"}
      </div>
      <ul className="space-y-0.5">
        {[...bySection.entries()].map(([field, group]) =>
          group.map((m, i) => {
            const { icon: Icon } = LEVEL_STYLE[m.level];
            return (
              <li key={`${field}-${i}`}>
                <button
                  type="button"
                  onClick={() => onMessageClick?.(m)}
                  className="inline-flex items-start gap-1.5 text-left hover:underline"
                >
                  <Icon className="size-3.5 shrink-0 mt-0.5" aria-hidden />
                  <span>{m.text}</span>
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
