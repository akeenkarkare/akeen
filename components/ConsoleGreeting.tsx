"use client";

import { useEffect } from "react";

/**
 * Logs an ASCII signature + hiring pitch to the devtools console on mount.
 * A cheap, durable signal for the small audience that actually opens DevTools
 * — which skews heavily toward the people you want reading it.
 */
export default function ConsoleGreeting() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    // Guard against double-mount in dev strict mode
    const w = window as unknown as { __akeenGreeted?: boolean };
    if (w.__akeenGreeted) return;
    w.__akeenGreeted = true;

    const big = "color: #fef3c7; font-family: ui-monospace, monospace; font-size: 13px; line-height: 1.3;";
    const dim = "color: #9ca3af; font-family: ui-monospace, monospace; font-size: 12px;";
    const hi  = "color: #22c55e; font-family: ui-monospace, monospace; font-size: 12px;";

    // eslint-disable-next-line no-console
    console.log(
      "%c" +
`   _    _                   _  __         _
  /_\\  | |__ ___ ___ _ _   | |/ /__ _ _ _| |____ _ _ _ ___
 / _ \\ | / // -_) -_) ' \\  | ' </ _\` | '_| / / _\` | '_/ -_)
/_/ \\_\\|_\\_\\___\\___|_||_| |_|\\_\\__,_|_| |_\\_\\__,_|_| \\___|`,
      big
    );
    // eslint-disable-next-line no-console
    console.log("%cstony brook '27 · physics + EE · builder", dim);
    // eslint-disable-next-line no-console
    console.log(
      "%cif you're reading this in devtools we should probably talk.\n%cakeen.karkare@stonybrook.edu",
      dim,
      hi
    );
    // eslint-disable-next-line no-console
    console.log(
      "%cps — the background is a brute-force O(N²) n-body sim at 512 particles,\n" +
      "running in webgl2 with additive blending. the cards are a verlet\n" +
      "integrator i wrote from scratch. try the ~ key.",
      dim
    );
  }, []);

  return null;
}
