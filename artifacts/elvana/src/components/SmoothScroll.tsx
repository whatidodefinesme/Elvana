import { useEffect, ReactNode, useRef } from "react";
import Lenis from "lenis";
import { initStringTune, syncStringTuneFromLenis } from "@/lib/stringTuneBootstrap";

export function SmoothScroll({ children }: { children: ReactNode }) {
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.25,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      smoothWheel: true,
      syncTouch: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.8,
    });

    window._lenis = lenis;

    const disposeStringTune = initStringTune();

    const tick = (time: number) => {
      lenis.raf(time);
      syncStringTuneFromLenis(lenis);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      disposeStringTune();
      lenis.destroy();
      delete window._lenis;
    };
  }, []);

  return <>{children}</>;
}
