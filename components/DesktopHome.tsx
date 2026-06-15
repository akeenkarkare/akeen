"use client";

import PhysicsStage from "./PhysicsStage";
import Hero from "./Hero";
import Terminal from "./Terminal";
import ConsoleGreeting from "./ConsoleGreeting";
import ScreenShake from "./ScreenShake";
import VisualizerPanel from "./VisualizerPanel";
import { useVisualizer } from "@/lib/useVisualizer";

/**
 * The physics-cards desktop experience. Everything here is keyboard-and-
 * pointer heavy — not the right fit for small screens.
 *
 * Isolated from MobileHome via `next/dynamic` in HomeRouter so mobile
 * visitors don't pay the matter.js + canvas bundle cost.
 *
 * The "hide UI" toggle from the visualizer panel fades everything except
 * the N-body background and the panel itself, leaving the simulation alone
 * on screen for screenshots / showing-off / contemplation.
 */
export default function DesktopHome() {
  const { hideUI } = useVisualizer();

  return (
    <div className="physics-root">
      {/* Everything inside this wrapper fades to 0 when hideUI is on.
          Pointer events also disable so users don't accidentally drag a
          ghost card while the simulation is the focus. */}
      <div
        style={{
          opacity: hideUI ? 0 : 1,
          pointerEvents: hideUI ? "none" : "auto",
          transition: "opacity 350ms ease",
        }}
      >
        <ScreenShake>
          <PhysicsStage />
        </ScreenShake>
        <Hero />
        <Terminal />
        <ConsoleGreeting />
        <footer
          style={{
            position: "fixed",
            top: 62,
            left: "50%",
            transform: "translateX(-50%)",
            fontFamily: "var(--mono)",
            fontSize: 10.5,
            color: "#6b7280",
            zIndex: 5,
            pointerEvents: "none",
            lineHeight: 1.6,
            maxWidth: 460,
            textAlign: "center",
            padding: "8px 14px",
            borderRadius: 10,
            background: "rgba(10, 12, 18, 0.7)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div style={{ color: "#9ca3af" }}>
            card physics: matter.js &nbsp;·&nbsp; background: 768-particle n-body i wrote in webgl2
          </div>
          <div style={{ color: "#4b5563" }}>
            press <span style={{ color: "#9ca3af" }}>~</span> for terminal &nbsp;·&nbsp;{" "}
            <span style={{ color: "#9ca3af" }}>G</span> cycles gravity &nbsp;·&nbsp;{" "}
            <span style={{ color: "#9ca3af" }}>V</span> opens visualizer
          </div>
        </footer>
      </div>

      {/* Always visible — sits outside the hideUI wrapper so users can bring
          everything back. */}
      <VisualizerPanel />
    </div>
  );
}
