import PhysicsStage from "@/components/PhysicsStage";
import NBodyBackground from "@/components/NBodyBackground";
import Hero from "@/components/Hero";
import Terminal from "@/components/Terminal";
import ConsoleGreeting from "@/components/ConsoleGreeting";
import ScreenShake from "@/components/ScreenShake";

export default function Page() {
  return (
    <main className="physics-root">
      <ScreenShake>
        <NBodyBackground />
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
          fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
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
          press <span style={{ color: "#9ca3af" }}>~</span> for terminal &nbsp;·&nbsp; <span style={{ color: "#9ca3af" }}>↑↑↓↓←→←→BA</span> flips gravity
        </div>
      </footer>
    </main>
  );
}
