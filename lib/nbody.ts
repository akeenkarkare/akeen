/**
 * Particle field simulation with three swappable physics modes.
 *
 *   - "gravity" — N-body Newtonian gravity (the original): particles attract
 *     each other and the cards via 1/r² force. Tends to clump.
 *   - "flow" — vector field driven by smooth pseudo-noise. Particles follow
 *     the field's velocity, tracing fluid-like streamlines. No O(N²) cost.
 *   - "electric" — half +charge, half -charge. Coulomb force between particles;
 *     cards count as +charges. Like-charges repel, opposites attract.
 *
 * All three share one particle buffer and one render path. Switching modes
 * preserves positions but resets the simulation state cleanly.
 *
 * Rendering: WebGL2 with additive-blended soft points for the nebula glow.
 *
 * Wraps toroidally so particles never escape the view.
 */

import type { FieldMode } from "./bus";

const DRAW_VS = /* glsl */ `#version 300 es
precision highp float;

in vec2 a_pos;
in vec2 a_vel;
in float a_charge;

uniform vec2 u_bounds;
uniform float u_pointSize;
out float v_speed;
out float v_charge;

void main() {
  vec2 ndc = a_pos / u_bounds;
  gl_Position = vec4(ndc, 0.0, 1.0);
  gl_PointSize = u_pointSize;
  v_speed = length(a_vel);
  v_charge = a_charge;
}
`;

const DRAW_FS = /* glsl */ `#version 300 es
precision highp float;

in float v_speed;
in float v_charge;
uniform float u_brightness;
// 0 = speed-based color (gravity/flow), 1 = charge-based color (electric)
uniform int u_colorMode;
out vec4 outColor;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.0, d);

  vec3 col;
  if (u_colorMode == 1) {
    // Charge mode: + (positive charge) glows red/orange, - glows electric blue.
    // Particles at charge=0 (gravity/flow modes that fell through here) are gray.
    vec3 positiveColor = vec3(1.00, 0.45, 0.30);
    vec3 negativeColor = vec3(0.35, 0.65, 1.00);
    if (v_charge > 0.5) {
      col = positiveColor;
    } else if (v_charge < -0.5) {
      col = negativeColor;
    } else {
      col = vec3(0.6);
    }
  } else {
    // Speed mode: slow = cool blue, fast = warm amber
    float t = clamp(v_speed / 300.0, 0.0, 1.0);
    vec3 cold = vec3(0.30, 0.50, 1.00);
    vec3 warm = vec3(1.00, 0.78, 0.40);
    col = mix(cold, warm, t);
  }

  outColor = vec4(col * a, a * u_brightness);
}
`;

function compile(gl: WebGL2RenderingContext, src: string, type: number): WebGLShader {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    throw new Error("shader: " + gl.getShaderInfoLog(s));
  }
  return s;
}

function link(gl: WebGL2RenderingContext, vs: string, fs: string): WebGLProgram {
  const p = gl.createProgram()!;
  gl.attachShader(p, compile(gl, vs, gl.VERTEX_SHADER));
  gl.attachShader(p, compile(gl, fs, gl.FRAGMENT_SHADER));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    throw new Error("link: " + gl.getProgramInfoLog(p));
  }
  return p;
}

// Per-particle layout: [px, py, vx, vy, charge]. The charge component is
// only meaningful in electric mode; gravity/flow leave it at 0.
const STRIDE = 5;
const STRIDE_BYTES = STRIDE * 4; // floats are 4 bytes each

export class NBody {
  private gl: WebGL2RenderingContext;
  private drawProg: WebGLProgram;
  private buffer: WebGLBuffer;
  private vao: WebGLVertexArrayObject;
  private count: number;
  // Maximum capacity for the GPU buffer. Resizing the buffer is expensive,
  // so we allocate up-front for the worst case and only render `count` of
  // the available `capacity` slots.
  private capacity: number;
  // Render-time tunables, surfaced via setters and pushed as shader uniforms.
  private pointSize = 5.0;
  private brightness = 0.45;
  // Gravity-loop tunables. Exposed via the visualizer panel so users can
  // dial in the look. Defaults match the original feel.
  private gravity = 1200;        // particle-particle gravitational constant
  private cardPull = 20;         // card-attractor gravitational constant

  // Active physics mode. Changing it wipes velocities so the new mode starts
  // clean (otherwise the old mode's momentum would dominate for a few seconds).
  private mode: FieldMode = "gravity";

  // Phase offset for the flow-mode noise field — animates the field over time
  // so particles see drifting streamlines rather than a static pattern.
  private flowTime = 0;

