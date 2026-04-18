/**
 * N-body gravitational particle field.
 *
 * Hybrid approach:
 *   - Physics on the CPU (simple, easy to tune, no WebGL state juggling)
 *   - Rendering in WebGL2 with additive-blended soft points for the nebula glow
 *
 * The force calculation is O(N²) brute force, but with N=512 that's ~260k
 * pair ops per step — trivial in a tight Float32Array loop. Softening length
 * prevents singularities when particles pass close.
 *
 * Wraps toroidally so particles never escape the view.
 */

const DRAW_VS = /* glsl */ `#version 300 es
precision highp float;

in vec2 a_pos;
in vec2 a_vel;

uniform vec2 u_bounds;
out float v_speed;

void main() {
  vec2 ndc = a_pos / u_bounds;
  gl_Position = vec4(ndc, 0.0, 1.0);
  gl_PointSize = 5.0;
  v_speed = length(a_vel);
}
`;

const DRAW_FS = /* glsl */ `#version 300 es
precision highp float;

in float v_speed;
out vec4 outColor;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.0, d);

  // Color by speed: slow = cool blue, fast = warm amber
  float t = clamp(v_speed / 300.0, 0.0, 1.0);
  vec3 cold = vec3(0.30, 0.50, 1.00);
  vec3 warm = vec3(1.00, 0.78, 0.40);
  vec3 col = mix(cold, warm, t);

  outColor = vec4(col * a, a * 0.45);
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

export class NBody {
  private gl: WebGL2RenderingContext;
  private drawProg: WebGLProgram;
  private buffer: WebGLBuffer;
  private vao: WebGLVertexArrayObject;
  private count: number;

  // Interleaved [px, py, vx, vy] for each particle
  private state: Float32Array;
  // Multiple gravitational attractors (the portfolio cards)
  private attractors: { x: number; y: number; mass: number }[] = [];
  // Active shockwaves — radial velocity impulses that decay over time
  private shockwaves: { x: number; y: number; strength: number; age: number }[] = [];

  constructor(gl: WebGL2RenderingContext, count = 512) {
    this.gl = gl;
    this.count = count;
    this.state = new Float32Array(count * 4);

    // Seed: a few orbiting clusters scattered across the view
    const w = gl.drawingBufferWidth / (window.devicePixelRatio || 1);
    const h = gl.drawingBufferHeight / (window.devicePixelRatio || 1);
    // Seed particles across the FULL viewport, with light orbital motion.
    // Uniform scatter fills the screen; the card attractors can still gather
    // them into local swarms without leaving the edges barren.
    for (let i = 0; i < count; i++) {
      const px = (Math.random() - 0.5) * w * 1.1;
      const py = (Math.random() - 0.5) * h * 1.1;
      // Tangential velocity around the screen center for gentle rotation
      const r = Math.hypot(px, py);
      const tangent = r > 1 ? { x: -py / r, y: px / r } : { x: 1, y: 0 };
      const speed = 30 + Math.random() * 40;
      this.state[i * 4 + 0] = px;
      this.state[i * 4 + 1] = py;
      this.state[i * 4 + 2] = tangent.x * speed + (Math.random() - 0.5) * 20;
      this.state[i * 4 + 3] = tangent.y * speed + (Math.random() - 0.5) * 20;
    }

    this.drawProg = link(gl, DRAW_VS, DRAW_FS);

    this.buffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.state, gl.DYNAMIC_DRAW);

    this.vao = gl.createVertexArray()!;
    gl.bindVertexArray(this.vao);
    const aPos = gl.getAttribLocation(this.drawProg, "a_pos");
    const aVel = gl.getAttribLocation(this.drawProg, "a_vel");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(aVel);
    gl.vertexAttribPointer(aVel, 2, gl.FLOAT, false, 16, 8);
    gl.bindVertexArray(null);
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
    const s = this.state;
    const n = this.count;
    const G = 1200;
    const SOFT2 = 400; // softening length squared (20px)

    // --- Apply shockwaves as one-shot velocity impulses ---
    // A shockwave is a brief radial push; we apply its full velocity impulse
    // on the frame it's born, then let the particle physics carry it.
    if (this.shockwaves.length > 0) {
      for (const w of this.shockwaves) {
        if (w.age > 0) continue; // already applied
        const radius2 = 300 * 300; // effect radius squared
        for (let i = 0; i < n; i++) {
          const dx = s[i * 4] - w.x;
          const dy = s[i * 4 + 1] - w.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > radius2 || d2 < 1) continue;
          const falloff = 1 - d2 / radius2;
          const invD = 1 / Math.sqrt(d2);
          const push = w.strength * 400 * falloff * falloff;
          s[i * 4 + 2] += dx * invD * push;
          s[i * 4 + 3] += dy * invD * push;
        }
      }
      // Age + prune
      for (const w of this.shockwaves) w.age += dt;
      this.shockwaves = this.shockwaves.filter((w) => w.age < 0.6);
    }

    // Force accumulation (brute force O(N²))
    for (let i = 0; i < n; i++) {
      let fx = 0, fy = 0;
      const pxi = s[i * 4], pyi = s[i * 4 + 1];

      // Particle-particle gravity
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const dx = s[j * 4] - pxi;
        const dy = s[j * 4 + 1] - pyi;
        const r2 = dx * dx + dy * dy + SOFT2;
        const invR = 1 / Math.sqrt(r2);
        const invR3 = invR * invR * invR;
        fx += G * dx * invR3;
        fy += G * dy * invR3;
      }

      // Card attractors — each card is a point mass that tugs on particles.
      // Softening is large so particles don't diverge at card edges, and the
      // gravitational constant is gentle so the field doesn't collapse into
      // one big clump in the middle.
      const CARD_SOFT2 = 150 * 150;
      const CARD_G = 20;
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

      // Integrate velocity (semi-implicit Euler)
      s[i * 4 + 2] = (s[i * 4 + 2] + fx * dt) * 0.998;
      s[i * 4 + 3] = (s[i * 4 + 3] + fy * dt) * 0.998;
    }

    // Integrate position & wrap
    for (let i = 0; i < n; i++) {
      let px = s[i * 4] + s[i * 4 + 2] * dt;
      let py = s[i * 4 + 1] + s[i * 4 + 3] * dt;
      if (px >  boundsX) px -= 2 * boundsX;
      if (px < -boundsX) px += 2 * boundsX;
      if (py >  boundsY) py -= 2 * boundsY;
      if (py < -boundsY) py += 2 * boundsY;
      s[i * 4]     = px;
      s[i * 4 + 1] = py;
    }
  }

  draw(boundsX: number, boundsY: number) {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.state);

    gl.useProgram(this.drawProg);
    gl.uniform2f(gl.getUniformLocation(this.drawProg, "u_bounds"), boundsX, boundsY);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE); // additive
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.POINTS, 0, this.count);
    gl.bindVertexArray(null);

    gl.disable(gl.BLEND);
  }
}
