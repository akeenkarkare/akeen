"use client";

import { useEffect, useRef } from "react";
import { physicsBus } from "@/lib/bus";

/**
 * A wrapper that applies a subtle CSS transform to its children when heavy
 * collisions land. The physics bus fills a `screenShakeQueue` on impact;
 * we convert each entry into a small exponentially-decaying offset.
 *
 * Intentionally restrained — strong shake feels gimmicky on a portfolio.
 */
export default function ScreenShake({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;

    const tick = (now: number) => {
      // Compute current shake from all active entries in the queue
      let x = 0;
      let y = 0;
      physicsBus.screenShakeQueue = physicsBus.screenShakeQueue.filter((s) => {
        const age = (now - s.bornAt) / 1000; // seconds
        if (age > 0.35) return false;
        // Exponential decay, random direction each frame
        const amp = s.strength * 10 * Math.exp(-age * 12);
        x += (Math.random() - 0.5) * amp;
        y += (Math.random() - 0.5) * amp;
        return true;
      });

      el.style.transform = x || y ? `translate(${x}px, ${y}px)` : "";
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={ref} style={{ willChange: "transform" }}>
      {children}
    </div>
  );
}