  // Sticky charge assignment for electric mode: each particle is + or -.
  // Allocated lazily on first electric step. +1 / -1.
  private charges: Int8Array | null = null;

  // Interleaved [px, py, vx, vy] for each particle
  private state: Float32Array;
  // Multiple gravitational attractors (the portfolio cards)
  private attractors: { x: number; y: number; mass: number }[] = [];
  // Active shockwaves — radial velocity impulses that decay over time
  private shockwaves: { x: number; y: number; strength: number; age: number }[] = [];

  // Hard cap on how many particles we'll ever allocate. Even on a beefy GPU,
  // 2048+ at O(N²) starts to hurt the main thread. The visualizer slider
  // exposes up to this number.
  static readonly MAX_PARTICLES = 1536;

  constructor(gl: WebGL2RenderingContext, count = 512) {
    this.gl = gl;
    this.count = count;
    this.capacity = NBody.MAX_PARTICLES;
    // Allocate at full capacity so setCount() doesn't need to reallocate
    // the GPU buffer; it just changes how many we draw.
    this.state = new Float32Array(this.capacity * STRIDE);

    const w = gl.drawingBufferWidth / (window.devicePixelRatio || 1);
    const h = gl.drawingBufferHeight / (window.devicePixelRatio || 1);
    this.seedRange(0, this.capacity, w, h);

    this.drawProg = link(gl, DRAW_VS, DRAW_FS);

    this.buffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.state, gl.DYNAMIC_DRAW);

