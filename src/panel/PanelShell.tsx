"use client";

// The right "assistant chat" panel's outer shell -- header (title + icon +
// view tabs) + scrollable body. Ported from the mockup's #rightPanel +
// #rightViewTabs, and VERIDIAN AI OS's real VeriChatPanel.tsx's header.
// The tab list is a prop (not hardcoded) specifically so VERIDIAN can keep
// its real product's extra Meetings/Approvals/Voice tabs layered on top of
// the mockup's baseline 4 (Overview/Tasks/Chats/To Do) without forking this
// component -- PROJEXA just passes the baseline 4 and gets the mockup
// exactly.
import type { ReactNode } from "react";
import { MessageSquare } from "lucide-react";

export type PanelTab<View extends string> = { key: View; label: string; badge?: number };

export type PanelShellProps<View extends string> = {
  title: string;
  tabs: PanelTab<View>[];
  activeView: View;
  isThreadOpen: boolean;
  onSelectTab: (view: View) => void;
  children: ReactNode;
};

export function PanelShell<View extends string>({ title, tabs, activeView, isThreadOpen, onSelectTab, children }: PanelShellProps<View>) {
  return (
    <aside className="border-l border-ct-border bg-white flex flex-col h-full">
      <div className="border-b border-ct-border px-4 py-3">
        <div className="flex items-center gap-2 mb-2.5">
          <MessageSquare className="size-4 text-ct-saffron" />
          <span className="font-heading text-[15px] text-ct-navy">{title}</span>
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => onSelectTab(tab.key)}
              className={`veri-view-tab${activeView === tab.key && !isThreadOpen ? " active" : ""}`}
            >
              <span>{tab.label}</span>
              {typeof tab.badge === "number" && tab.badge > 0 && <span className="veri-view-badge">{tab.badge}</span>}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </aside>
  );
}
