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

export interface Shockwave {
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
};
