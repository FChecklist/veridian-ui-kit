"use client";

// R42 seq21 (M24/M29 GLOBAL) -- the chrome every archetype shares: a
// breadcrumb, the SAME three header actions in the SAME order on every
// screen (Filter | Export | + New), and a footer bar that NEVER vanishes
// (present even when every action is disabled) because it carries the
// message area. One layout across display/edit/create -- callers pass mode
// through, this component never branches its own structure on it beyond
// what footerActions supplies.
import type { ReactNode } from "react";
import { Filter, Download, Plus } from "lucide-react";
import { MessageArea } from "./parts/MessageArea";
import type { FieldMessage } from "./types";

export type HeaderActionState = { label: string; onClick?: () => void; disabledReason?: string };

export type ScreenFrameProps = {
  breadcrumb: ReactNode;
  filterAction?: HeaderActionState;
  exportAction?: HeaderActionState;
  newAction?: HeaderActionState;
  /** Object-level state that stays visible even when the header collapses (M31), e.g. "Locked by Suresh until 14:32". */
  headerMessageStrip?: ReactNode;
  children: ReactNode;
  /** Mode-specific footer action buttons -- Edit|Export PDF|Delete (display), Save|Cancel (edit/create). Owned by the caller (ObjectScreen/ListScreen), rendered inside the never-vanishing footer bar alongside the message area. */
  footerActions?: ReactNode;
  messages: FieldMessage[];
  onMessageClick?: (message: FieldMessage) => void;
};

function HeaderActionButton({ icon: Icon, action }: { icon: typeof Filter; action?: HeaderActionState }) {
  if (!action) return null;
  const disabled = !!action.disabledReason;
  return (
    <button
      type="button"
      onClick={action.onClick}
      disabled={disabled}
      title={action.disabledReason}
      className="inline-flex items-center gap-1.5 rounded-md border border-ct-border2 px-2.5 py-1.5 text-[13px] text-ct-navy hover:bg-ct-cloud disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
    >
      <Icon className="size-3.5" aria-hidden />
      {action.label}
      {disabled && <span className="text-[11px] text-ct-muted">({action.disabledReason})</span>}
    </button>
  );
}

export function ScreenFrame({ breadcrumb, filterAction, exportAction, newAction, headerMessageStrip, children, footerActions, messages, onMessageClick }: ScreenFrameProps) {
  return (
    <div className="flex flex-col h-full min-h-0">
      <header className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-ct-border shrink-0">
        <div className="text-[13px] text-ct-slate min-w-0 truncate">{breadcrumb}</div>
        {/* GLOBAL: Filter | Export | + New, same order, every screen. */}
        <div className="flex items-center gap-2 shrink-0">
          <HeaderActionButton icon={Filter} action={filterAction} />
          <HeaderActionButton icon={Download} action={exportAction} />
          <HeaderActionButton icon={Plus} action={newAction} />
        </div>
      </header>

      {headerMessageStrip && (
        <div className="px-4 py-1.5 text-[12.5px] bg-ct-cloud border-b border-ct-border text-ct-navy shrink-0">{headerMessageStrip}</div>
      )}

      <div className="flex-1 min-h-0 overflow-auto">{children}</div>

      {/* Footer bar that NEVER vanishes -- present even with zero actions, because it carries the message area (GLOBAL/M29). */}
      <footer className="border-t border-ct-border shrink-0">
        {footerActions && <div className="flex items-center gap-2 px-4 py-2.5">{footerActions}</div>}
        <MessageArea messages={messages} onMessageClick={onMessageClick} />
      </footer>
    </div>
  );
}
