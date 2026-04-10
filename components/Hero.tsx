"use client";

import NowBanner from "./NowBanner";

export default function Hero() {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        padding: "40px 48px 0",
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
          gap: 24,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
            fontSize: 12,
            letterSpacing: 2,
            color: "#9ca3af",
          }}
        >
          AKEEN KARKARE // STONY BROOK '27 // PHYSICS + EE
        </div>
        <nav
          style={{
            display: "flex",
            gap: 10,
            pointerEvents: "auto",
            fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
            fontSize: 11,
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
        style={{
          marginTop: 28,
          fontSize: 56,
          fontWeight: 700,
          marginBottom: 0,
          lineHeight: 1.02,
          maxWidth: 880,
          letterSpacing: -1.2,
        }}
      >
        I build things that
        <br />
        shouldn&apos;t exist yet.
      </h1>
      <p
        style={{
          marginTop: 20,
          fontSize: 16,
          maxWidth: 580,
          color: "#d1d5db",
          lineHeight: 1.6,
        }}
      >
        Physics major at Stony Brook. I ship fast and across stacks — coding duels
        used by thousands, a Discord bot serving 70k, an ML pipeline classifying
        exoplanet transits, autonomous robots running on a Jetson. The cards below
        are simulated rigid bodies, drifting in a 768-particle gravitational field
        I wrote by hand in WebGL. Drag them. Throw them. Click to read.
      </p>
      <NowBanner />

      {/* Stats strip */}
      <div
        style={{
          marginTop: 22,
          display: "flex",
          gap: 28,
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
