"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { visualizerStore, type FieldMode, type VisualizerState } from "@/lib/bus";
import { useVisualizer } from "@/lib/useVisualizer";

const STORAGE_KEY = "akeen-portfolio:visualizer";
const PARTICLES_MIN = 64;
const PARTICLES_MAX = 1536; // matches NBody.MAX_PARTICLES
const PARTICLES_STEP = 64;

/**
 * Visualizer playground.
 *
 *   - Toggle with the `V` key (skipped while typing in inputs)
 *   - Sliders for particle count / size / brightness
 *   - "Hide UI" zeros out the rest of the page so the simulation is alone
 *   - Reset button restores ship defaults
 *   - Settings persist to localStorage
 *
 * Hidden on mobile via `useMediaQuery` — the panel sliders make no sense
 * without the cards, and the bottom-left corner is too cramped on phones.
 *
 * Portaled to document.body so it escapes the ScreenShake transform layer.
 */
export default function VisualizerPanel() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Live store value, drives slider thumb positions + hide-UI behavior
  const state = useVisualizer();

  // ---- Mount: hydrate from localStorage, set mobile flag ----
  useEffect(() => {
    setMounted(true);
    setIsMobile(window.matchMedia("(max-width: 720px)").matches);

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<VisualizerState>;
        // Validate before applying — bad localStorage shouldn't crash anything
        const safe: Partial<VisualizerState> = {};
        if (typeof saved.particles === "number") {
          safe.particles = clamp(
            Math.round(saved.particles),
            PARTICLES_MIN,
            PARTICLES_MAX
          );
        }
        if (typeof saved.pointSize === "number") {
          safe.pointSize = clamp(saved.pointSize, 1, 14);
        }
        if (typeof saved.brightness === "number") {
          safe.brightness = clamp(saved.brightness, 0.05, 1);
        }
        if (typeof saved.gravity === "number") {
          safe.gravity = clamp(saved.gravity, 0, 5000);
        }
        if (typeof saved.cardPull === "number") {
          safe.cardPull = clamp(saved.cardPull, 0, 200);
        }
        if (
          saved.fieldMode === "gravity" ||
          saved.fieldMode === "flow" ||
          saved.fieldMode === "electric"
        ) {
          safe.fieldMode = saved.fieldMode;
        }
        if (typeof saved.hideUI === "boolean") {
          safe.hideUI = saved.hideUI;
        }
        if (Object.keys(safe).length > 0) visualizerStore.set(safe);
      }
    } catch {
      /* ignore — localStorage may be disabled */
    }
  }, []);

  // ---- Persist on every change (debounced via rAF would be overkill — sliders fire ~60Hz at most) ----
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore quota / disabled */
    }
  }, [mounted, state]);

  // ---- `V` to toggle the panel ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "v" && e.key !== "V") return;
      const t = e.target as HTMLElement | null;
      if (!t) return;
      if (
        t.tagName === "INPUT" ||
        t.tagName === "TEXTAREA" ||
        t.isContentEditable
      ) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      setOpen((o) => !o);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!mounted || isMobile) return null;

  const explode = () => {
    visualizerStore.triggerExplode();
  };

  // The pill (always visible) + the panel body (when open)
  // Sit directly under the HUD physics pill (top: 90, right: 16, ~28px tall),
  // and slide further down when the HUD details panel is shown so we don't
  // overlap. The HUD details panel is ~280px tall.
  const topPos = state.hudShown ? 420 : 130;

  return createPortal(
    <div
      data-visualizer-root="true"
      style={{
        position: "fixed",
        right: 16,
        top: topPos,
        zIndex: 12,
        fontFamily: "var(--mono)",
        transition: "top 220ms ease",
      }}
    >
      {open ? (
        <div
          style={{
            width: 280,
            background: "rgba(10, 12, 18, 0.85)",
            border: "1px solid rgba(254, 243, 199, 0.18)",
            borderRadius: 10,
            padding: 14,
            color: "#d1d5db",
            fontSize: 11,
            lineHeight: 1.5,
            boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <div
              style={{ color: "#fef3c7", letterSpacing: 1.5, fontSize: 10 }}
            >
              VISUALIZER //
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close visualizer"
              style={{
                background: "transparent",
                color: "#9ca3af",
                border: "none",
                cursor: "pointer",
                fontSize: 14,
                padding: 0,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>

          {/* Field mode picker — three-segment toggle. */}
          <div
            style={{
              display: "flex",
              gap: 4,
              padding: 3,
              background: "rgba(255, 255, 255, 0.04)",
              borderRadius: 6,
              marginBottom: 14,
            }}
          >
            <ModeButton
              active={state.fieldMode === "gravity"}
              onClick={() => visualizerStore.set({ fieldMode: "gravity" })}
              label="gravity"
            />
            <ModeButton
              active={state.fieldMode === "flow"}
              onClick={() => visualizerStore.set({ fieldMode: "flow" })}
              label="flow"
            />
            <ModeButton
              active={state.fieldMode === "electric"}
              onClick={() => visualizerStore.set({ fieldMode: "electric" })}
              label="electric"
            />
          </div>

          <Slider
            label="particles"
            value={state.particles}
            min={PARTICLES_MIN}
            max={PARTICLES_MAX}
            step={PARTICLES_STEP}
            display={String(state.particles)}
            onChange={(v) => visualizerStore.set({ particles: v })}
          />
          <Slider
            label="size"
            value={state.pointSize}
            min={1}
            max={14}
            step={0.5}
            display={`${state.pointSize.toFixed(1)}px`}
            onChange={(v) => visualizerStore.set({ pointSize: v })}
          />
          <Slider
            label="brightness"
            value={state.brightness}
            min={0.05}
            max={1}
            step={0.05}
            display={`${Math.round(state.brightness * 100)}%`}
            onChange={(v) => visualizerStore.set({ brightness: v })}
          />

          {/* Gravity bar — particle-particle attraction strength */}
          <Slider
            label="gravity"
            value={state.gravity}
            min={0}
            max={4000}
            step={50}
            display={state.gravity === 0 ? "off" : String(state.gravity)}
            onChange={(v) => visualizerStore.set({ gravity: v })}
          />

          {/* Card pull — how much each card yanks on the particle field */}
          <Slider
            label="card pull"
            value={state.cardPull}
            min={0}
            max={120}
            step={2}
            display={state.cardPull === 0 ? "off" : String(state.cardPull)}
            onChange={(v) => visualizerStore.set({ cardPull: v })}
          />

          <div
            style={{
              marginTop: 14,
              paddingTop: 12,
              borderTop: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              gap: 8,
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <label
              style={{
                display: "inline-flex",
                gap: 8,
                alignItems: "center",
                cursor: "pointer",
                color: state.hideUI ? "#fef3c7" : "#9ca3af",
              }}
            >
              <input
                type="checkbox"
                checked={state.hideUI}
                onChange={(e) =>
                  visualizerStore.set({ hideUI: e.target.checked })
                }
                style={{ accentColor: "#fef3c7" }}
              />
              hide UI
            </label>
            <button
              onClick={explode}
              style={{
                background: "rgba(254, 243, 199, 0.1)",
                border: "1px solid rgba(254, 243, 199, 0.5)",
                color: "#fef3c7",
                padding: "4px 12px",
                borderRadius: 4,
                fontFamily: "inherit",
                fontSize: 10.5,
                cursor: "pointer",
                letterSpacing: 0.5,
              }}
            >
              💥 explode
            </button>
          </div>

          <div
            style={{
              marginTop: 12,
              fontSize: 9.5,
              color: "#4b5563",
              letterSpacing: 0.5,
            }}
          >
            press V to toggle this panel
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(254, 243, 199, 0.08)",
            border: "1px solid rgba(254, 243, 199, 0.45)",
            borderRadius: 999,
            padding: "9px 16px",
            color: "#fef3c7",
            fontFamily: "inherit",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: 1,
            cursor: "pointer",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            boxShadow:
              "0 0 0 0 rgba(254, 243, 199, 0.4), 0 4px 18px rgba(254, 243, 199, 0.15)",
            animation: "vp-pulse 2.4s ease-in-out infinite",
            transition: "transform 120ms, background 120ms",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.background = "rgba(254, 243, 199, 0.14)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "";
            e.currentTarget.style.background = "rgba(254, 243, 199, 0.08)";
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#fef3c7",
              boxShadow: "0 0 8px #fef3c7",
              display: "inline-block",
            }}
          />
          play with the simulation
          <span style={{ opacity: 0.7, fontWeight: 400 }}>(V)</span>
          <style>{`
            @keyframes vp-pulse {
              0%, 100% {
                box-shadow:
                  0 0 0 0 rgba(254, 243, 199, 0.45),
                  0 4px 18px rgba(254, 243, 199, 0.15);
              }
              50% {
                box-shadow:
                  0 0 0 6px rgba(254, 243, 199, 0),
                  0 4px 18px rgba(254, 243, 199, 0.15);
              }
            }
          `}</style>
        </button>
      )}
    </div>,
    document.body
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 4,
        }}
      >
        <span style={{ color: "#6b7280", letterSpacing: 0.5 }}>{label}</span>
        <span style={{ color: "#fef3c7" }}>{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: "100%",
          accentColor: "#fef3c7",
          height: 4,
          cursor: "pointer",
        }}
      />
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: "5px 0",
        border: "none",
        borderRadius: 4,
        background: active ? "#fef3c7" : "transparent",
        color: active ? "#0a0c12" : "#9ca3af",
        fontFamily: "inherit",
        fontSize: 10,
        letterSpacing: 0.5,
        fontWeight: active ? 600 : 400,
        cursor: "pointer",
        transition: "background 120ms, color 120ms",
      }}
    >
      {label}
    </button>
  );
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}
