"use client";

/**
 * One-line "currently building" banner. Hand-edited — the value of this is
 * that it signals the site is actively maintained. Update the string whenever
 * you ship something; it's the easiest heartbeat you can give a recruiter.
 */
const STATUS = "YeetCode mobile redesign + chasing a computational astrophysics research slot";

export default function NowBanner() {
  return (
    <div
      style={{
        marginTop: 20,
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 14px",
        background: "rgba(17, 19, 26, 0.75)",
        border: "1px solid rgba(34, 197, 94, 0.25)",
        borderRadius: 999,
        fontFamily: "var(--mono)",
        fontSize: 11,
        color: "#d1d5db",
        pointerEvents: "auto",
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "#22c55e",
          boxShadow: "0 0 8px #22c55e",
          animation: "pulse 2s ease-in-out infinite",
          display: "inline-block",
        }}
      />
      <span style={{ color: "#6b7280" }}>now //</span>
      <span>{STATUS}</span>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
