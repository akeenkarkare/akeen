/**
 * Thin wrapper around matter.js.
 *
 * Exposes a `World` / `Body` API matching what our PhysicsStage expects, so
 * the rendering and input code doesn't care what's under the hood. matter.js
 * handles all the hard parts: oriented-box SAT collision, contact manifolds,
 * sequential impulse resolution, sleeping, constraints, etc.
 *
 * The "from scratch" physics flex in this portfolio is the N-body gravitational
 * field running in [lib/nbody.ts](./nbody.ts) — that's 512 particles, brute-force
 * O(N²), handwritten WebGL2 additive blending. The cards are a different
 * problem: they need to *just work*, and matter.js makes that trivial so we
 * can spend effort on the impressive integrations between the two systems.
 */

import Matter from "matter-js";

export type Vec2 = { x: number; y: number };

/**
 * A renderable rigid body. This wraps a Matter.Body but exposes getters for
 * the fields our canvas renderer reads (pos, angle, vel, hw, hh). We keep
 * `meta` and `color` on the wrapper since matter.js doesn't care about them.
 */
export interface Body {
  id: string;
  matter: Matter.Body;
  hw: number;
  hh: number;
  color: string;
  meta?: unknown;
  // Read-only in practice, but we expose these as live getters so the
  // renderer can do `b.pos.x` without `b.matter.position.x`.
  pos: Vec2;
  vel: Vec2;
  angle: number;
  angularVel: number;
  held: boolean;
}

export interface WorldConfig {
  width: number;
  height: number;
  gravity: number;       // px/s^2 in portfolio units (positive = down)
  // Kept for HUD compatibility; matter.js uses its own internal tuning
  linearDamping: number;
  angularDamping: number;
  iterations: number;
}

export class World {
  bodies: Body[] = [];
  cfg: WorldConfig;
  engine: Matter.Engine;
  matterWorld: Matter.World;
  /** Invisible static walls — rebuilt on resize */
  private walls: Matter.Body[] = [];
  /** Heavy-collision events surface here for UI effects (screen shake, shockwaves) */
  heavyImpacts: { x: number; y: number; strength: number }[] = [];
  /** Number of active contacts last step — for the HUD */
  lastContacts = 0;

  constructor(cfg: WorldConfig) {
    this.cfg = cfg;
    // Matter uses its own gravity system: engine.gravity.y is a scale factor
    // (not an acceleration in px/s²). We map our gravity → their scale.
    this.engine = Matter.Engine.create({
      // Matter's solver iterations are configurable; higher = more stable stacks
      positionIterations: cfg.iterations,
      velocityIterations: cfg.iterations,
      constraintIterations: 2,
    });
    this.engine.gravity.y = cfg.gravity / 1000; // ~1.8 for gravity=1800
    this.matterWorld = this.engine.world;
    this.buildWalls();

    // Collect heavy impacts for the shockwave system.
    Matter.Events.on(this.engine, "collisionStart", (e) => {
      for (const pair of e.pairs) {
        // Velocity-difference-based "heaviness"
        const a = pair.bodyA;
        const b = pair.bodyB;
        const dvx = (a.velocity.x - b.velocity.x);
        const dvy = (a.velocity.y - b.velocity.y);
        const impactSpeed = Math.hypot(dvx, dvy);
        if (impactSpeed < 6) continue; // ignore soft touches
        const mid = pair.collision.supports[0] ?? {
          x: (a.position.x + b.position.x) / 2,
          y: (a.position.y + b.position.y) / 2,
        };
        this.heavyImpacts.push({
          x: mid.x,
          y: mid.y,
          strength: Math.min(impactSpeed / 30, 1), // 0..1
        });
      }
    });
  }

  private buildWalls() {
    const { width, height } = this.cfg;
    // Clean up previous walls on resize
    for (const w of this.walls) Matter.Composite.remove(this.matterWorld, w);
    this.walls = [];

    const thickness = 200;
    const opts = { isStatic: true, friction: 0.4, restitution: 0.2 };
    const walls = [
      Matter.Bodies.rectangle(width / 2, -thickness / 2, width * 2, thickness, opts),            // top
      Matter.Bodies.rectangle(width / 2, height + thickness / 2, width * 2, thickness, opts),    // bottom
      Matter.Bodies.rectangle(-thickness / 2, height / 2, thickness, height * 2, opts),          // left
      Matter.Bodies.rectangle(width + thickness / 2, height / 2, thickness, height * 2, opts),   // right
    ];
    for (const w of walls) {
      this.walls.push(w);
      Matter.Composite.add(this.matterWorld, w);
    }
  }

