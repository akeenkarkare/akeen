import type { NextConfig } from "next";
import path from "path";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname),
  // Let .md / .mdx files act as pages/imports alongside the usual extensions.
  pageExtensions: ["js", "jsx", "ts", "tsx", "md", "mdx"],
};

const withMDX = createMDX({
  options: {
    // GitHub-flavored markdown (tables, strikethrough, task lists, autolinks).
    // String form keeps this compatible with Turbopack, which can't accept
    // function-valued plugin options.
    remarkPlugins: [["remark-gfm", {}]],
    rehypePlugins: [],
  },
});

export default withMDX(nextConfig);
