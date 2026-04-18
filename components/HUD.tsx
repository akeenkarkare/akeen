"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { GravityMode } from "@/lib/bus";

interface Props {
  fps: number;
  bodies: number;
  contacts: number;
  stepMs: number;
  gravityMode: GravityMode;
}

/**
 * Physics debug overlay. Visible on mount, then auto-hides after a few
 * seconds so the portfolio doesn't feel like a dev console. Any user
 * activity (mouse move, key press, pointer) re-shows it briefly, and a
 * small corner toggle pill lets people pin it open.
 *
 * Hidden entirely on small screens — no room.
 */
export default function HUD({ fps, bodies, contacts, stepMs, gravityMode }: Props) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(true);
  const [pinned, setPinned] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const hideTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
    setIsMobile(window.matchMedia("(max-width: 720px)").matches);
  }, []);

  // Auto-hide after 3.5s initially, and 2s after any activity bump.
  useEffect(() => {
    if (!mounted || pinned || isMobile) return;

    const scheduleHide = (ms: number) => {
      if (hideTimerRef.current != null) window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = window.setTimeout(() => setVisible(false), ms);
    };
    scheduleHide(3500);

    const onActivity = () => {
      setVisible(true);
      scheduleHide(2000);
    };
    // Don't listen to pointermove — it fires constantly over the physics sim.
    // Key presses and pointerdown are enough to signal real activity.
    window.addEventListener("keydown", onActivity);
    window.addEventListener("pointerdown", onActivity);

    return () => {
      if (hideTimerRef.current != null) window.clearTimeout(hideTimerRef.current);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("pointerdown", onActivity);
    };
  }, [mounted, pinned, isMobile]);

  if (!mounted || isMobile) return null;

  const gravityLabel =
    gravityMode === "zero" ? "0 px/s²"
      : gravityMode === "up" ? "-1800 px/s²"
        : "+1800 px/s²";

  const rows: [string, string][] = [
    ["engine", "matter.js"],
    ["solver", "sequential impulse"],
    ["iterations", "8 · 8"],
    ["bg sim", "n-body webgl2 (1024 particles)"],
    ["coupling", "cards ↔ particles"],
    ["bodies", String(bodies)],
    ["contacts", String(contacts)],
    ["dt", `${stepMs} ms`],
    ["fps", String(fps)],
    ["gravity", gravityLabel],
  ];

  const showPanel = visible || pinned;

  return createPortal(
    <>
      {/* The always-visible toggle pill. Small, monospace, unobtrusive. */}
      <button
        onClick={() => {
          // Clicking toggles pin state; if currently hidden, also show it.
          setPinned((p) => !p);
          setVisible(true);
        }}
        aria-label={pinned ? "Unpin physics HUD" : "Pin physics HUD"}
        title={pinned ? "click to hide" : "click to pin"}
        style={{
          position: "fixed",
          top: 90,
          right: 16,
          padding: "6px 10px",
          background: "rgba(10, 12, 18, 0.72)",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          color: pinned ? "#fef3c7" : "#9ca3af",
          fontFamily: "var(--mono)",
          fontSize: 10,
          letterSpacing: 1,
          borderRadius: 999,
          cursor: "pointer",
          zIndex: 11,
          transition: "color 120ms",
        }}
      >
        {pinned ? "● physics" : "○ physics"}
      </button>

      {/* The actual panel. Fades in/out. */}
      <div
        style={{
          position: "fixed",
          top: 124,
          right: 16,
          padding: "12px 14px",
          background: "rgba(10, 12, 18, 0.72)",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          color: "#d1d5db",
          fontFamily: "var(--mono)",
          fontSize: 11,
          lineHeight: 1.6,
          borderRadius: 6,
          minWidth: 220,
          pointerEvents: "none",
          zIndex: 10,
          opacity: showPanel ? 1 : 0,
          transform: showPanel ? "translateY(0)" : "translateY(-4px)",
          transition: "opacity 180ms ease, transform 180ms ease",
        }}
      >
        <div style={{ color: "#9ca3af", marginBottom: 6, letterSpacing: 0.5 }}>
          PHYSICS // DEBUG
        </div>
        {rows.map(([k, v]) => (
          <div
            key={k}
            style={{ display: "flex", justifyContent: "space-between", gap: 16 }}
          >
            <span style={{ color: "#6b7280" }}>{k}</span>
            <span style={{ color: "#e5e7eb" }}>{v}</span>
          </div>
        ))}
      </div>
    </>,
    document.body
  );
}
