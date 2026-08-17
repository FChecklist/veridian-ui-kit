"use client";

// Generic collapsible/resizable sidebar -- renders whatever nav item list
// the product supplies (VERIDIAN's Finance/Compliance/HR groups, PROJEXA's
// Execution/Field/Design/Resources/Sales/GRC/Finance/HR/Intelligence
// groups), styled exactly per the mockup's #leftSidebar/.nav-item rules.
// The product owns its own real nav DATA; this owns the shared shell only.
import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { useResizableWidth } from "./useResizable";

export type NavItem = { href: string; label: string; icon?: ReactNode; badge?: ReactNode };
export type NavSection = { label?: string; items: NavItem[] };

export type MiddleColumnToggle = {
  /** Whether the middle assistant column is currently hidden. */
  collapsed: boolean;
  onToggle: () => void;
  /** Human-readable name for the thing being shown/hidden (e.g. PROJEXA's "VERI Chat"). Defaults to "assistant". Used to build the title/aria-label: "Show {label}" / "Hide {label}". */
  label?: string;
};

export type AppSidebarProps = {
  sections: NavSection[];
  logo?: ReactNode;
  productName?: string;
  collapsed: boolean;
  /**
   * Optional control for showing/hiding the middle assistant column.
   * Rendered as a rail button structurally INSIDE this left column, pinned
   * below the nav list (`shrink-0`, outside the scrollable `<nav>`) so it
   * stays visible and clickable without scrolling even at the rail's
   * ~10%-of-viewport width. Owner directive 2026-08-16: a column toggle
   * must live in the column it's structurally part of -- previously this
   * sat in the full-width header, which has no per-column ownership.
   * Uses a chat-bubble icon (identity-based: "this is the assistant
   * toggle") rather than a directional panel icon, so it can't go stale
   * again if the assistant column's screen position changes later the way
   * `PanelRight` did when the assistant moved from the right strip to the
   * middle column. Omit on routes where there's no middle column to
   * toggle (e.g. AppShellFrame's homeRoute merge).
   */
  middleColumnToggle?: MiddleColumnToggle;
};

export function AppSidebar({ sections, logo, productName = "VERIDIAN AI", collapsed, middleColumnToggle }: AppSidebarProps) {
  const pathname = usePathname();
  // Real 3-screen proportion (Owner directive): sidebar ~10% / main ~50% /
  // right panel ~40% of the viewport. Existing 140-320px bounds unchanged --
  // only the starting/default width now targets a true percentage instead
  // of a fixed 220px guess.
  const { width, onHandleMouseDown } = useResizableWidth(220, 140, 320, "left", () => Math.round(window.innerWidth * 0.1));

  if (collapsed) return null;

  const toggleLabel = middleColumnToggle?.label ?? "assistant";
  const toggleTitle = middleColumnToggle ? (middleColumnToggle.collapsed ? `Show ${toggleLabel}` : `Hide ${toggleLabel}`) : undefined;

  return (
    <>
      <aside style={{ width }} className="shrink-0 h-full border-r border-ct-border bg-white flex flex-col overflow-hidden">
        <div className="shrink-0 flex items-center gap-2 px-3 pt-3.5 pb-2">
          {logo ?? <div className="grid size-7 place-items-center rounded-lg bg-ct-navy text-white text-xs font-bold">{productName.charAt(0)}</div>}
          <span className="font-heading text-[15px] text-ct-navy tracking-tight truncate">{productName}</span>
        </div>
        {/* Bugfix (Owner directive 2026-08-17, real production repro):
            `overflow-y-auto` used to live on the outer `<aside>`, making the
            logo row + nav list + `middleColumnToggle` below all ONE
            scrollable region together. On a real nav list long enough to
            exceed the rail's available height (confirmed live: PROJEXA's
            real 11-section/34-item nav), that swept the toggle into the
            same scroll region as the nav, so it scrolled out of view --
            exactly the opposite of "pinned below the nav list, outside the
            scrollable nav, always visible without scrolling" this prop's
            own doc comment (above) already promised. Fix: `overflow-y-auto`
            + `min-h-0` move onto `<nav>` itself, so ONLY the nav list
            scrolls internally; the logo row and the toggle row (both
            already `shrink-0`) stay pinned outside that scroll region, on
            an `<aside>` that's now explicitly `h-full` + `overflow-hidden`
            so it can't grow past its real viewport-relative height either. */}
        <nav className="flex-1 min-h-0 overflow-y-auto px-2.5 pb-4">
          {sections.map((section, sIdx) => (
            <div key={sIdx}>
              {section.label && (
                <p className="px-3 mb-1 mt-4 text-[9px] font-bold tracking-widest text-ct-muted uppercase">{section.label}</p>
              )}
              {section.items.map((item, iIdx) => {
                const active = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href + "/"));
                // Keyed by href+label+index, not href alone -- a consuming
                // product's real nav legitimately has multiple distinct
                // items pointing at the same href (e.g. two different
                // entry points into the same list page, filtered
                // differently client-side), confirmed while adopting this
                // component in compliance-tracker's real migration
                // (2026-07-19): href-only keys collided and produced a real
                // React "duplicate key" warning.
                return (
                  <Link key={`${item.href}-${item.label}-${iIdx}`} href={item.href} className={`veri-nav-item${active ? " active" : ""}`}>
                    {item.icon}
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        {middleColumnToggle && (
          <div className="shrink-0 border-t border-ct-border px-2.5 py-2">
            <button
              type="button"
              onClick={middleColumnToggle.onToggle}
              title={toggleTitle}
              aria-label={toggleTitle}
              aria-pressed={!middleColumnToggle.collapsed}
              className="veri-icon-btn"
            >
              <MessageSquare className="size-[17px]" />
            </button>
          </div>
        )}
      </aside>
      <div onMouseDown={onHandleMouseDown} className="w-[5px] cursor-col-resize shrink-0 hover:bg-ct-saffron/25" />
    </>
  );
}
