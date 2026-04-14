"use client";

import NowBanner from "./NowBanner";

export default function Hero() {
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
      }}
    >
      {/* Top row: label + nav. pointer-events re-enabled on interactive bits only. */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div
          className="hero-label"
          style={{
            fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
            color: "#9ca3af",
          }}
        >
          AKEEN KARKARE // STONY BROOK &apos;27 // PHYSICS + EE
        </div>
        <nav
          className="hero-nav"
          style={{
            display: "flex",
            gap: 10,
            pointerEvents: "auto",
            fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
            fontSize: 11,
            flexWrap: "wrap",
          }}
        >
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
      </div>

      <h1
        className="hero-title"
        style={{ fontWeight: 700, margin: 0 }}
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
          fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
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
