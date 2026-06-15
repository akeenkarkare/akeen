"use client";

import { useEffect, useRef } from "react";
import NowBanner from "./NowBanner";
import { physicsBus } from "@/lib/bus";

export default function Hero() {
  const panelRef = useRef<HTMLDivElement>(null);

  // Measure the frosted text panel's bounding box and publish it to the bus so
  // PhysicsStage can build a static barrier that matches exactly. The panel is
  // anchored to the top-left, so its right/bottom edges define the barrier.
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const publish = () => {
      const r = el.getBoundingClientRect();
      // A few px of margin so cards rest against the panel without clipping text.
      physicsBus.heroBox = { w: Math.round(r.right + 14), h: Math.round(r.bottom + 14) };
    };
    const ro = new ResizeObserver(publish);
    ro.observe(el);
    publish();
    return () => ro.disconnect();
  }, []);

  return (
    <div
      className="hero-wrap"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        color: "#fafafa",
        pointerEvents: "none",
        zIndex: 5,
        paddingBottom: 24,
      }}
    >
      {/* Nav floats top-right, independent of the text panel. */}
      <nav
        className="hero-nav"
        style={{
          position: "absolute",
          top: 40,
          right: 48,
          display: "flex",
          gap: 10,
          pointerEvents: "auto",
          fontFamily: "var(--mono)",
          fontSize: 11,
          flexWrap: "wrap",
          justifyContent: "flex-end",
        }}
      >
        <NavLink href="/blog">/blog</NavLink>
        <NavLink href="/now">/now</NavLink>
        <NavLink href="/akeen-karkare-resume.pdf" download>
          resume ↓
        </NavLink>
        <NavLink href="https://github.com/akeenkarkare" external>
          github
        </NavLink>
        <NavLink href="https://linkedin.com/in/akeen-karkare" external>
          linkedin
        </NavLink>
      </nav>

      {/* Frosted panel that hugs the text — this is the solid object cards hit. */}
      <div
        ref={panelRef}
        className="hero-panel"
        style={{
          width: "fit-content",
          maxWidth: "min(920px, 70vw)",
          padding: "22px 30px 26px",
          borderRadius: 16,
          background: "rgba(10, 12, 18, 0.82)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div
          className="hero-label"
          style={{ fontFamily: "var(--mono)", color: "#9ca3af" }}
        >
          AKEEN KARKARE // STONY BROOK &apos;27 // PHYSICS + EE
        </div>

        <h1
          className="hero-title"
          style={{ fontFamily: "var(--display)", fontWeight: 700, margin: 0 }}
        >
          I build things that
          <br />
          shouldn&apos;t exist yet.
        </h1>
        <p className="hero-para" style={{ color: "#d1d5db", marginBottom: 0 }}>
          Physics major at Stony Brook. I ship across stacks — coding duels used by
          thousands, a Discord bot serving 70k, ML for exoplanet transits, autonomous
          Jetson robots. The cards below are rigid bodies drifting in a hand-written
          768-particle gravity field. Drag them. Throw them. Click to read.
        </p>
        <NowBanner />

        {/* Stats strip */}
        <div
          className="hero-stats"
          style={{
            display: "flex",
            flexWrap: "wrap",
            fontFamily: "var(--mono)",
            fontSize: 11,
            color: "#9ca3af",
            pointerEvents: "auto",
          }}
        >
          <Stat value="1000+" label="yeetcode users" />
          <Stat value="70,000+" label="asteroid users" />
          <Stat value="200+" label="discord servers" />
          <Stat value="1st" label="sbuhacks 2025" />
          <Stat value="150/wk" label="grader throughput" />
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ lineHeight: 1.2 }}>
      <div style={{ color: "#fef3c7", fontSize: 18, fontWeight: 600 }}>{value}</div>
      <div style={{ color: "#6b7280", fontSize: 10, letterSpacing: 1, textTransform: "uppercase" }}>
        {label}
      </div>
    </div>
  );
}

function NavLink({
  href,
  children,
  download,
  external,
}: {
  href: string;
  children: React.ReactNode;
  download?: boolean;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      {...(download ? { download: true } : {})}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      style={{
        color: "#d1d5db",
        textDecoration: "none",
        padding: "6px 12px",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 4,
        background: "rgba(10, 12, 18, 0.5)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        transition: "border-color 120ms, color 120ms",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(254, 243, 199, 0.6)";
        e.currentTarget.style.color = "#fef3c7";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
        e.currentTarget.style.color = "#d1d5db";
      }}
    >
      {children}
    </a>
  );
}
