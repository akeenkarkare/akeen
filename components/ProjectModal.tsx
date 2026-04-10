"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Project } from "@/lib/projects";

export default function ProjectModal({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  // Portal target — `document.body`, but only after hydration so SSR matches.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        zIndex: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: project.bg,
          color: "#f5f5f5",
          maxWidth: 720,
          width: "100%",
          maxHeight: "86vh",
          overflow: "auto",
          padding: "36px 40px",
          borderRadius: 10,
          border: `1px solid ${project.color}`,
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
        }}
      >
        <div
          style={{
            fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
            fontSize: 11,
            letterSpacing: 1,
            color: project.color,
            marginBottom: 14,
          }}
        >
          {project.tag.toUpperCase()}
        </div>
        <h2 style={{ fontSize: 36, fontWeight: 700, margin: 0, marginBottom: 10 }}>
          {project.title}
        </h2>
        <p style={{ fontSize: 16, opacity: 0.85, marginTop: 0, marginBottom: 24 }}>
          {project.summary}
        </p>
        {project.body.map((para, i) => (
          <p key={i} style={{ fontSize: 15, lineHeight: 1.7, opacity: 0.9 }}>
            {para}
          </p>
        ))}
        <div style={{ marginTop: 28, display: "flex", flexWrap: "wrap", gap: 8 }}>
          {project.stack.map((s) => (
            <span
              key={s}
              style={{
                fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
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
        {project.links && project.links.length > 0 && (
          <div style={{ marginTop: 20, display: "flex", flexWrap: "wrap", gap: 10 }}>
            {project.links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
                  fontSize: 12,
                  padding: "8px 14px",
                  background: project.color,
                  color: project.bg,
                  borderRadius: 6,
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                {l.label} ↗
              </a>
            ))}
          </div>
        )}
        <button
          onClick={onClose}
          style={{
            marginTop: 32,
            background: "transparent",
            color: project.color,
            border: `1px solid ${project.color}`,
            padding: "10px 18px",
            borderRadius: 6,
            fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          [ close · esc ]
        </button>
      </div>
    </div>,
    document.body
  );
}
