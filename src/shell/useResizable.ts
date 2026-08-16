"use client";

// Self-contained drag-to-resize (mousedown/mousemove/mouseup on a handle
// div), matching the mockup's own vanilla-JS `makeResizable()` exactly.
// Deliberately NOT built on `react-resizable-panels` -- VERIDIAN AI OS and
// PROJEXA currently depend on two different major versions of that library
// (v4 vs v3, confirmed while building this package), and this shell needs
// to work unmodified against either. A plain drag handler has no version
// surface to break on.
import { useCallback, useEffect, useRef, useState } from "react";

export function useResizableWidth(
  initial: number,
  min: number,
  max: number,
  direction: "left" | "right",
  // Optional: computes a real, viewport-relative default (e.g. a % of
  // window.innerWidth for a genuine 3-screen proportion) applied once after
  // mount. Deliberately NOT read during the initial useState() call --
  // window is unavailable during SSR, and using it there would cause a
  // React hydration mismatch (server renders `initial`, client would render
  // something else on the same pass). Running it in an effect instead means
  // the first paint always matches SSR (using `initial`), then updates a
  // frame later on the client only -- same pattern React itself recommends
  // for any browser-only computed value. Fully backward compatible: every
  // existing call site that omits this argument behaves identically to
  // before this parameter existed.
  getResponsiveInitial?: () => number
) {
  const [width, setWidth] = useState(initial);
  const dragState = useRef<{ dragging: boolean; startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    if (!getResponsiveInitial) return;
    const responsive = getResponsiveInitial();
    setWidth(Math.max(min, Math.min(max, responsive)));
    // Only ever applied once, on mount -- this sets the real starting
    // proportion, it does not keep re-syncing on every window resize (that
    // would fight a user's own manual drag-resize, which is real,
    // unchanged, pre-existing behavior this hook must not disturb).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onHandleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      dragState.current = { dragging: true, startX: e.clientX, startWidth: width };
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      e.preventDefault();
    },
    [width]
  );

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!dragState.current?.dragging) return;
      const delta = e.clientX - dragState.current.startX;
      const raw = direction === "left" ? dragState.current.startWidth + delta : dragState.current.startWidth - delta;
      setWidth(Math.max(min, Math.min(max, raw)));
    }
    function onUp() {
      if (!dragState.current) return;
      dragState.current.dragging = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [direction, min, max]);

  return { width, onHandleMouseDown };
}
