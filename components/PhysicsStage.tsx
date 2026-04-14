"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  World,
  makeBody,
  setBodyVelocity,
  setBodyAngularVelocity,
  pinBodyToPoint,
  setGravity,
  type Body,
  type Vec2,
} from "@/lib/physics";
import { physicsBus, type GravityMode } from "@/lib/bus";
import { PROJECTS, type Project } from "@/lib/projects";
import { useMediaQuery } from "@/lib/useMediaQuery";
import ProjectModal from "./ProjectModal";
import HUD from "./HUD";
import GravityControls from "./GravityControls";

const CARD_W_DESKTOP = 340;
const CARD_H_DESKTOP = 190;
const CARD_W_MOBILE = 260;
const CARD_H_MOBILE = 150;

/**
 * Greedy word-wrap for a canvas context. Returns up to `maxLines` lines,
 * truncating the final line with an ellipsis if the text overflows.
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (let i = 0; i < words.length; i++) {
    const next = current ? current + " " + words[i] : words[i];
    if (ctx.measureText(next).width <= maxWidth) {
      current = next;
      continue;
    }
    if (current) lines.push(current);
    current = words[i];
    if (lines.length === maxLines - 1) {
      // Last line — stuff the rest in and truncate
      const rest = words.slice(i).join(" ");
      let truncated = rest;
      while (
        truncated.length > 0 &&
        ctx.measureText(truncated + "…").width > maxWidth
      ) {
        truncated = truncated.slice(0, -1);
      }
      lines.push(
        truncated.length < rest.length ? truncated.trimEnd() + "…" : rest
      );
      return lines;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export default function PhysicsStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<World | null>(null);
  // Drag state. We track a small ring buffer of recent pointer samples so that
  // on release we can compute a smoothed velocity over the last ~80ms of hand
  // motion (a single-frame delta is too jittery — think of how a thrown ball
  // "remembers" your arm's motion, not just the final instant).
  const dragRef = useRef<{
    body: Body;
    offset: Vec2;
    samples: { x: number; y: number; t: number }[];
    moved: number;
  } | null>(null);
  const rafRef = useRef<number>(0);
  const fpsRef = useRef<{ frames: number; last: number; fps: number }>({
    frames: 0,
    last: 0,
    fps: 0,
  });

  const [open, setOpen] = useState<Project | null>(null);
  const [gravityMode, setGravityMode] = useState<GravityMode>("down");
  const [hud, setHud] = useState({ fps: 0, bodies: 0, contacts: 0, step: 0 });

  // ---- world init ----
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const world = new World({
      width: window.innerWidth,
      height: window.innerHeight,
      gravity: 1800,
      linearDamping: 0.01,
      angularDamping: 0.01,
      iterations: 8,
    });
    worldRef.current = world;

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      world.resize(w, h);
    };
    resize();
    window.addEventListener("resize", resize);

    // Pick card size based on viewport once at mount — changing the card
    // size after seeding would jank the whole simulation.
    const isMobile = window.matchMedia("(max-width: 720px)").matches;
    const CARD_W = isMobile ? CARD_W_MOBILE : CARD_W_DESKTOP;
    const CARD_H = isMobile ? CARD_H_MOBILE : CARD_H_DESKTOP;

    // Seed cards in an arc above the ground with a small initial velocity.
    // On mobile we stack them more vertically since they won't fit side-by-side.
    const centerX = window.innerWidth / 2;
    PROJECTS.forEach((p, i) => {
      const n = PROJECTS.length;
      const t = (i - (n - 1) / 2) / n;
      let x: number;
      let y: number;
      if (isMobile) {
        // Narrow column, slight horizontal jitter so collisions aren't perfectly axial
        x = centerX + (Math.random() - 0.5) * 40;
        y = 260 + i * (CARD_H + 30);
      } else {
        x = centerX + t * (CARD_W + 40) * 1.1;
        y = 180 + Math.abs(t) * 40;
      }
      const body = makeBody({
        id: p.id,
        pos: { x, y },
        hw: CARD_W / 2,
        hh: CARD_H / 2,
        color: p.color,
        angle: (Math.random() - 0.5) * 0.08,
        restitution: 0.2,
        friction: 0.5,
        meta: p,
      });
      // Small initial velocity so they don't pancake straight down
      setBodyVelocity(body, (Math.random() - 0.5) * 4, Math.random() * 1.5);
      world.add(body);
    });

    return () => {
      window.removeEventListener("resize", resize);
    };
  }, []);

  // ---- animation loop ----
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let lastTime = performance.now();

    const tick = (now: number) => {
      const world = worldRef.current!;
      const dt = Math.min((now - lastTime) / 1000, 1 / 30);
      lastTime = now;

      const g = gravityMode === "zero" ? 0 : gravityMode === "up" ? -1800 : 1800;
      setGravity(world, g);
      world.step(dt);

      // ---- Couple physics → N-body background ----
      // Publish each card as a gravitational attractor in world coords.
      physicsBus.cardAttractors = world.bodies.map((b) => ({
        x: b.pos.x - window.innerWidth / 2,
        y: -(b.pos.y - window.innerHeight / 2), // N-body uses Y-up
        mass: b.held ? 6 : 3, // held cards pull harder — feels satisfying
      }));
      // Drain heavy impacts into shockwaves + screen shake
      const impacts = world.drainImpacts();
      for (const impact of impacts) {
        physicsBus.shockwaves.push({
          x: impact.x - window.innerWidth / 2,
          y: -(impact.y - window.innerHeight / 2),
          strength: impact.strength,
          bornAt: now,
        });
        if (impact.strength > 0.3) {
          physicsBus.screenShakeQueue.push({
            strength: impact.strength,
            bornAt: now,
          });
        }
      }

      // FPS
      const f = fpsRef.current;
      f.frames++;
      if (now - f.last > 500) {
        f.fps = Math.round((f.frames * 1000) / (now - f.last));
        f.frames = 0;
        f.last = now;
        setHud({
          fps: f.fps,
          bodies: world.bodies.length,
          contacts: world.lastContacts,
          step: Math.round(dt * 1000),
        });
      }

      // Render
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      // No grid — the N-body particles provide the background texture.

      // Cards
      for (const b of world.bodies) {
        const p = b.meta as Project;
        ctx.save();
        ctx.translate(b.pos.x, b.pos.y);
        ctx.rotate(b.angle);

        // Scale text sizes relative to the reference desktop card so mobile
        // cards don't look cramped — everything stays proportional.
        const scale = (b.hw * 2) / CARD_W_DESKTOP;
        const pad = Math.round(18 * scale);
        const innerW = b.hw * 2 - pad * 2;
        const radius = Math.max(6, Math.round(10 * scale));

        // shadow (rounded, offset down-right)
        ctx.beginPath();
        ctx.roundRect(-b.hw + 5, -b.hh + 8, b.hw * 2, b.hh * 2, radius);
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.fill();

        // card fill
        ctx.beginPath();
        ctx.roundRect(-b.hw, -b.hh, b.hw * 2, b.hh * 2, radius);
        ctx.fillStyle = p.bg;
        ctx.fill();

        // card border
        ctx.beginPath();
        ctx.roundRect(-b.hw + 1, -b.hh + 1, b.hw * 2 - 2, b.hh * 2 - 2, radius - 1);
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // tag
        ctx.fillStyle = b.color;
        ctx.font = `500 ${Math.round(12 * scale)}px ui-monospace, 'SF Mono', Menlo, monospace`;
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        ctx.fillText(p.tag.toUpperCase(), -b.hw + pad, -b.hh + Math.round(32 * scale));

        // title — wrap to 2 lines if needed
        ctx.fillStyle = "#fafafa";
        const titleFont = Math.round(26 * scale);
        ctx.font = `700 ${titleFont}px ui-sans-serif, system-ui, sans-serif`;
        const titleLines = wrapText(ctx, p.title, innerW, 2);
        let titleY = -b.hh + Math.round(66 * scale);
        const titleLineH = Math.round(30 * scale);
        for (const line of titleLines) {
          ctx.fillText(line, -b.hw + pad, titleY);
          titleY += titleLineH;
        }

        // summary — 2 lines max, smaller, dimmer
        ctx.fillStyle = "rgba(250,250,250,0.72)";
        ctx.font = `${Math.round(13 * scale)}px ui-sans-serif, system-ui, sans-serif`;
        const summaryStart = titleY + Math.round(6 * scale);
        const summaryLines = wrapText(ctx, p.summary, innerW, 2);
        let sy = summaryStart;
        const summaryLineH = Math.round(18 * scale);
        for (const line of summaryLines) {
          ctx.fillText(line, -b.hw + pad, sy);
          sy += summaryLineH;
        }

        // hint
        ctx.fillStyle = "rgba(250,250,250,0.5)";
        ctx.font = `${Math.round(11 * scale)}px ui-monospace, 'SF Mono', Menlo, monospace`;
        ctx.fillText("click to open · drag to throw", -b.hw + pad, b.hh - Math.round(18 * scale));

        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [gravityMode]);

  // ---- input ----
  const getPoint = useCallback((e: PointerEvent | React.PointerEvent): Vec2 => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    const world = worldRef.current;
    if (!world) return;
    const p = getPoint(e);
    const body = world.pick(p);
    if (!body) return;
    body.held = true;
    setBodyVelocity(body, 0, 0);
    setBodyAngularVelocity(body, 0);
    // Move to top of draw order
    world.bodies = world.bodies.filter((b) => b !== body).concat(body);
    dragRef.current = {
      body,
      offset: { x: p.x - body.pos.x, y: p.y - body.pos.y },
      samples: [{ x: p.x, y: p.y, t: performance.now() }],
      moved: 0,
    };
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const p = getPoint(e);
    const last = drag.samples[drag.samples.length - 1];
    drag.moved += Math.hypot(p.x - last.x, p.y - last.y);
    // Pin the body to the cursor — zero velocity while held
    pinBodyToPoint(drag.body, p.x - drag.offset.x, p.y - drag.offset.y);

    drag.samples.push({ x: p.x, y: p.y, t: performance.now() });
    const cutoff = performance.now() - 120;
    while (drag.samples.length > 2 && drag.samples[0].t < cutoff) {
      drag.samples.shift();
    }
  };

  const onPointerUp = () => {
    const drag = dragRef.current;
    if (!drag) return;
    drag.body.held = false;

    if (drag.moved < 6) {
      const project = drag.body.meta as Project;
      setOpen(project);
      dragRef.current = null;
      return;
    }

    // Compute smoothed velocity over the last ~80ms of pointer motion.
    // matter.js uses velocity in px/step (at 60fps, ~1/60 second), NOT px/s,
    // so we convert px/s → px/frame by dividing by 60.
    const samples = drag.samples;
    if (samples.length >= 2) {
      const now = performance.now();
      let oldestIdx = 0;
      for (let i = samples.length - 1; i >= 0; i--) {
        if (now - samples[i].t > 80) { oldestIdx = i; break; }
        oldestIdx = i;
      }
      const a = samples[oldestIdx];
      const b = samples[samples.length - 1];
      const dtSec = Math.max((b.t - a.t) / 1000, 1 / 120);
      const vxPerSec = (b.x - a.x) / dtSec;
      const vyPerSec = (b.y - a.y) / dtSec;

      // Convert px/s → px/frame, clamp
      const MAX = 60; // px/frame, ~3600 px/s
      let vx = vxPerSec / 60;
      let vy = vyPerSec / 60;
      const mag = Math.hypot(vx, vy);
      if (mag > MAX) {
        vx = (vx / mag) * MAX;
        vy = (vy / mag) * MAX;
      }
      setBodyVelocity(drag.body, vx, vy);
    }

    dragRef.current = null;
  };

  // ---- keyboard shortcuts ----
  //  - G: cycle gravity modes (down → up → zero → down)
  //  - Konami code (↑↑↓↓←→←→BA): toggle gravity down/up
  useEffect(() => {
    const konami = [
      "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
      "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
      "b", "a",
    ];
    let idx = 0;
    const onKey = (e: KeyboardEvent) => {
      // Ignore shortcuts while user is typing in an input/textarea (e.g. the terminal)
      const target = e.target as HTMLElement | null;
      const isTyping =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      // G cycles gravity mode
      if (!isTyping && (e.key === "g" || e.key === "G") && !e.metaKey && !e.ctrlKey && !e.altKey) {
        setGravityMode((m) => (m === "down" ? "up" : m === "up" ? "zero" : "down"));
        return;
      }

      // Konami progression
      const want = konami[idx];
      if (e.key === want) {
        idx++;
        if (idx === konami.length) {
          setGravityMode((m) => (m === "down" ? "up" : "down"));
          idx = 0;
        }
      } else {
        idx = e.key === konami[0] ? 1 : 0;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          position: "fixed",
          inset: 0,
          touchAction: "none",
          cursor: dragRef.current ? "grabbing" : "default",
          zIndex: 1,
        }}
      />
      <HUD
        fps={hud.fps}
        bodies={hud.bodies}
        contacts={hud.contacts}
        stepMs={hud.step}
        gravityMode={gravityMode}
      />
      <GravityControls mode={gravityMode} onChange={setGravityMode} />
      {open && <ProjectModal project={open} onClose={() => setOpen(null)} />}
    </>
  );
}
