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
};

export function AppShellFrame({ sidebar, composer, panel, homeThreadSlot, homeRoute, children }: AppShellFrameProps) {
  const pathname = usePathname();
  const isHome = pathname === homeRoute;
  const { width: panelWidth, onHandleMouseDown } = useResizableWidth(420, 320, 640, "right");

  return (
    <div className="flex h-screen overflow-hidden bg-ct-cream">
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
  );
}
