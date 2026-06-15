"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { visualizerStore, type GravityMode } from "@/lib/bus";
import { useVisualizer } from "@/lib/useVisualizer";

interface Props {
  fps: number;
  bodies: number;
  contacts: number;
  stepMs: number;
  gravityMode: GravityMode;
}

/**
 * Physics debug overlay. Visible briefly on mount as an intro, then auto-hides
 * so the portfolio doesn't feel like a dev console. After that it only opens
 * when the user clicks the corner pill to pin it — we deliberately do NOT
 * re-show it on stray pointer/key activity, since clicking and dragging cards
 * would otherwise pop it open constantly.
 *
 * Hidden entirely on small screens — no room.
 */
export default function HUD({ fps, bodies, contacts, stepMs, gravityMode }: Props) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(true);
  const [pinned, setPinned] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const hideTimerRef = useRef<number | null>(null);

  // Read the current field mode so the HUD reflects whatever the visualizer
  // is showing. Re-renders the HUD when the user picks a different mode.
  const { fieldMode } = useVisualizer();

  useEffect(() => {
    setMounted(true);
    setIsMobile(window.matchMedia("(max-width: 720px)").matches);
  }, []);

  // Show once on mount as an intro, then auto-hide after 3.5s. Runs ONLY on
  // mount (not when `pinned` changes) — otherwise unpinning would re-trigger
  // the intro and the panel would refuse to hide. After this, the corner pill
  // is the only thing that toggles it, so playing with the cards never pops it.
  useEffect(() => {
    if (!mounted || isMobile) return;
    setVisible(true);
    if (hideTimerRef.current != null) window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => setVisible(false), 3500);
    return () => {
      if (hideTimerRef.current != null) window.clearTimeout(hideTimerRef.current);
    };
  }, [mounted, isMobile]);

  // Mirror the HUD details panel visibility into the visualizer store so the
  // VisualizerPanel (which sits below this) can slide out of the way when
  // the HUD pops out. Plain effect — fires only when one of the deps changes.
  const showPanel = visible || pinned;
  useEffect(() => {
    visualizerStore.set({ hudShown: showPanel });
  }, [showPanel]);

  if (!mounted || isMobile) return null;

  const gravityLabel =
    gravityMode === "zero" ? "0 px/s²"
      : gravityMode === "up" ? "-1800 px/s²"
        : "+1800 px/s²";

  const fieldLabel =
    fieldMode === "flow" ? "vector flow (curl noise)"
      : fieldMode === "electric" ? "coulomb (charged)"
        : "n-body gravity";

  const rows: [string, string][] = [
    ["engine", "matter.js"],
    ["solver", "sequential impulse"],
    ["iterations", "8 · 8"],
    ["field", fieldLabel],
    ["coupling", "cards ↔ particles"],
    ["bodies", String(bodies)],
    ["contacts", String(contacts)],
    ["dt", `${stepMs} ms`],
    ["fps", String(fps)],
    ["gravity", gravityLabel],
  ];

  return createPortal(
    <>
      {/* The always-visible toggle pill. Small, monospace, unobtrusive. */}
      <button
        onClick={() => {
          // Cancel any pending intro-hide, then toggle: pinning shows it,
          // unpinning hides it immediately.
          if (hideTimerRef.current != null) window.clearTimeout(hideTimerRef.current);
          setPinned((p) => {
            const next = !p;
            setVisible(next);
            return next;
          });
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
