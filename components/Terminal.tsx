"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Hidden terminal easter egg. Press `~` to open.
 * A stubbed shell that knows a handful of real commands. Not a full REPL —
 * just enough to reward devs who look closely.
 */

interface Line {
  kind: "input" | "output" | "system";
  text: string;
}

const HELP = `available commands:
  whoami         — who is running this site
  ls             — list projects
  cat <project>  — read a project
  skills         — tech stack
  resume         — download resume
  contact        — how to reach me
  clear          — clear the screen
  exit           — close terminal (or press ~)`;

const PROJECTS: Record<string, string> = {
  yeetcode: "YeetCode — gamified coding interviews. 1000+ users. https://yeetcode.xyz",
  asteroid: "Asteroid — Discord bot, 70k+ users across 200+ servers.",
  exoplanet: "AI Exoplanet Detector — ML pipeline classifying transit signals. PyTorch + sklearn.",
  jetson: "Jetson delivery robot — YOLO + TensorRT + CUDA on an Orin Nano.",
  brainsquared: "BrainSquared — vector-indexed browsing history. SBUHacks 2025 winner.",
  research: "SBU Research Assistant — AI academic assistant in C++, deployed across departments.",
};

interface TerminalProps {
  /** Controlled open state. If provided, `~` still toggles via onOpenChange. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function Terminal({ open: openProp, onOpenChange }: TerminalProps = {}) {
  const [openInternal, setOpenInternal] = useState(false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? !!openProp : openInternal;

  // Keep a ref to the latest open value so the `~` keydown listener (which
  // only binds once) can compute the correct toggle target regardless of
  // controlled vs uncontrolled mode.
  const openRef = useRef(open);
  openRef.current = open;

  const toggleOpen = () => {
    const next = !openRef.current;
    if (!isControlled) setOpenInternal(next);
    onOpenChange?.(next);
  };
  const closeTerminal = () => {
    if (!isControlled) setOpenInternal(false);
    onOpenChange?.(false);
  };

  const [lines, setLines] = useState<Line[]>([
    { kind: "system", text: "akeen-os v1.0 · type `help` for commands · press ~ to close" },
  ]);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Command history navigation (↑/↓). Newest last; cursor index is -1 when
  // the user is typing a fresh command. We store successful submissions only.
  const historyRef = useRef<string[]>([]);
  const historyCursorRef = useRef<number>(-1);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "~" || e.key === "`") {
        // Don't trigger if the user is typing in any input/textarea
        const target = e.target as HTMLElement;
        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable
        ) return;
        e.preventDefault();
        toggleOpen();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // toggleOpen is stable by design (reads openRef), so we intentionally omit it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines]);

  const run = (raw: string) => {
    const cmd = raw.trim();
    const newLines: Line[] = [{ kind: "input", text: `$ ${raw}` }];

    if (!cmd) {
      setLines((l) => [...l, ...newLines]);
      return;
    }

    // Push to history (skip consecutive duplicates), reset cursor
    const hist = historyRef.current;
    if (hist[hist.length - 1] !== cmd) hist.push(cmd);
    historyCursorRef.current = -1;

    const [verb, ...args] = cmd.split(/\s+/);
    switch (verb.toLowerCase()) {
      case "help":
        newLines.push({ kind: "output", text: HELP });
        break;
      case "whoami":
        newLines.push({
          kind: "output",
          text: "akeen karkare — stony brook '27 · physics + EE · builds fast, ships real things.",
        });
        break;
      case "ls":
        newLines.push({
          kind: "output",
          text: Object.keys(PROJECTS).join("  "),
        });
        break;
      case "cat": {
        const name = args[0]?.toLowerCase();
        if (!name) {
          newLines.push({ kind: "output", text: "usage: cat <project>" });
        } else if (PROJECTS[name]) {
          newLines.push({ kind: "output", text: PROJECTS[name] });
        } else {
          newLines.push({ kind: "output", text: `no such project: ${name}` });
        }
        break;
      }
      case "skills":
        newLines.push({
          kind: "output",
          text: "python · c++ · typescript · next.js · fastapi · pytorch · sklearn · cuda · jetson · docker · linux",
        });
        break;
      case "resume":
        newLines.push({ kind: "output", text: "downloading resume..." });
        setTimeout(() => {
          const a = document.createElement("a");
          a.href = "/akeen-karkare-resume.pdf";
          a.download = "akeen-karkare-resume.pdf";
          a.click();
        }, 150);
        break;
      case "contact":
        newLines.push({
          kind: "output",
          text: "email: akeen.karkare@stonybrook.edu\ngithub: github.com/akeenkarkare\nlinkedin: linkedin.com/in/akeen-karkare",
        });
        break;
      case "clear":
        setLines([]);
        return;
      case "exit":
        closeTerminal();
        return;
      case "sudo":
        newLines.push({ kind: "output", text: "nice try." });
        break;
      case "rm":
        newLines.push({ kind: "output", text: "i worked hard on these. no." });
        break;
      default:
        newLines.push({ kind: "output", text: `command not found: ${verb}` });
    }
    setLines((l) => [...l, ...newLines]);
  };

  if (!open) return null;

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      style={{
        position: "fixed",
        left: 20,
        right: 20,
        bottom: 20,
        height: "min(420px, 55vh)",
        background: "rgba(6, 8, 12, 0.94)",
        border: "1px solid rgba(254, 243, 199, 0.2)",
        borderRadius: 8,
        boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        fontFamily: "var(--mono)",
        fontSize: 13,
        color: "#e5e7eb",
        display: "flex",
        flexDirection: "column",
        zIndex: 30,
        overflow: "hidden",
      }}
    >
      {/* titlebar */}
      <div
        style={{
          position: "relative",
          padding: "8px 14px",
          background: "rgba(254, 243, 199, 0.06)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", gap: 6 }}>
          <Dot color="#ef4444" onClick={closeTerminal} title="close" />
          <Dot color="#facc15" />
          <Dot color="#22c55e" />
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            textAlign: "center",
            color: "#9ca3af",
            fontSize: 11,
            pointerEvents: "none",
          }}
        >
          akeen@portfolio:~
        </div>
      </div>
      {/* scrollback */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px 16px",
          lineHeight: 1.5,
          whiteSpace: "pre-wrap",
        }}
      >
        {lines.map((l, i) => (
          <div
            key={i}
            style={{
              color:
                l.kind === "input" ? "#fef3c7"
                  : l.kind === "system" ? "#6b7280"
                    : "#e5e7eb",
            }}
          >
            {l.text}
          </div>
        ))}
      </div>
      {/* input */}
      <div
        style={{
          padding: "10px 16px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ color: "#fef3c7" }}>$</span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              run(input);
              setInput("");
              return;
            }
            // History navigation. We use a ref-based cursor so arrow-key
            // presses don't trigger renders unnecessarily; we only setState
            // to change the displayed input value.
            if (e.key === "ArrowUp") {
              e.preventDefault();
              const hist = historyRef.current;
              if (hist.length === 0) return;
              let c = historyCursorRef.current;
              // -1 means "typing fresh"; first up-arrow goes to most recent
              c = c === -1 ? hist.length - 1 : Math.max(0, c - 1);
              historyCursorRef.current = c;
              setInput(hist[c]);
              return;
            }
            if (e.key === "ArrowDown") {
              e.preventDefault();
              const hist = historyRef.current;
              if (hist.length === 0) return;
              let c = historyCursorRef.current;
              if (c === -1) return; // already typing fresh
              c += 1;
              if (c >= hist.length) {
                historyCursorRef.current = -1;
                setInput("");
              } else {
                historyCursorRef.current = c;
                setInput(hist[c]);
              }
              return;
            }
          }}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "#e5e7eb",
            fontFamily: "inherit",
            fontSize: "inherit",
          }}
        />
      </div>
    </div>
  );
}

function Dot({
  color,
  onClick,
  title,
}: {
  color: string;
  onClick?: () => void;
  title?: string;
}) {
  return (
    <span
      onClick={onClick}
      title={title}
      style={{
        width: 12,
        height: 12,
        borderRadius: "50%",
        background: color,
        display: "inline-block",
        cursor: onClick ? "pointer" : "default",
        transition: "filter 120ms",
      }}
      onMouseEnter={(e) => {
        if (onClick) e.currentTarget.style.filter = "brightness(1.4)";
      }}
      onMouseLeave={(e) => {
        if (onClick) e.currentTarget.style.filter = "";
      }}
    />
  );
}
