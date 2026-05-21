/**
 * Blog post registry.
 *
 * @next/mdx doesn't parse frontmatter, so instead of a YAML header in each
 * .mdx file we keep post metadata here in a typed array. This drives:
 *   - the /blog index list
 *   - generateStaticParams() for the [slug] route
 *   - per-post <title>/description metadata
 *
 * The MDX body for each post lives at content/<slug>.mdx and is imported
 * dynamically by the [slug] route.
 */

export interface PostMeta {
  slug: string;
  title: string;
  description: string;
  /** ISO date, e.g. "2026-05-29" */
  date: string;
  /** Estimated read time in minutes */
  readingMinutes: number;
  tags: string[];
}

/** Newest first. */
export const POSTS: PostMeta[] = [
  {
    slug: "building-a-physics-engine",
    title: "I wrote a physics engine for my portfolio, then deleted it",
    description:
      "How the cards on my homepage went from a hand-rolled Verlet solver to matter.js — and why throwing away working code was the right call.",
    date: "2026-05-29",
    readingMinutes: 6,
    tags: ["physics", "webgl", "engineering"],
  },
];

export function getPost(slug: string): PostMeta | undefined {
  return POSTS.find((p) => p.slug === slug);
}
