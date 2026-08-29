"use client";

import { useEffect, useState } from "react";

const QUERY = "(min-width: 1024px)";

function matches(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(QUERY).matches;
}

/**
 * True at desktop widths (>=1024px). Lazily initialized from matchMedia so
 * there's no flash of the wrong shell on first paint, and kept in sync if
 * the window is resized across the breakpoint.
 */
export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(matches);

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return isDesktop;
}