    this.vao = gl.createVertexArray()!;
    gl.bindVertexArray(this.vao);
    const aPos = gl.getAttribLocation(this.drawProg, "a_pos");
    const aVel = gl.getAttribLocation(this.drawProg, "a_vel");
    const aCharge = gl.getAttribLocation(this.drawProg, "a_charge");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, STRIDE_BYTES, 0);
    gl.enableVertexAttribArray(aVel);
    gl.vertexAttribPointer(aVel, 2, gl.FLOAT, false, STRIDE_BYTES, 8);
    gl.enableVertexAttribArray(aCharge);
    gl.vertexAttribPointer(aCharge, 1, gl.FLOAT, false, STRIDE_BYTES, 16);
    gl.bindVertexArray(null);
  }

  /**
   * Seed `[start, end)` of the state buffer with random positions and
   * tangential orbital velocities. Used for initial fill and when growing
   * the active particle count.
   */
  private seedRange(start: number, end: number, w: number, h: number) {
    for (let i = start; i < end; i++) {
      const px = (Math.random() - 0.5) * w * 1.1;
      const py = (Math.random() - 0.5) * h * 1.1;
      const r = Math.hypot(px, py);
      const tangent = r > 1 ? { x: -py / r, y: px / r } : { x: 1, y: 0 };
      const speed = 30 + Math.random() * 40;
      this.state[i * STRIDE + 0] = px;
      this.state[i * STRIDE + 1] = py;
      this.state[i * STRIDE + 2] = tangent.x * speed + (Math.random() - 0.5) * 20;
      this.state[i * STRIDE + 3] = tangent.y * speed + (Math.random() - 0.5) * 20;
    }
  }

  /**
   * Resize the active particle count. Growing seeds new particles in the
   * unused capacity slots; shrinking just reduces what we draw and simulate.
   * No GPU buffer reallocation either way — the buffer is sized at MAX_PARTICLES.
   */
  setCount(n: number) {
    const next = Math.max(1, Math.min(this.capacity, n | 0));
    if (next === this.count) return;
    if (next > this.count) {
      const w = this.gl.drawingBufferWidth / (window.devicePixelRatio || 1);
      const h = this.gl.drawingBufferHeight / (window.devicePixelRatio || 1);
      this.seedRange(this.count, next, w, h);
    }
    this.count = next;
  }

  setPointSize(px: number) {
    this.pointSize = Math.max(1, Math.min(20, px));
  }

  setBrightness(alpha: number) {
    this.brightness = Math.max(0, Math.min(1, alpha));
  }

  setGravity(value: number) {
    this.gravity = Math.max(0, Math.min(5000, value));
  }

  setCardPull(value: number) {
    this.cardPull = Math.max(0, Math.min(200, value));
  }

  setMode(mode: FieldMode) {
    if (this.mode === mode) return;
    this.mode = mode;
    // Reset velocities so the new mode starts fresh — otherwise residual
    // gravitational momentum dominates the first few seconds of flow mode.
    // Also zero out the charge component for non-electric modes (the shader
    // colors charge=0 as gray, so this ensures we use the speed gradient).
    const s = this.state;
    for (let i = 0; i < this.capacity; i++) {
      s[i * STRIDE + 2] = 0;
      s[i * STRIDE + 3] = 0;
      s[i * STRIDE + 4] = 0;
    }
    this.flowTime = 0;
    // Charges get re-rolled each time we re-enter electric mode so people
    // see a different pattern.
    if (mode === "electric") {
      this.assignCharges();
    }
  }

  /**
   * Assign +1 / -1 charges across the particle buffer. Mirrors them into
   * both the typed-array (for the CPU Coulomb loop, which is hot) AND the
   * state buffer's charge component (for the shader to color particles).
   */
  private assignCharges() {
    const arr = new Int8Array(this.capacity);
    const s = this.state;
    for (let i = 0; i < this.capacity; i++) {
      const q = Math.random() < 0.5 ? 1 : -1;
      arr[i] = q;
      s[i * STRIDE + 4] = q;
    }
    this.charges = arr;
  }

  /**
   * Trigger a manual supernova right now (in addition to the periodic one).
   * Used by the visualizer "explode" button so users can scatter the field
   * on demand instead of waiting for the next interval tick.
   */
  explode() {
    const s = this.state;
    const n = this.count;
    if (n === 0) return;

    // Find the densest region instead of the centroid. The centroid is the
    // *mean* position, which gets dragged around by stragglers; the densest
    // bin in a 2D histogram is closer to where you actually see a clump.
    //
    // Bin into a 16×16 grid covering the simulation bounds. We re-derive
    // the bounds from the particle positions themselves, so this works
    // regardless of where the clump has drifted.
    const BINS = 16;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < n; i++) {
      const px = s[i * STRIDE];
      const py = s[i * STRIDE + 1];
      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
      if (py < minY) minY = py;
      if (py > maxY) maxY = py;
    }
    const spanX = Math.max(1, maxX - minX);
    const spanY = Math.max(1, maxY - minY);

    // Count particles per bin
    const histogram = new Int32Array(BINS * BINS);
    for (let i = 0; i < n; i++) {
      const fx = (s[i * STRIDE] - minX) / spanX;
      const fy = (s[i * STRIDE + 1] - minY) / spanY;
      let bx = Math.floor(fx * BINS);
      let by = Math.floor(fy * BINS);
      if (bx >= BINS) bx = BINS - 1;
      if (by >= BINS) by = BINS - 1;
      histogram[by * BINS + bx]++;
    }

    // Find the densest bin
    let bestBin = 0;
    let bestCount = -1;
    for (let i = 0; i < histogram.length; i++) {
      if (histogram[i] > bestCount) {
        bestCount = histogram[i];
        bestBin = i;
      }
    }
    const bestBy = Math.floor(bestBin / BINS);
    const bestBx = bestBin - bestBy * BINS;

    // Center of that bin in world space
    const cx = minX + ((bestBx + 0.5) / BINS) * spanX;
    const cy = minY + ((bestBy + 0.5) / BINS) * spanY;

    // Push every particle radially out from the densest bin's center
    for (let i = 0; i < n; i++) {
      const dx = s[i * STRIDE] - cx;
      const dy = s[i * STRIDE + 1] - cy;
      const d = Math.sqrt(dx * dx + dy * dy) + 1;
      const strength = 240 + Math.random() * 160;
      s[i * STRIDE + 2] += (dx / d) * strength;
      s[i * STRIDE + 3] += (dy / d) * strength;
    }
  }

  getCount() {
    return this.count;
  }

  /** Replace the list of attractors each frame (cheap — typically 6 cards). */
  setAttractors(attractors: { x: number; y: number; mass: number }[]) {
    this.attractors = attractors;
  }

  /** Add a radial velocity impulse centered at (x, y). */
  addShockwave(x: number, y: number, strength: number) {
    this.shockwaves.push({ x, y, strength, age: 0 });
  }

  step(dt: number, boundsX: number, boundsY: number) {
    // Apply shockwaves first — they're mode-agnostic, just velocity impulses.
    this.applyShockwaves(dt);

    // Mode-specific force accumulation + velocity update.
    switch (this.mode) {
      case "gravity":
        this.stepGravity(dt);
        break;
      case "flow":
        this.stepFlow(dt);
        break;
      case "electric":
        this.stepElectric(dt);
        break;
    }

    // Position integration + toroidal wrap (shared across modes)
    this.integratePositions(dt, boundsX, boundsY);
  }

  // ---- Shared phases ----

  private applyShockwaves(dt: number) {
    if (this.shockwaves.length === 0) return;
    const s = this.state;
    const n = this.count;
    for (const w of this.shockwaves) {
      if (w.age > 0) continue; // already applied
      const radius2 = 300 * 300;
      for (let i = 0; i < n; i++) {
        const dx = s[i * STRIDE] - w.x;
        const dy = s[i * STRIDE + 1] - w.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > radius2 || d2 < 1) continue;
        const falloff = 1 - d2 / radius2;
        const invD = 1 / Math.sqrt(d2);
        const push = w.strength * 400 * falloff * falloff;
        s[i * STRIDE + 2] += dx * invD * push;
        s[i * STRIDE + 3] += dy * invD * push;
      }
    }
    for (const w of this.shockwaves) w.age += dt;
    this.shockwaves = this.shockwaves.filter((w) => w.age < 0.6);
  }

  private integratePositions(dt: number, boundsX: number, boundsY: number) {
    const s = this.state;
    const n = this.count;
    for (let i = 0; i < n; i++) {
      let px = s[i * STRIDE] + s[i * STRIDE + 2] * dt;
      let py = s[i * STRIDE + 1] + s[i * STRIDE + 3] * dt;
      if (px > boundsX) px -= 2 * boundsX;
      if (px < -boundsX) px += 2 * boundsX;
      if (py > boundsY) py -= 2 * boundsY;
      if (py < -boundsY) py += 2 * boundsY;
      s[i * STRIDE]     = px;
      s[i * STRIDE + 1] = py;
    }
  }

  // ---- Mode: gravity (the original) ----

  private stepGravity(dt: number) {
    const s = this.state;
    const n = this.count;
    const G = this.gravity;
    const SOFT2 = 400;
    const CARD_SOFT2 = 150 * 150;
    const CARD_G = this.cardPull;

    for (let i = 0; i < n; i++) {
      let fx = 0, fy = 0;
      const pxi = s[i * STRIDE], pyi = s[i * STRIDE + 1];

      // Particle-particle gravity (brute force O(N²))
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const dx = s[j * STRIDE] - pxi;
        const dy = s[j * STRIDE + 1] - pyi;
        const r2 = dx * dx + dy * dy + SOFT2;
        const invR = 1 / Math.sqrt(r2);
        const invR3 = invR * invR * invR;
        fx += G * dx * invR3;
        fy += G * dy * invR3;
      }

      // Card attractors
      for (const a of this.attractors) {
        const dx = a.x - pxi;
        const dy = a.y - pyi;
        const r2 = dx * dx + dy * dy + CARD_SOFT2;
        const invR = 1 / Math.sqrt(r2);
        const invR3 = invR * invR * invR;
        const k = CARD_G * a.mass;
        fx += k * dx * invR3;
        fy += k * dy * invR3;
      }

      // Semi-implicit Euler with light drag
      s[i * STRIDE + 2] = (s[i * STRIDE + 2] + fx * dt) * 0.998;
      s[i * STRIDE + 3] = (s[i * STRIDE + 3] + fy * dt) * 0.998;
    }
  }

  // ---- Mode: flow (vector field) ----
  //
  // Builds a smooth velocity field from layered sines. At each particle's
  // position we evaluate the field and accelerate toward that velocity.
  // Cards distort the field locally via a swirl pattern around their position.
  // No O(N²) — this is O(N), so we can afford bigger particle counts here.

  private stepFlow(dt: number) {
    const s = this.state;
    const n = this.count;
    this.flowTime += dt;

    const t = this.flowTime;
    // Spatial frequency of the noise pattern (controls "cell size" of the streamlines)
    const FREQ = 0.0035;
    // Field strength: the speed particles try to reach
    const FIELD_SPEED = 90;
    // How fast particles steer toward the target velocity
    const STEER = 1.4;

    for (let i = 0; i < n; i++) {
      const px = s[i * STRIDE];
      const py = s[i * STRIDE + 1];

      // Curl-noise-ish: take gradients of two scalar fields and use them as
      // perpendicular components of a divergence-free flow.
      // Cheap approximation using cross-multiplied sines.
      const a = Math.sin(px * FREQ + t * 0.4) + Math.cos(py * FREQ * 1.3 - t * 0.3);
      const b = Math.cos(px * FREQ * 0.7 - t * 0.5) + Math.sin(py * FREQ - t * 0.2);
      let tvx = a * FIELD_SPEED;
      let tvy = b * FIELD_SPEED;

      // Cards add a swirl: tangential velocity around each card position,
      // strength falling off with distance.
      for (const card of this.attractors) {
        const dx = px - card.x;
        const dy = py - card.y;
        const d2 = dx * dx + dy * dy;
        const radius2 = 350 * 350;
        if (d2 > radius2) continue;
        const falloff = 1 - d2 / radius2;
        const swirl = this.cardPull * 4 * falloff * card.mass;
        // Perpendicular to radius = (-dy, dx) for counter-clockwise
        const invD = 1 / Math.max(Math.sqrt(d2), 1);
        tvx += -dy * invD * swirl;
        tvy += dx * invD * swirl;
      }

      // Steer current velocity toward the target velocity
      const vx = s[i * STRIDE + 2];
      const vy = s[i * STRIDE + 3];
      s[i * STRIDE + 2] = vx + (tvx - vx) * Math.min(1, STEER * dt);
      s[i * STRIDE + 3] = vy + (tvy - vy) * Math.min(1, STEER * dt);
    }
  }

  // ---- Mode: electric (Coulomb) ----
  //
  // Each particle has a +1 or -1 charge. Particle-particle force is Coulomb's
  // law: F ~ q_i*q_j / r². Same-charge pairs repel, opposite pairs attract.
  // Cards count as +charges so they always pull negatives in.

  private stepElectric(dt: number) {
    if (!this.charges) this.assignCharges();
    const charges = this.charges!;
    const s = this.state;
    const n = this.count;
    // Coulomb constant. Higher than gravity so charge interactions dominate
    // and pairs visibly whip around instead of drifting slowly.
    const K = this.gravity * 1.8;
    // Tighter softening so opposite charges accelerate harder before flattening.
    const SOFT2 = 200;
    const CARD_SOFT2 = 140 * 140;
    const CARD_K = this.cardPull * 2.5;

    for (let i = 0; i < n; i++) {
      let fx = 0, fy = 0;
      const pxi = s[i * STRIDE], pyi = s[i * STRIDE + 1];
      const qi = charges[i];

      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const dx = s[j * STRIDE] - pxi;
        const dy = s[j * STRIDE + 1] - pyi;
        const r2 = dx * dx + dy * dy + SOFT2;
        const invR = 1 / Math.sqrt(r2);
        const invR3 = invR * invR * invR;
        // Same charge => repel (negative force), opposite => attract (positive).
        // Force on i points from i toward j when attractive, so we flip signs:
        // attract: fx += K * dx * invR3 (toward j)
        // repel:   fx -= K * dx * invR3 (away from j)
        const sign = qi * charges[j] > 0 ? -1 : 1;
        fx += sign * K * dx * invR3;
        fy += sign * K * dy * invR3;
      }

      // Cards are positive charges. Negatives get attracted, positives repelled.
      for (const card of this.attractors) {
        const dx = card.x - pxi;
        const dy = card.y - pyi;
        const r2 = dx * dx + dy * dy + CARD_SOFT2;
        const invR = 1 / Math.sqrt(r2);
        const invR3 = invR * invR * invR;
        const sign = qi > 0 ? -1 : 1; // same-sign repel, opposite attract
        const k = CARD_K * card.mass;
        fx += sign * k * dx * invR3;
        fy += sign * k * dy * invR3;
      }

      // Lighter drag than gravity mode — keeps high-speed pairs whipping
      // around instead of bleeding off energy in 2 seconds.
      s[i * STRIDE + 2] = (s[i * STRIDE + 2] + fx * dt) * 0.998;
      s[i * STRIDE + 3] = (s[i * STRIDE + 3] + fy * dt) * 0.998;
    }
  }

  draw(boundsX: number, boundsY: number) {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    // Only upload the live range of the state array, not the full capacity —
    // saves bandwidth on small particle counts.
    const liveBytes = this.state.subarray(0, this.count * STRIDE);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, liveBytes);

    gl.useProgram(this.drawProg);
    gl.uniform2f(gl.getUniformLocation(this.drawProg, "u_bounds"), boundsX, boundsY);
    gl.uniform1f(gl.getUniformLocation(this.drawProg, "u_pointSize"), this.pointSize);
    gl.uniform1f(gl.getUniformLocation(this.drawProg, "u_brightness"), this.brightness);
    // Tell the fragment shader which color scheme to use:
    //  0 = speed-based (gravity / flow), 1 = charge-based (electric)
    gl.uniform1i(
      gl.getUniformLocation(this.drawProg, "u_colorMode"),
      this.mode === "electric" ? 1 : 0
    );

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE); // additive
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.POINTS, 0, this.count);
    gl.bindVertexArray(null);

    gl.disable(gl.BLEND);
  }
}
