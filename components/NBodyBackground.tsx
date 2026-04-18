"use client";

import { useEffect, useRef } from "react";
import { NBody } from "@/lib/nbody";
import { physicsBus } from "@/lib/bus";

/**
 * Renders the N-body gravitational particle field as a fixed fullscreen
 * canvas behind everything else. Receives a ref-forwarded cursor position
 * via a shared window-level object so the physics stage and the N-body
 * sim stay decoupled.
 */
export default function NBodyBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl2", { alpha: true, antialias: false });
    if (!gl) {
      // Fail silently — the physics stage still works without the background
      console.warn("[portfolio] WebGL2 not available, N-body background disabled");
      return;
    }
    if (!gl.getExtension("EXT_color_buffer_float")) {
      // Not strictly required anymore (no float textures), but good to check.
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5); // cap for perf
    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const sim = new NBody(gl, 1024);

    let lastTime = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 1 / 30);
      lastTime = now;

      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      const boundsX = w / 2;
      const boundsY = h / 2;

      // Read card attractors from the bus
      sim.setAttractors(physicsBus.cardAttractors);

      // Drain shockwaves from the bus (apply each once)
      while (physicsBus.shockwaves.length > 0) {
        const wave = physicsBus.shockwaves.shift()!;
        sim.addShockwave(wave.x, wave.y, wave.strength);
      }

      sim.step(dt, boundsX, boundsY);

      gl.clearColor(0, 0, 0, 0);
      sim.draw(boundsX, boundsY);

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}
