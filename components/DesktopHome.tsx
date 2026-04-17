"use client";

import PhysicsStage from "./PhysicsStage";
import Hero from "./Hero";
import Terminal from "./Terminal";
import ConsoleGreeting from "./ConsoleGreeting";
import ScreenShake from "./ScreenShake";

/**
 * The physics-cards desktop experience. Everything here is keyboard-and-
 * pointer heavy — not the right fit for small screens.
 *
 * Isolated from MobileHome via `next/dynamic` in HomeRouter so mobile
 * visitors don't pay the matter.js + canvas bundle cost.
 */
export default function DesktopHome() {
  return (
    <div className="physics-root">
      <ScreenShake>
        <PhysicsStage />
      </ScreenShake>
      <Hero />
      <Terminal />
      <ConsoleGreeting />
      <footer
        style={{
          position: "fixed",
          bottom: 14,
          left: 16,
          fontFamily: "var(--mono)",
          fontSize: 10.5,
          color: "#6b7280",
          zIndex: 5,
          pointerEvents: "none",
          lineHeight: 1.6,
          maxWidth: 420,
        }}
      >
        <div style={{ color: "#9ca3af" }}>
          card physics: matter.js &nbsp;·&nbsp; background: 768-particle n-body i wrote in webgl2
        </div>
        <div style={{ color: "#4b5563" }}>
          press <span style={{ color: "#9ca3af" }}>~</span> for terminal &nbsp;·&nbsp;{" "}
          <span style={{ color: "#9ca3af" }}>G</span> cycles gravity &nbsp;·&nbsp;{" "}
          <span style={{ color: "#9ca3af" }}>↑↑↓↓←→←→BA</span> flips it
        </div>
      </footer>
    </div>
  );
}
