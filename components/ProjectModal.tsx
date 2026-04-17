"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Project } from "@/lib/projects";

/**
 * Case study modal. Portaled to document.body so it escapes the ScreenShake
 * transform stacking context. Handles:
 *   - Escape to close
 *   - Click outside to close
 *   - Focus lands on the close button when the modal opens (keyboard a11y)
 *   - Underlying page doesn't scroll while the modal is open
 */
export default function ProjectModal({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  // Escape-to-close + focus management + body scroll lock
  useEffect(() => {
    lastFocusedRef.current = document.activeElement as HTMLElement | null;

    // Lock body scroll while the modal is open so the underlying page
    // doesn't scroll on wheel / trackpad.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    // Focus the close button so ESC / tab navigation lands somewhere sensible.
    closeBtnRef.current?.focus();

    // Reset scroll position when opening a new modal
    scrollRef.current?.scrollTo({ top: 0 });

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      // Return focus to whatever was focused before the modal opened
      lastFocusedRef.current?.focus?.();
    };
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={project.title}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 20,
        animation: "modal-fade 180ms ease-out",
      }}
    >
      <div
        ref={scrollRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          background: project.bg,
          color: "#f5f5f5",
          maxWidth: 720,
          width: "100%",
          maxHeight: "calc(100dvh - 32px)",
          overflow: "auto",
          padding: "clamp(24px, 5vw, 40px)",
          borderRadius: 12,
          border: `1px solid ${project.color}`,
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
        }}
      >
        {/* Corner close button */}
        <button
          ref={closeBtnRef}
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            width: 32,
            height: 32,
            borderRadius: 8,
            border: `1px solid ${project.color}33`,
            background: "transparent",
            color: project.color,
            fontFamily: "var(--mono)",
            fontSize: 16,
            lineHeight: 1,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 120ms, border-color 120ms",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `${project.color}15`;
            e.currentTarget.style.borderColor = project.color;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = `${project.color}33`;
          }}
        >
          ×
        </button>

        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: 11,
            letterSpacing: 1,
            color: project.color,
            marginBottom: 14,
            paddingRight: 40,
          }}
        >
          {project.tag.toUpperCase()}
        </div>
        <h2
          style={{
            fontFamily: "var(--display)",
            fontSize: "clamp(28px, 5vw, 36px)",
            fontWeight: 700,
            margin: 0,
            marginBottom: 10,
            letterSpacing: -0.6,
            lineHeight: 1.1,
            paddingRight: 40,
          }}
        >
          {project.title}
        </h2>
        <p
          style={{
            fontSize: "clamp(14px, 2.3vw, 16px)",
            opacity: 0.85,
            marginTop: 0,
            marginBottom: 24,
            lineHeight: 1.5,
          }}
        >
          {project.summary}
        </p>
        {project.body.map((para, i) => (
          <p
            key={i}
            style={{
              fontSize: "clamp(13.5px, 2.1vw, 15px)",
              lineHeight: 1.7,
              opacity: 0.9,
            }}
          >
            {para}
          </p>
        ))}

        <div style={{ marginTop: 28, display: "flex", flexWrap: "wrap", gap: 8 }}>
          {project.stack.map((s) => (
            <span
              key={s}
              style={{
                fontFamily: "var(--mono)",
                fontSize: 11,
                padding: "4px 10px",
                border: `1px solid ${project.color}`,
                borderRadius: 999,
                color: project.color,
              }}
            >
              {s}
            </span>
          ))}
        </div>

        {/* Action row: external links (primary) + close (secondary). Same row, consistent sizing. */}
        <div
          style={{
            marginTop: 28,
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            alignItems: "center",
          }}
        >
          {project.links?.map((l) => (
            <a
              key={l.href}
              href={l.href}
              target="_blank"
              rel="noreferrer"
              style={{
                fontFamily: "var(--mono)",
                fontSize: 12,
                padding: "10px 16px",
                background: project.color,
                color: project.bg,
                borderRadius: 6,
                textDecoration: "none",
                fontWeight: 600,
                letterSpacing: 0.3,
              }}
            >
              {l.label} ↗
            </a>
          ))}
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              color: project.color,
              border: `1px solid ${project.color}`,
              padding: "10px 16px",
              borderRadius: 6,
              fontFamily: "var(--mono)",
              fontSize: 12,
              cursor: "pointer",
              letterSpacing: 0.3,
            }}
          >
            close · esc
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modal-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>,
    document.body
  );
}
