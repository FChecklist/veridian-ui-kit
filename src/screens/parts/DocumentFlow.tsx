"use client";

// R42 seq21 (M31): every OBJECT screen shows what this came from / what came
// from it, each a real link. Present even when empty -- "absence is
// information" (per PERMITS.OBJECT's own screen_spec row).
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { DocumentFlowData } from "../types";

export type DocumentFlowProps = {
  data: DocumentFlowData;
  emptyLabel?: string;
};

export function DocumentFlow({ data, emptyLabel = "Not linked to any other document" }: DocumentFlowProps) {
  const isEmpty = data.from.length === 0 && data.to.length === 0;
  return (
    <section className="border-t border-ct-border px-4 py-3">
      <h3 className="text-[13px] font-medium text-ct-navy mb-2">Document flow</h3>
      {isEmpty ? (
        <p className="text-[13px] text-ct-muted">{emptyLabel}</p>
      ) : (
        <div className="space-y-1.5">
          {data.from.map((link) => (
            <a key={link.href} href={link.href} className="flex items-center gap-1.5 text-[13px] text-[color:var(--color-veri-status-context)] hover:underline">
              <ArrowUpRight className="size-3.5 shrink-0" aria-hidden />
              <span>From: {link.label}</span>
            </a>
          ))}
          {data.to.map((link) => (
            <a key={link.href} href={link.href} className="flex items-center gap-1.5 text-[13px] text-[color:var(--color-veri-status-context)] hover:underline">
              <ArrowDownRight className="size-3.5 shrink-0" aria-hidden />
              <span>To: {link.label}</span>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
