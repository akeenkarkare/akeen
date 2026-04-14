"use client";

import { useEffect, useState } from "react";

/**
 * Standard media-query hook. Returns true when the query matches.
 * SSR-safe: returns `false` on the server, then syncs on mount so hydration
 * matches (server markup is always the desktop layout).
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const update = () => setMatches(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, [query]);

  return matches;
}
