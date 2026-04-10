"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { GravityMode } from "@/lib/bus";

interface Props {
  mode: GravityMode;
  onChange: (m: GravityMode) => void;
}

/**
 * Small floating pill of gravity modes. Sits in the bottom-right so it
 * doesn't fight with the HUD or nav. Each button is tabbable.
 *
 * Portaled to document.body to escape the ScreenShake stacking context —
 * otherwise it gets trapped behind the Hero and is invisible.
 */
export default function GravityControls({ mode, onChange }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        padding: "6px 8px",
        background: "rgba(10, 12, 18, 0.72)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        borderRadius: 999,
        display: "flex",
        gap: 4,
        fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
        fontSize: 11,
        zIndex: 10,
      }}
    >
      <span style={{ color: "#6b7280", padding: "6px 8px" }}>gravity //</span>
      <ModeButton label="down" active={mode === "down"} onClick={() => onChange("down")} />
      <ModeButton label="up" active={mode === "up"} onClick={() => onChange("up")} />
      <ModeButton label="zero" active={mode === "zero"} onClick={() => onChange("zero")} />
    </div>,
    document.body
  );
}

function ModeButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 12px",
        background: active ? "#fef3c7" : "transparent",
        color: active ? "#1f2937" : "#d1d5db",
        border: "none",
        borderRadius: 999,
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: "inherit",
        fontWeight: active ? 600 : 400,
        transition: "background 120ms, color 120ms",
      }}
    >
      {label}
    </button>
  );
}
