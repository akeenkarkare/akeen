import type { Metadata } from "next";
import "./globals.css";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Akeen Karkare — physics, software, hardware",
    template: "%s — Akeen Karkare",
  },
  description:
    "Portfolio of Akeen Karkare. Physics + EE at Stony Brook. Builder of YeetCode (1k+ users), Asteroid (70k+ users), AI exoplanet detection, and Jetson-powered robotics.",
  keywords: [
    "Akeen Karkare", "Stony Brook", "physics", "software engineering",
    "YeetCode", "Asteroid", "Jetson", "computational astrophysics",
    "matter.js", "WebGL", "n-body simulation",
  ],
  authors: [{ name: "Akeen Karkare" }],
  openGraph: {
    title: "Akeen Karkare — physics, software, hardware",
    description:
      "Stony Brook physics + EE. Builder of YeetCode, Asteroid (70k+ users), AI exoplanet detection, and Jetson robotics. Cards float in a hand-written N-body gravity field.",
    url: SITE_URL,
    siteName: "Akeen Karkare",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Akeen Karkare — physics, software, hardware",
    description:
      "Stony Brook physics + EE. Builder of YeetCode, Asteroid (70k+ users), and Jetson robotics.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
