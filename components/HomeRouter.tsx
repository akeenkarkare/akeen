"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import MobileHome from "./MobileHome";
import NBodyBackground from "./NBodyBackground";

// Lazy-load the desktop simulation so mobile visitors never pay for
// matter.js or the canvas drawing code.
const DesktopHome = dynamic(() => import("./DesktopHome"), { ssr: false });

/**
 * Top-level viewport router. Renders the physics-cards experience on
 * desktop and the scrollable list experience on mobile. The N-body
 * background is shared — it's cheap and looks nice on either layout.
 *
 * We gate the branch on an SSR-safe hook: on the server we render
 * nothing (the mobile/desktop choice is viewport-dependent), then
 * hydrate into the right one on the client. That means the page is
 * briefly blank before mount — which feels fine given the N-body
 * background fills the space.
 */
export default function HomeRouter() {
  // Default to "mobile" so SSR output is the mobile layout (it's smaller,
  // renders meaningfully without JS, and doesn't cause layout shift on
  // slow phones). On mount, we upgrade to desktop if the viewport is wide.
  const [layout, setLayout] = useState<"mobile" | "desktop">("mobile");

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 721px)");
    const update = () => setLayout(mql.matches ? "desktop" : "mobile");
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  return (
    <>
      <NBodyBackground />
      {layout === "desktop" ? <DesktopHome /> : <MobileHome />}
    </>
  );
}
