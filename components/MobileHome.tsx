"use client";

import { useState } from "react";
import NowBanner from "./NowBanner";
import ProjectModal from "./ProjectModal";
import Terminal from "./Terminal";
import { PROJECTS, type Project } from "@/lib/projects";

/**
 * Mobile home screen. No physics — a clean scrolling list instead.
 * Layout: compact hero → stats strip → project rows → footer.
 * Tapping a row opens the same ProjectModal used on desktop.
 */
export default function MobileHome() {
  const [openProject, setOpenProject] = useState<Project | null>(null);
  const [terminalOpen, setTerminalOpen] = useState(false);

  return (
    <main
      className="mobile-home"
      style={{
        position: "relative",
        zIndex: 5,
        minHeight: "100dvh",
        padding: "24px 20px 32px",
        color: "#fafafa",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
      }}
    >
      {/* Top row: label + nav */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
            fontSize: 10,
            letterSpacing: 1.5,
            color: "#9ca3af",
          }}
        >
          AKEEN KARKARE
        </div>
        <nav
          style={{
            display: "flex",
            gap: 6,
            fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
            fontSize: 10.5,
          }}
        >
          <MobileNavLink href="/now">/now</MobileNavLink>
          <MobileNavLink href="/akeen-karkare-resume.pdf" download>
            resume ↓
          </MobileNavLink>
        </nav>
      </div>

      {/* Hero — compact */}
      <h1
        style={{
          fontSize: 34,
          fontWeight: 700,
          margin: 0,
          letterSpacing: -0.8,
          lineHeight: 1.05,
        }}
      >
        I build things that
        <br />
        shouldn&apos;t exist yet.
      </h1>
      <p
        style={{
          marginTop: 14,
          fontSize: 14,
          lineHeight: 1.55,
          color: "#d1d5db",
        }}
      >
        Physics major at Stony Brook. I ship across stacks — coding duels,
        a 70k-user Discord bot, ML for exoplanet transits, Jetson robots.
      </p>
      <div style={{ marginTop: 14 }}>
        <NowBanner />
      </div>

      {/* Stats strip */}
      <div
        style={{
          marginTop: 20,
          display: "flex",
          flexWrap: "wrap",
          gap: 18,
          fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
          fontSize: 11,
          color: "#9ca3af",
        }}
      >
        <Stat value="1000+" label="yeetcode users" />
        <Stat value="70,000+" label="asteroid users" />
        <Stat value="200+" label="discord servers" />
        <Stat value="1st" label="sbuhacks 2025" />
      </div>

      {/* Project list */}
      <div
        style={{
          marginTop: 28,
          fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
          fontSize: 10.5,
          letterSpacing: 1.5,
          color: "#6b7280",
          textTransform: "uppercase",
          marginBottom: 12,
        }}
      >
        Projects
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {PROJECTS.map((p) => (
          <ProjectRow key={p.id} project={p} onClick={() => setOpenProject(p)} />
        ))}
      </div>

      {/* Social footer */}
      <div
        style={{
          marginTop: 32,
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
          fontSize: 11,
        }}
      >
        <MobileNavLink href="https://github.com/akeenkarkare" external>github ↗</MobileNavLink>
        <MobileNavLink href="https://linkedin.com/in/akeen-karkare" external>linkedin ↗</MobileNavLink>
        <MobileNavLink href="mailto:akeen.karkare@stonybrook.edu">email ↗</MobileNavLink>
        <button
          onClick={() => setTerminalOpen(true)}
          style={{
            padding: "6px 10px",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 4,
            background: "rgba(10, 12, 18, 0.5)",
            color: "#d1d5db",
            fontFamily: "inherit",
            fontSize: "inherit",
            cursor: "pointer",
          }}
        >
          terminal
        </button>
      </div>

      <div
        style={{
          marginTop: 28,
          color: "#4b5563",
          fontSize: 10.5,
          fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
          lineHeight: 1.6,
        }}
      >
        <div>card physics: matter.js (desktop)</div>
        <div>background: 768-particle n-body, handwritten webgl2</div>
      </div>

      {openProject && (
        <ProjectModal project={openProject} onClose={() => setOpenProject(null)} />
      )}

      {/* Controlled terminal for mobile — opened via the button above.
          The `~` keyboard shortcut still works (no-op on most phone keyboards
          but harmless to register). */}
      <Terminal open={terminalOpen} onOpenChange={setTerminalOpen} />
    </main>
  );
}

function ProjectRow({
  project,
  onClick,
}: {
  project: Project;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: "left",
        display: "block",
        width: "100%",
        padding: "14px 16px",
        background: project.bg,
        border: `1px solid ${project.color}`,
        borderRadius: 10,
        color: "#fafafa",
        fontFamily: "inherit",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
          fontSize: 10,
          letterSpacing: 1,
          color: project.color,
          textTransform: "uppercase",
        }}
      >
        {project.tag}
      </div>
      <div
        style={{
          marginTop: 4,
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: -0.3,
          lineHeight: 1.15,
        }}
      >
        {project.title}
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 13,
          lineHeight: 1.45,
          color: "rgba(250,250,250,0.72)",
        }}
      >
        {project.summary}
      </div>
    </button>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ lineHeight: 1.2 }}>
      <div style={{ color: "#fef3c7", fontSize: 16, fontWeight: 600 }}>{value}</div>
      <div
        style={{
          color: "#6b7280",
          fontSize: 9.5,
          letterSpacing: 1,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
    </div>
  );
}

function MobileNavLink({
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
        padding: "5px 10px",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 4,
        background: "rgba(10, 12, 18, 0.5)",
        fontFamily: "inherit",
      }}
    >
      {children}
    </a>
  );
}

