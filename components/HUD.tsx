"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { GravityMode } from "@/lib/bus";

interface Props {
  fps: number;
  bodies: number;
  contacts: number;
  stepMs: number;
  gravityMode: GravityMode;
}

export default function HUD({ fps, bodies, contacts, stepMs, gravityMode }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  const gravityLabel =
    gravityMode === "zero" ? "0 px/s²"
      : gravityMode === "up" ? "-1800 px/s²"
        : "+1800 px/s²";

  const rows: [string, string][] = [
    ["engine", "matter.js"],
    ["solver", "sequential impulse"],
    ["iterations", "8 · 8"],
    ["bg sim", "n-body webgl2 (768 particles)"],
    ["coupling", "cards ↔ particles"],
    ["bodies", String(bodies)],
    ["contacts", String(contacts)],
    ["dt", `${stepMs} ms`],
    ["fps", String(fps)],
    ["gravity", gravityLabel],
  ];

  return createPortal(
    <div
      style={{
        position: "fixed",
        top: 90,
        right: 16,
        padding: "12px 14px",
        background: "rgba(10, 12, 18, 0.72)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        color: "#d1d5db",
        fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
        fontSize: 11,
        lineHeight: 1.6,
        borderRadius: 6,
        minWidth: 220,
        pointerEvents: "none",
        zIndex: 10,
      }}
    >
      <div style={{ color: "#9ca3af", marginBottom: 6, letterSpacing: 0.5 }}>
        PHYSICS // DEBUG
      </div>
      {rows.map(([k, v]) => (
        <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
          <span style={{ color: "#6b7280" }}>{k}</span>
          <span style={{ color: "#e5e7eb" }}>{v}</span>
        </div>
      ))}
    </div>,
    document.body
  );
}
