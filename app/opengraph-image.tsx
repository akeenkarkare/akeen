import { ImageResponse } from "next/og";

// Open Graph image for link unfurls on Twitter, Slack, Discord, iMessage, etc.
// See https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image

export const alt = "Akeen Karkare — physics, software, hardware";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0a0c12",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          fontFamily: "sans-serif",
          color: "#fafafa",
          position: "relative",
        }}
      >
        {/* Decorative particle-like dots in the corners to hint at the N-body vibe */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexWrap: "wrap",
            opacity: 0.5,
          }}
        >
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${(i * 53) % 100}%`,
                top: `${(i * 37) % 100}%`,
                width: 4 + (i % 3) * 2,
                height: 4 + (i % 3) * 2,
                borderRadius: "50%",
                background: i % 3 === 0 ? "#fef3c7" : "#6b8fff",
                opacity: 0.35 + ((i * 13) % 100) / 200,
              }}
            />
          ))}
        </div>

        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontFamily: "monospace",
            fontSize: 18,
            color: "#9ca3af",
            letterSpacing: 2,
          }}
        >
          <div style={{ display: "flex" }}>AKEEN KARKARE // STONY BROOK &apos;27</div>
          <div style={{ display: "flex" }}>PHYSICS + EE</div>
        </div>

        {/* Main */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 80,
              fontWeight: 700,
              letterSpacing: -2,
              lineHeight: 1.02,
              color: "#fafafa",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ display: "flex" }}>I build things that</div>
            <div style={{ display: "flex" }}>shouldn&apos;t exist yet.</div>
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 24,
              color: "#d1d5db",
              maxWidth: 900,
              display: "flex",
            }}
          >
            YeetCode · Asteroid · Jetson robots · AI exoplanet detection
          </div>
        </div>

        {/* Footer stats */}
        <div
          style={{
            display: "flex",
            gap: 40,
            fontFamily: "monospace",
            fontSize: 18,
            color: "#9ca3af",
          }}
        >
          <StatTile value="1,000+" label="yeetcode users" />
          <StatTile value="70,000+" label="asteroid users" />
          <StatTile value="1st" label="sbuhacks 2025" />
          <StatTile value="150/wk" label="grader throughput" />
        </div>
      </div>
    ),
    size
  );
}

function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ color: "#fef3c7", fontSize: 30, fontWeight: 700, display: "flex" }}>
        {value}
      </div>
      <div style={{ color: "#6b7280", fontSize: 14, letterSpacing: 1, display: "flex" }}>
        {label.toUpperCase()}
      </div>
    </div>
  );
}
