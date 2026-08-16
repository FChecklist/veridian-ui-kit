"use client";

// The top header bar -- ported from the mockup's `<header>` block exactly
// (sidebar-toggle, logo+brand reusing AppSidebar's own convention, search,
// notification bell, org/context label, user avatar). Same generic-
// layout-plus-callback-props pattern as AppSidebar.tsx: this owns the icon
// row's layout/spacing/styling only. Every data-bearing piece -- the real
// search trigger, the real notification list (VERIDIAN's own
// `/api/notifications` dropdown), the real user menu (settings/logout), and
// any org-specific extras (VERIDIAN's "invite a team member" button) --
// stays owned by whichever product supplies it via slots, ported from
// VERIDIAN AI OS's real AppTopbar.tsx (compliance-tracker).
//
// Column toggle removed 2026-08-16 (Owner directive, follow-up to the same
// day's 3-column arrangement fix): this header used to render a
// `PanelRight`-icon "Toggle VERI Chat panel" button (`onToggleRightPanel`)
// here. That button toggled the assistant column, which is a real defect
// in two ways once this header spans the full app width above all three
// columns: (1) the header has no per-column ownership, so a column-scoped
// control here reads as if it toggles something app-wide; (2) the icon and
// label both described a right-hand strip, which was already stale after
// the arrangement fix moved the assistant to the middle column. The
// control now lives in `AppSidebar`'s `middleColumnToggle` prop, rendered
// structurally inside the LEFT column it's supposed to be part of, with an
// icon/label that describe the assistant by identity (chat) instead of by
// screen position.
import type { ReactNode } from "react";
import { PanelLeft, Search, Bell } from "lucide-react";

export type AppHeaderProps = {
  logo?: ReactNode;
  productName?: string;
  onToggleSidebar?: () => void;
  sidebarCollapsed?: boolean;
  /** The real search trigger (e.g. VERIDIAN's `<SearchTrigger />`) -- rendered in place of the mockup's plain search icon button. Omit to hide it entirely. */
  searchSlot?: ReactNode;
  /** Org name / project name / other product-specific context label shown next to the user avatar (e.g. VERIDIAN's `orgName`). */
  contextLabel?: ReactNode;
  /** The whole bell icon + dropdown, product owns the notification data. Omit to hide it entirely. */
  notificationSlot?: ReactNode;
  /** The whole avatar + dropdown (profile/settings/logout etc), product owns the user data and menu items. Omit to hide it entirely. */
  userMenuSlot?: ReactNode;
  /** Product-specific extras rendered before the notification slot, e.g. compliance-tracker's "invite a team member" button. */
  extraActions?: ReactNode;
};

export function AppHeader({
  logo,
  productName = "VERIDIAN AI",
  onToggleSidebar,
  sidebarCollapsed,
  searchSlot,
  contextLabel,
  notificationSlot,
  userMenuSlot,
  extraActions,
}: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-ct-border px-4 py-2.5 shrink-0">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            title={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
            className="veri-icon-btn"
          >
            <PanelLeft className="size-[17px]" />
          </button>
        )}
        <div className="flex items-center gap-2">
          {logo ?? <div className="grid size-7 place-items-center rounded-lg bg-ct-navy text-white text-xs font-bold">{productName.charAt(0)}</div>}
          <span className="font-heading text-lg text-ct-navy tracking-tight">{productName}</span>
        </div>
        {searchSlot ?? (
          <button type="button" title="Search" className="veri-icon-btn">
            <Search className="size-4" />
          </button>
        )}
      </div>
      <div className="flex items-center gap-1">
        {notificationSlot ?? (
          <button type="button" title="Notifications" className="veri-icon-btn">
            <Bell className="size-4" />
          </button>
        )}
        {extraActions}
        {contextLabel && <span className="text-sm text-ct-slate mx-1">{contextLabel}</span>}
        {userMenuSlot}
      </div>
    </header>
  );
}
