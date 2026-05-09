"use client";

import { useSyncExternalStore } from "react";
import { visualizerStore, VISUALIZER_DEFAULTS, type VisualizerState } from "./bus";

/**
 * React-side accessor for the visualizer store.
 *
 * Uses `useSyncExternalStore` — the canonical React 18+ API for
 * subscribing to a non-React data source. It guarantees consistent
 * snapshots, handles concurrent rendering correctly, and gives us
 * the right SSR fallback for free.
 */
export function useVisualizer(): VisualizerState {
  return useSyncExternalStore(
    (cb) => visualizerStore.subscribe(cb),
    () => visualizerStore.get(),
    // SSR snapshot — defaults match the canvas's initial state
    () => VISUALIZER_DEFAULTS
  );
}
