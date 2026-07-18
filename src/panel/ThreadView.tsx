"use client";

// The message-bubble thread renderer -- the ONE component that is
// literally shared between the right panel (when a task/conversation is
// open, or always for Discuss) and the merged Home page's inline slot (see
// ../shell/AppShellFrame.tsx). The mockup achieves this by moving a single
// DOM node between two parents; React's equivalent is rendering the same
// component from two different call sites reading the same shared state --
// this component IS that shared piece, so both call sites render pixel-
// identical output automatically, with no risk of the two drifting apart.
import { useEffect, useRef } from "react";

export type ThreadMessage = { id: string; isUser: boolean; content: string; createdAt?: string };

export type ThreadViewProps = {
  messages: ThreadMessage[];
  assistantLabel?: string;
  emptyHint?: string;
};

export function ThreadView({ messages, assistantLabel = "V", emptyHint }: ThreadViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  return (
    <div className="space-y-3 px-4 py-3">
      {messages.length === 0 && emptyHint && (
        <div className="text-center text-[11px] text-ct-muted">{emptyHint}</div>
      )}
      {messages.map((m) => (
        <div key={m.id} className={`flex gap-3${m.isUser ? " flex-row-reverse" : ""}`}>
          <div
            className={`grid size-8 shrink-0 place-items-center rounded-xl text-white text-xs font-bold ${
              m.isUser ? "bg-ct-navy" : "bg-gradient-to-br from-ct-saffron/90 to-[#F5A623]"
            }`}
          >
            {m.isUser ? "" : assistantLabel}
          </div>
          <div
            className={`rounded-2xl px-4 py-2.5 max-w-[80%] text-[14px] leading-relaxed whitespace-pre-wrap ${
              m.isUser ? "bg-ct-navy text-white" : "bg-white border border-ct-border text-ct-navy"
            }`}
          >
            {m.content}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
