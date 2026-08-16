"use client";

// The outermost shell: sidebar + assistant (`panel` + `composer`, the wide
// primary middle surface) + module surface (`children`, the narrower
// right-hand surface), route-aware. This is the mockup's central "merge"
// idea, made real in React: on the designated home route, the assistant
// column (and its resize handle) are hidden and `homeThreadSlot` renders
// inline alongside `children` in the merged main content area instead; on
// every other route, the assistant is shown normally in its own column and
// `homeThreadSlot` is not rendered at all. Both call sites -- `panel` and
// home-slot -- are expected to render the SAME underlying thread state
// (via ../panel/ThreadView reading the same shared context), so switching
// routes never loses or duplicates what the user was looking at.
//
// Ported from VERIDIAN AI OS's real AppShell.tsx pattern (a
// `pathname === homeRoute` branch already exists there for the
// OnboardingChecklist banner) generalized into the full merge the mockup
// specifies -- confirmed while building this package that VERIDIAN's own
// current AppShell does NOT yet hide the assistant column on its real
// /home route despite the mockup showing it should; adopting this
// component corrects that drift rather than just preserving today's
// behavior.
//
// Column arrangement corrected 2026-08-16 (Owner directive, raised from a
// real production screenshot of PROJEXA's /work-progress, against the
// authoritative mock `PROJEXA Workspace Layout`,
// grid-template-columns: 10% 50% 40%): the ASSISTANT (`panel` + `composer`)
// is the wide, primary MIDDLE surface -- the mock's `.workspace` class,
// which genuinely contains the task rows, day dividers, suggestion chips
// AND the composer, all in one column. `children` (the routed module/page
// content) is the narrower RIGHT surface -- the mock's `.erp` class.
// Previously this was backwards: `children` occupied the wide flexible
// middle slot with `composer` anchored to IT, and `panel` (the assistant)
// was confined to the narrow resizable strip with no composer at all --
// which is exactly the defect the Owner reported (assistant reduced to a
// tab strip with Overview/Queries/Chats/To Do and no visible composer,
// while the composer sat below whatever module content `children` happened
// to render). Only the arrangement changed here -- `panel`/`children`'s own
// content and every consumer's props are untouched, and the 10/50/40
// proportion itself was already correct (sidebar ~10%, the flexible slot
// ~50% of what's left, the resizable slot's existing 320-640px/40%-default
// bounds) -- it was only ever assigned to the wrong slot.
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useResizableWidth } from "./useResizable";

export type AppShellFrameProps = {
  sidebar: ReactNode;
  /** The persistent composer, anchored directly beneath `panel` in the middle assistant column -- always visible without scrolling past `panel`'s own scrollable content, never appended after `children`/module content. */
  composer: ReactNode;
  /** The assistant surface (conversation + mode pill/option selector + task list, e.g. `<PanelShell />`) -- rendered as the WIDE, primary MIDDLE column with `composer` anchored beneath it. Despite the prop name (kept for backward compatibility with existing call sites), this is no longer the narrow right-hand strip. */
  panel: ReactNode;
  /** Rendered ONLY on `homeRoute`, inline within the merged main content area alongside `children`, replacing the assistant column. Typically a greeting + AI-digest card + a `<ThreadView />`. */
  homeThreadSlot?: ReactNode;
  /** The route this shell treats as "Home" for the merge behavior (e.g. "/home" for VERIDIAN, "/dashboard" for PROJEXA). */
  homeRoute: string;
  /** The routed module/page content (e.g. a Next.js route-group layout's `children`) -- rendered as the narrower, independently-scrollable RIGHT column, except on `homeRoute` where it merges into the main content area alongside `homeThreadSlot` instead (the assistant column is hidden there). */
  children: ReactNode;
  /** The persistent top bar (e.g. `<AppHeader />`), rendered above the sidebar/assistant/module row. Matches the mockup's own outer structure exactly (`<div class="flex h-screen flex-col overflow-hidden"><header>...<div class="flex flex-1 overflow-hidden">`) -- omit for a header-less consumer, the row below still fills 100% height on its own via flex-1. */
  header?: ReactNode;
};

// Bugfix (found while adopting this component + AppHeader together in
// compliance-tracker's real migration, 2026-07-19): this div used to own
// `h-screen` directly on the sidebar+assistant+module ROW, which only
// happens to be correct when nothing else shares the viewport. The
// mockup's own real structure (confirmed by re-reading
// veridian-scope-selector-in-home.html) puts `h-screen` on the OUTERMOST
// wrapper (header + row together), with `<header>` as a `shrink-0` sibling
// ABOVE a `flex-1 overflow-hidden` row -- not on the row alone. Stacking
// AppHeader above the old row unmodified silently clipped the bottom of
// the sidebar/assistant by exactly the header's height (two independent
// h-screen boxes stacked = 100vh + headerHeight of total content in a
// 100vh viewport). Fixed by moving h-screen to this outer wrapper and
// making the row a flex-1 child of it, with `header` rendered first --
// fully backward compatible for any consumer that omits `header` (the row
// alone still fills all available height via flex-1).
export function AppShellFrame({ sidebar, composer, panel, homeThreadSlot, homeRoute, children, header }: AppShellFrameProps) {
  const pathname = usePathname();
  const isHome = pathname === homeRoute;
  // Real 3-screen proportion (Owner directive): sidebar ~10% / assistant
  // ~50% / module surface ~40% of the viewport. Existing 320-640px bounds
  // unchanged -- only the starting/default width still targets a true
  // percentage instead of a fixed 420px guess. Min/max still win on very
  // narrow or very wide screens, same as before this change. This hook now
  // sizes the MODULE surface (`children`'s column), not the assistant --
  // see the file header comment for why that's the corrected assignment.
  const { width: moduleWidth, onHandleMouseDown } = useResizableWidth(420, 320, 640, "right", () => Math.round(window.innerWidth * 0.4));

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-ct-cream">
      {header}
      <div className="flex flex-1 overflow-hidden">
        {sidebar}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex flex-1 overflow-hidden">
            {/* Middle: the assistant -- wide, flexible, primary surface.
                `panel` manages its own internal scrolling (see
                ../panel/PanelShell.tsx's own `h-full` + `overflow-y-auto`
                body), so this wrapping div deliberately does not add a
                second overflow-y-auto of its own. `composer` is a direct
                flex sibling AFTER it, pinned to the bottom of this column
                by flexbox (not appended to `children`/module content), so
                it stays visible without scrolling on any route that shows
                the assistant -- matching a Claude-style anchored composer. */}
            <main className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto">
                {isHome ? (
                  <>
                    {children}
                    {homeThreadSlot}
                  </>
                ) : (
                  panel
                )}
              </div>
              {composer}
            </main>
            {/* Right: the module/page surface -- narrower, resizable,
                independently scrollable (raw routed page content doesn't
                manage its own scroll region the way `panel` does, so
                overflow-y-auto lives on this wrapper). Hidden on
                `homeRoute`, where `children` instead merges into the main
                column above alongside `homeThreadSlot`. */}
            {!isHome && (
              <>
                <div onMouseDown={onHandleMouseDown} className="w-[5px] cursor-col-resize shrink-0 hover:bg-ct-saffron/25" />
                <div style={{ width: moduleWidth }} className="shrink-0 overflow-y-auto">
                  {children}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
