/**
 * Tiny shared-state module used to couple the card physics (matter.js) with
 * the N-body background (WebGL). Both components import this and read/write
 * to the same object each frame. No React state, no re-renders — just a
 * mutable ref.
 *
 * Why do it this way? Both systems tick at 60fps in their own requestAnimationFrame
 * loops. Passing data through React state would force re-renders and add lag.
 * A plain shared module is the idiomatic way to bridge two canvas-driven
 * simulations in a React app.
 */

export type GravityMode = "down" | "up" | "zero";

export interface CardAttractor {
  x: number;
  y: number;
  mass: number; // arbitrary units — tuned in the N-body shader
}

interface Shockwave {
  x: number;
  y: number;
  strength: number; // 0..1
  bornAt: number;   // ms
}

export const physicsBus = {
  /** Set every frame by PhysicsStage: one entry per card body, in world coords. */
  cardAttractors: [] as CardAttractor[],
  /** Appended to by PhysicsStage on heavy collisions, drained by NBodyBackground. */
  shockwaves: [] as Shockwave[],
  /** Updated by PhysicsStage when a hard impact happens. Drained by a shake layer. */
  screenShakeQueue: [] as { strength: number; bornAt: number }[],
  /**
   * Bounding box of the hero text panel in viewport pixels, written by Hero and
   * read by PhysicsStage to build a static barrier. The panel is anchored to the
   * top-left, so the barrier spans (0..w, 0..h) — leaving the right side open for
   * cards to float up into. {w:0,h:0} until Hero measures itself.
   */
  heroBox: { w: 0, h: 0 },
};

// ---------------- Visualizer state ----------------

/**
 * Defaults match the look the site shipped with — anyone who never opens
 * the visualizer panel sees the original aesthetic.
 */
/** Which physics field drives the particle motion. */
export type FieldMode = "gravity" | "flow" | "electric";

export const VISUALIZER_DEFAULTS = {
  particles: 768,
  pointSize: 5.0,
  brightness: 0.45,
  gravity: 1200,
  cardPull: 20,
  fieldMode: "gravity" as FieldMode,
  hideUI: false,
  /** Tracks whether the HUD details panel is currently shown.
   *  Used by the VisualizerPanel to slide out of the way. Not user-facing,
   *  not persisted to localStorage. */
  hudShown: false,
};

export type VisualizerState = typeof VISUALIZER_DEFAULTS;

/**
 * Lightweight observable for visualizer settings. Both the NBody render
 * loop (canvas, no React) and the panel UI (React) need to read/write
 * these — using a plain object + subscribe() keeps it framework-agnostic.
 */
class VisualizerStore {
  private state: VisualizerState = { ...VISUALIZER_DEFAULTS };
  private listeners = new Set<(s: VisualizerState) => void>();
  // Monotonic counter the NBody subscriber watches. When it ticks up, fire
  // an explosion. Cheaper than maintaining a separate event channel.
  private explodeCounter = 0;
  private explodeListeners = new Set<() => void>();

  get(): VisualizerState {
    return this.state;
  }

  set(patch: Partial<VisualizerState>) {
    this.state = { ...this.state, ...patch };
    for (const fn of this.listeners) fn(this.state);
  }

  subscribe(fn: (s: VisualizerState) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /** Fire-and-forget explosion request. NBody listener handles it. */
  triggerExplode() {
    this.explodeCounter++;
    for (const fn of this.explodeListeners) fn();
  }

  subscribeExplode(fn: () => void): () => void {
    this.explodeListeners.add(fn);
    return () => this.explodeListeners.delete(fn);
  }
}

export const visualizerStore = new VisualizerStore();