  /** Call on window resize so walls stay glued to the viewport edges */
  resize(width: number, height: number) {
    this.cfg.width = width;
    this.cfg.height = height;
    this.buildWalls();
  }

  add(b: Body) {
    this.bodies.push(b);
    Matter.Composite.add(this.matterWorld, b.matter);
  }

  step(dt: number) {
    // matter.js's Engine.update takes milliseconds
    Matter.Engine.update(this.engine, Math.min(dt * 1000, 33));

    // Count active contacts for the HUD (live pairs from the broadphase)
    this.lastContacts = this.engine.pairs.list.filter(
      (p: Matter.Pair) => p.isActive
    ).length;
  }

  /** Hit-test against rotated bodies; returns topmost or null. */
  pick(p: Vec2): Body | null {
    // Iterate in reverse so the topmost (last-drawn) body is picked first
    for (let i = this.bodies.length - 1; i >= 0; i--) {
      const b = this.bodies[i];
      if (Matter.Bounds.contains(b.matter.bounds, p)) {
        // Refine with proper vertex test (matter.js handles rotation)
        if (Matter.Vertices.contains(b.matter.vertices, p)) {
          return b;
        }
      }
    }
    return null;
  }

  /** Drain accumulated heavy impacts (caller consumes them for shockwaves). */
  drainImpacts(): { x: number; y: number; strength: number }[] {
    const out = this.heavyImpacts;
    this.heavyImpacts = [];
    return out;
  }
}

/** Create a rigid rectangle body. Units are pixels; mass/inertia are auto-computed. */
export function makeBody(partial: {
  id: string;
  pos: Vec2;
  hw: number;
  hh: number;
  color: string;
  angle?: number;
  mass?: number;
  restitution?: number;
  friction?: number;
  meta?: unknown;
}): Body {
  const m = Matter.Bodies.rectangle(partial.pos.x, partial.pos.y, partial.hw * 2, partial.hh * 2, {
    angle: partial.angle ?? 0,
    restitution: partial.restitution ?? 0.2,
    friction: partial.friction ?? 0.4,
    frictionAir: 0.01,          // light air drag — cards don't skate forever
    density: 0.001,              // default-ish
    // A small amount of sleeping reduces CPU on resting piles without
    // the jitter bugs I hit in the hand-rolled engine.
    sleepThreshold: 60,
  });

  const body: Body = {
    id: partial.id,
    matter: m,
    hw: partial.hw,
    hh: partial.hh,
    color: partial.color,
    meta: partial.meta,
    // Live getters — these are replaced by `Object.defineProperty` below
    pos: { x: 0, y: 0 },
    vel: { x: 0, y: 0 },
    angle: 0,
    angularVel: 0,
    held: false,
  };

  // Make `body.pos`, `body.vel`, `body.angle`, `body.angularVel` live-read from matter
  Object.defineProperty(body, "pos", {
    get: () => m.position,
    enumerable: true,
  });
  Object.defineProperty(body, "vel", {
    get: () => m.velocity,
    enumerable: true,
  });
  Object.defineProperty(body, "angle", {
    get: () => m.angle,
    enumerable: true,
  });
  Object.defineProperty(body, "angularVel", {
    get: () => m.angularVelocity,
    enumerable: true,
  });

  return body;
}

// ---------- Helpers exposed to callers that need to imperatively mutate bodies ----------

export function setBodyPosition(b: Body, x: number, y: number) {
  Matter.Body.setPosition(b.matter, { x, y });
}
export function setBodyVelocity(b: Body, x: number, y: number) {
  Matter.Body.setVelocity(b.matter, { x, y });
}
export function setBodyAngularVelocity(b: Body, v: number) {
  Matter.Body.setAngularVelocity(b.matter, v);
}
export function setBodyStatic(b: Body, isStatic: boolean) {
  Matter.Body.setStatic(b.matter, isStatic);
}

/** Apply an instantaneous velocity-level force at the body's center. */
export function applyForce(b: Body, fx: number, fy: number) {
  Matter.Body.applyForce(b.matter, b.matter.position, { x: fx, y: fy });
}

/** Used by the held-drag system — see PhysicsStage. */
export function pinBodyToPoint(b: Body, x: number, y: number) {
  Matter.Body.setPosition(b.matter, { x, y });
  Matter.Body.setVelocity(b.matter, { x: 0, y: 0 });
  Matter.Body.setAngularVelocity(b.matter, 0);
}

/** Set global gravity direction + magnitude. */
export function setGravity(world: World, yPxPerSec2: number) {
  world.cfg.gravity = yPxPerSec2;
  world.engine.gravity.y = yPxPerSec2 / 1000;
}
