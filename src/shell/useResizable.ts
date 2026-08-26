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
  /**
   * @deprecated ACCEPTED BUT NO LONGER USED, and deliberately kept in the
   * signature so existing external call sites keep compiling.
   *
   * This used to compute a viewport-relative default and apply it in a
   * post-mount effect. That is what caused R48_LAYOUT_REFLOW_01: the column
   * painted at `initial`, then jumped to the responsive value one frame
   * later, and the flex-1 column beside it absorbed the difference and
   * re-flowed. Measured on production at a 1036px viewport: the sidebar went
   * 220 -> 140 and the assistant column 430 -> 390, so the module surface
   * gained 120px and every control inside it moved -- one measured control
   * travelled ~140px once text re-wrap is included. A user who began a click
   * as the page settled could land on a different control than the one they
   * aimed at.
   *
   * The responsive default now lives in CSS (see AppShellFrame's own
   * stylesheet), so the FIRST paint is already correct on both server and
   * client. That removes the shift AND the hydration-mismatch risk the
   * effect was originally introduced to avoid -- CSS renders identically on
   * both sides, so there is nothing to mismatch.
   */
  getResponsiveInitial?: () => number
) {
  // `null` means "no user preference yet -- let CSS decide the width".
  // A number means the user has dragged the handle, and that explicit width
  // wins from then on. Starting at null is what makes the first paint
  // authoritative instead of provisional.
  const [width, setWidth] = useState<number | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);
  const dragState = useRef<{ dragging: boolean; startX: number; startWidth: number } | null>(null);

  void initial;
  void getResponsiveInitial;

  const onHandleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Read the width the browser is ACTUALLY rendering right now. While
      // `width` is still null that value comes from CSS, so measuring the
      // element is the only way to start the drag from where the handle
      // visually is -- and it keeps the drag continuous rather than
      // snapping to a remembered number.
      const measured = elementRef.current?.getBoundingClientRect().width;
      const startWidth = width ?? (typeof measured === "number" ? measured : min);
      dragState.current = { dragging: true, startX: e.clientX, startWidth };
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      e.preventDefault();
    },
    [width, min]
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

  return { width, onHandleMouseDown, elementRef };
}
