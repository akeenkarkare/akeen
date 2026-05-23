import Link from "next/link";
import { POSTS } from "@/content/posts";

export const metadata = {
  title: "Blog",
  description: "Writing on physics, software, and the things Akeen Karkare builds.",
};

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogIndex() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        padding: "56px 24px 80px",
        maxWidth: 720,
        margin: "0 auto",
        color: "#e5e7eb",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 40,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: 12,
              letterSpacing: 2,
              color: "#9ca3af",
            }}
          >
            AKEEN // BLOG
          </div>
          <h1
            style={{
              fontFamily: "var(--display)",
              fontSize: 44,
              fontWeight: 700,
              margin: "6px 0 0",
              letterSpacing: -1,
            }}
          >
            Writing.
          </h1>
        </div>
        <Link
          href="/"
          style={{
            fontFamily: "var(--mono)",
            fontSize: 11,
            color: "#9ca3af",
            textDecoration: "none",
            border: "1px solid rgba(255,255,255,0.12)",
            padding: "6px 12px",
            borderRadius: 4,
          }}
        >
          ← back
        </Link>
      </div>

      {/* Post list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {POSTS.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <article
              style={{
                padding: "20px 0",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  fontFamily: "var(--mono)",
                  fontSize: 11,
                  color: "#6b7280",
                  marginBottom: 8,
                }}
              >
                <span>{formatDate(post.date)}</span>
                <span>·</span>
                <span>{post.readingMinutes} min read</span>
              </div>
              <h2
                style={{
                  fontFamily: "var(--display)",
                  fontSize: 22,
                  fontWeight: 700,
                  letterSpacing: -0.4,
                  lineHeight: 1.2,
                  margin: "0 0 8px",
                  color: "#fafafa",
                }}
              >
                {post.title}
              </h2>
              <p style={{ fontSize: 15, lineHeight: 1.55, color: "#9ca3af", margin: 0 }}>
                {post.description}
              </p>
              <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: 10,
                      color: "#fef3c7",
                      border: "1px solid rgba(254, 243, 199, 0.3)",
                      borderRadius: 999,
                      padding: "2px 8px",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          </Link>
        ))}
      </div>
    </main>
  );
}
