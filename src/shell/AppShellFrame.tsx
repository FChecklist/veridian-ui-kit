"use client";

// The outermost shell: sidebar + main (page content + composer) + right
// panel, route-aware. This is the mockup's central "merge" idea, made real
// in React: on the designated home route, the right panel (and its resize
// handle) are hidden and `homeThreadSlot` renders inline in the main
// content area instead; on every other route, the panel is shown normally
// and `homeThreadSlot` is not rendered at all. Both call sites -- panel and
// home-slot -- are expected to render the SAME underlying thread state
// (via ../panel/ThreadView reading the same shared context), so switching
// routes never loses or duplicates what the user was looking at.
//
// Ported from VERIDIAN AI OS's real AppShell.tsx pattern (a
// `pathname === homeRoute` branch already exists there for the
// OnboardingChecklist banner) generalized into the full merge the mockup
// specifies -- confirmed while building this package that VERIDIAN's own
// current AppShell does NOT yet hide the panel on its real /home route
// despite the mockup showing it should; adopting this component corrects
// that drift rather than just preserving today's behavior.
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useResizableWidth } from "./useResizable";

export type AppShellFrameProps = {
  sidebar: ReactNode;
  composer: ReactNode;
  panel: ReactNode;
  /** Rendered ONLY on `homeRoute`, inline within the main content area below `children`, replacing the right panel. Typically a greeting + AI-digest card + a `<ThreadView />`. */
  homeThreadSlot?: ReactNode;
  /** The route this shell treats as "Home" for the merge behavior (e.g. "/home" for VERIDIAN, "/dashboard" for PROJEXA). */
  homeRoute: string;
  children: ReactNode;
  /** The persistent top bar (e.g. `<AppHeader />`), rendered above the sidebar/main/panel row. Matches the mockup's own outer structure exactly (`<div class="flex h-screen flex-col overflow-hidden"><header>...<div class="flex flex-1 overflow-hidden">`) -- omit for a header-less consumer, the row below still fills 100% height on its own via flex-1. */
  header?: ReactNode;
};

// Bugfix (found while adopting this component + AppHeader together in
// compliance-tracker's real migration, 2026-07-19): this div used to own
// `h-screen` directly on the sidebar+main+panel ROW, which only happens to
// be correct when nothing else shares the viewport. The mockup's own real
// structure (confirmed by re-reading veridian-scope-selector-in-home.html)
// puts `h-screen` on the OUTERMOST wrapper (header + row together), with
// `<header>` as a `shrink-0` sibling ABOVE a `flex-1 overflow-hidden` row --
// not on the row alone. Stacking AppHeader above the old row unmodified
// silently clipped the bottom of the sidebar/panel by exactly the header's
// height (two independent h-screen boxes stacked = 100vh + headerHeight of
// total content in a 100vh viewport). Fixed by moving h-screen to this
// outer wrapper and making the row a flex-1 child of it, with `header`
// rendered first -- fully backward compatible for any consumer that omits
// `header` (the row alone still fills all available height via flex-1).
export function AppShellFrame({ sidebar, composer, panel, homeThreadSlot, homeRoute, children, header }: AppShellFrameProps) {
  const pathname = usePathname();
  const isHome = pathname === homeRoute;
  // Real 3-screen proportion (Owner directive): sidebar ~10% / main ~50% /
  // this panel ~40% of the viewport. Existing 320-640px bounds unchanged --
  // only the starting/default width now targets a true percentage instead
  // of a fixed 420px guess. Min/max still win on very narrow or very wide
  // screens, same as before this change.
  const { width: panelWidth, onHandleMouseDown } = useResizableWidth(420, 320, 640, "right", () => Math.round(window.innerWidth * 0.4));

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-ct-cream">
      {header}
      <div className="flex flex-1 overflow-hidden">
        {sidebar}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex flex-1 overflow-hidden">
            <main className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto">
                {children}
                {isHome && homeThreadSlot}
              </div>
              {composer}
            </main>
            {!isHome && (
              <>
                <div onMouseDown={onHandleMouseDown} className="w-[5px] cursor-col-resize shrink-0 hover:bg-ct-saffron/25" />
                <div style={{ width: panelWidth }} className="shrink-0">
                  {panel}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
