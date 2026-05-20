import type { MDXComponents } from "mdx/types";

/**
 * Global MDX component mapping. Required at the project root for @next/mdx
 * to work with the App Router. Styles markdown's generated HTML to match
 * the site's dark "lab" aesthetic — Space Grotesk headings, JetBrains Mono
 * code, amber accents.
 */
const components: MDXComponents = {
  h1: ({ children }) => (
    <h1
      style={{
        fontFamily: "var(--display)",
        fontSize: "clamp(30px, 5vw, 40px)",
        fontWeight: 700,
        letterSpacing: -0.8,
        lineHeight: 1.1,
        margin: "0 0 8px",
        color: "#fafafa",
      }}
    >
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2
      style={{
        fontFamily: "var(--display)",
        fontSize: 24,
        fontWeight: 700,
        letterSpacing: -0.4,
        margin: "40px 0 12px",
        color: "#fafafa",
      }}
    >
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3
      style={{
        fontFamily: "var(--display)",
        fontSize: 18,
        fontWeight: 600,
        margin: "28px 0 8px",
        color: "#e5e7eb",
      }}
    >
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p style={{ fontSize: 16, lineHeight: 1.75, color: "#d1d5db", margin: "0 0 18px" }}>
      {children}
    </p>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noreferrer" : undefined}
      style={{ color: "#fef3c7", textDecoration: "underline", textUnderlineOffset: 3 }}
    >
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul style={{ margin: "0 0 18px", paddingLeft: 22, color: "#d1d5db", lineHeight: 1.7 }}>
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol style={{ margin: "0 0 18px", paddingLeft: 22, color: "#d1d5db", lineHeight: 1.7 }}>
      {children}
    </ol>
  ),
  li: ({ children }) => <li style={{ marginBottom: 6, fontSize: 16 }}>{children}</li>,
  blockquote: ({ children }) => (
    <blockquote
      style={{
        margin: "0 0 18px",
        paddingLeft: 16,
        borderLeft: "3px solid rgba(254, 243, 199, 0.5)",
        color: "#9ca3af",
        fontStyle: "italic",
      }}
    >
      {children}
    </blockquote>
  ),
  // Inline code
  code: ({ children }) => (
    <code
      style={{
        fontFamily: "var(--mono)",
        fontSize: "0.88em",
        background: "rgba(255,255,255,0.07)",
        padding: "2px 6px",
        borderRadius: 4,
        color: "#fef3c7",
      }}
    >
      {children}
    </code>
  ),
  // Code blocks: <pre> wraps a <code>. Style the pre; the inner code resets.
  pre: ({ children }) => (
    <pre
      style={{
        fontFamily: "var(--mono)",
        fontSize: 13,
        lineHeight: 1.6,
        background: "rgba(10, 12, 18, 0.9)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 8,
        padding: 16,
        overflowX: "auto",
        margin: "0 0 18px",
        color: "#e5e7eb",
      }}
    >
      {children}
    </pre>
  ),
  hr: () => (
    <hr
      style={{
        border: "none",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        margin: "32px 0",
      }}
    />
  ),
  strong: ({ children }) => (
    <strong style={{ color: "#fafafa", fontWeight: 600 }}>{children}</strong>
  ),
};

export function useMDXComponents(): MDXComponents {
  return components;
}
