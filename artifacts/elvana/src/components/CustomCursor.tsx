import { useEffect, useRef } from "react";

interface TrailPoint {
  x: number;
  y: number;
  time: number;
}

export function CustomCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trailRef = useRef<TrailPoint[]>([]);
  const mouseRef = useRef({ x: -200, y: -200 });
  const rafRef = useRef<number>(0);
  const isInsideRef = useRef(true);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      trailRef.current.push({ x: e.clientX, y: e.clientY, time: Date.now() });
    };
    const onMouseLeave = () => { isInsideRef.current = false; };
    const onMouseEnter = () => { isInsideRef.current = true; };

    window.addEventListener("mousemove", onMouseMove);
    document.documentElement.addEventListener("mouseleave", onMouseLeave);
    document.documentElement.addEventListener("mouseenter", onMouseEnter);

    const TRAIL_DURATION = 520; // ms the trail lives
    const MAX_RADIUS = 4.5;
    const MIN_RADIUS = 0.8;

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const now = Date.now();

      // Prune old points
      trailRef.current = trailRef.current.filter(
        (p) => now - p.time < TRAIL_DURATION
      );

      const trail = trailRef.current;
      if (trail.length < 2) return;

      // Draw each point as a glowing orb fading out by age
      for (let i = 0; i < trail.length; i++) {
        const point = trail[i];
        const age = now - point.time;
        const progress = 1 - age / TRAIL_DURATION; // 1 = fresh, 0 = old
        const eased = progress * progress; // quadratic ease-out

        const radius = MIN_RADIUS + (MAX_RADIUS - MIN_RADIUS) * eased;
        const alpha = eased * 0.7;

        // Outer glow
        const grd = ctx.createRadialGradient(
          point.x, point.y, 0,
          point.x, point.y, radius * 3
        );
        grd.addColorStop(0, `rgba(241, 234, 222, ${alpha * 0.5})`);
        grd.addColorStop(0.4, `rgba(222, 212, 230, ${alpha * 0.25})`);
        grd.addColorStop(1, `rgba(222, 212, 230, 0)`);

        ctx.beginPath();
        ctx.arc(point.x, point.y, radius * 3, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(241, 234, 222, ${alpha})`;
        ctx.fill();
      }

      // Draw the live cursor dot on top
      if (isInsideRef.current) {
        const { x, y } = mouseRef.current;

        // Glow
        const grd = ctx.createRadialGradient(x, y, 0, x, y, 14);
        grd.addColorStop(0, "rgba(241, 234, 222, 0.18)");
        grd.addColorStop(1, "rgba(241, 234, 222, 0)");
        ctx.beginPath();
        ctx.arc(x, y, 14, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        // Solid core
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(241, 234, 222, 0.9)";
        ctx.fill();
      }
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      document.documentElement.removeEventListener("mouseleave", onMouseLeave);
      document.documentElement.removeEventListener("mouseenter", onMouseEnter);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[9999]"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
