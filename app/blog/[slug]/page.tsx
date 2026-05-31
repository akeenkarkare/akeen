import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { POSTS, getPost } from "@/content/posts";

// Prerender every known post at build time; 404 anything not in the registry.
export const dynamicParams = false;

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    openGraph: { title: post.title, description: post.description, type: "article" },
  };
}

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  // Dynamic import of the MDX body. The .mdx extension is required here.
  const { default: Body } = await import(`@/content/${slug}.mdx`);

  return (
    <main
      style={{
        minHeight: "100dvh",
        padding: "56px 24px 96px",
        maxWidth: 680,
        margin: "0 auto",
        color: "#e5e7eb",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
      }}
    >
      {/* Top bar */}
      <div style={{ marginBottom: 36 }}>
        <Link
          href="/blog"
          style={{
            fontFamily: "var(--mono)",
            fontSize: 11,
            color: "#9ca3af",
            textDecoration: "none",
          }}
        >
          ← all posts
        </Link>
      </div>

      {/* Post header */}
      <header style={{ marginBottom: 32 }}>
        <div
          style={{
            display: "flex",
            gap: 12,
            fontFamily: "var(--mono)",
            fontSize: 11,
            color: "#6b7280",
            marginBottom: 14,
          }}
        >
          <span>{formatDate(post.date)}</span>
          <span>·</span>
          <span>{post.readingMinutes} min read</span>
        </div>
        <h1
          style={{
            fontFamily: "var(--display)",
            fontSize: "clamp(30px, 5vw, 42px)",
            fontWeight: 700,
            letterSpacing: -1,
            lineHeight: 1.08,
            margin: 0,
            color: "#fafafa",
          }}
        >
          {post.title}
        </h1>
      </header>

      {/* MDX body — styled via mdx-components.tsx */}
      <article>
        <Body />
      </article>

      {/* Footer */}
      <footer
        style={{
          marginTop: 56,
          paddingTop: 24,
          borderTop: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontFamily: "var(--mono)",
          fontSize: 12,
        }}
      >
        <Link href="/blog" style={{ color: "#9ca3af", textDecoration: "none" }}>
          ← all posts
        </Link>
        <Link href="/" style={{ color: "#fef3c7", textDecoration: "none" }}>
          Back to main page →
        </Link>
      </footer>
    </main>
  );
}
