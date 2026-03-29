import { useEffect, useRef } from "react";

const N = 16; // number of trail beads
const LERP_BASE = 0.12;
const LERP_STEP = 0.012;

export function CustomCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    // Track actual cursor
    const mouse = { x: -300, y: -300 };
    const prev = { x: -300, y: -300 };
    let velocity = 0;
    let inside = true;

    // Trail beads — each one follows the previous with lerp
    const beads = Array.from({ length: N }, () => ({ x: -300, y: -300 }));

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    /** 1 when pointer is over StringTune magnetic targets (data-string="magnetic" / .st-magnetic) */
    let magneticTarget = 0;
    /** Smoothed follow of magneticTarget so the trail eases instead of popping */
    let magneticBlend = 0;

    const onMove = (e: MouseEvent) => {
      prev.x = mouse.x;
      prev.y = mouse.y;
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      const dx = mouse.x - prev.x;
      const dy = mouse.y - prev.y;
      velocity = Math.min(Math.sqrt(dx * dx + dy * dy), 60);

      const hit = document.elementFromPoint(e.clientX, e.clientY);
      magneticTarget = hit?.closest?.("[data-string=\"magnetic\"], .st-magnetic") ? 1 : 0;
    };
    const onLeave = () => { inside = false; };
    const onEnter = () => { inside = true; };

    window.addEventListener("mousemove", onMove);
    document.documentElement.addEventListener("mouseleave", onLeave);
    document.documentElement.addEventListener("mouseenter", onEnter);

    let raf: number;

    const draw = () => {
      raf = requestAnimationFrame(draw);

      // Decay velocity
      velocity *= 0.85;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!inside) return;

      magneticBlend += (magneticTarget - magneticBlend) * 0.14;
      const trailDim = 1 - magneticBlend * 0.52;

      // Update bead chain: bead[0] chases mouse, bead[i] chases bead[i-1]
      const target0 = { x: mouse.x, y: mouse.y };
      const lerpFactor0 = LERP_BASE + LERP_STEP * 0;
      beads[0].x = lerp(beads[0].x, target0.x, lerpFactor0);
      beads[0].y = lerp(beads[0].y, target0.y, lerpFactor0);

      for (let i = 1; i < N; i++) {
        const lf = LERP_BASE + LERP_STEP * i;
        beads[i].x = lerp(beads[i].x, beads[i - 1].x, lf * 0.6);
        beads[i].y = lerp(beads[i].y, beads[i - 1].y, lf * 0.6);
      }

      // Velocity-based sizing: fast = bigger trail
      const velScale = Math.min(1 + velocity / 40, 2.2);

      // Draw trail — from tail to head so head renders on top
      for (let i = N - 1; i >= 0; i--) {
        const t = 1 - i / N; // 0 = tail, 1 = head
        const alpha = t * t * 0.65 * trailDim * (inside ? 1 : 0);
        const radius = (0.8 + t * 3.8 * velScale) * (0.5 + t * 0.5);

        if (radius < 0.3) continue;

        // Glow ring around each bead
        const glowR = radius * 3.5;
        const grd = ctx.createRadialGradient(
          beads[i].x, beads[i].y, 0,
          beads[i].x, beads[i].y, glowR
        );
        grd.addColorStop(0, `rgba(241,234,222,${alpha * 0.28})`);
        grd.addColorStop(0.5, `rgba(222,212,230,${alpha * 0.08})`);
        grd.addColorStop(1, `rgba(222,212,230,0)`);
        ctx.beginPath();
        ctx.arc(beads[i].x, beads[i].y, glowR, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        // Core bead
        ctx.beginPath();
        ctx.arc(beads[i].x, beads[i].y, Math.max(0.3, radius), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(241,234,222,${alpha})`;
        ctx.fill();
      }

      // Draw the live cursor dot right on top of the mouse
      const cursorAlpha = 0.92 * (0.72 + 0.28 * (1 - magneticBlend));
      // Glow
      const cGrd = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 16);
      cGrd.addColorStop(0, `rgba(241,234,222,${0.2 * (0.75 + 0.25 * (1 - magneticBlend))})`);
      cGrd.addColorStop(1, `rgba(241,234,222,0)`);
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, 16, 0, Math.PI * 2);
      ctx.fillStyle = cGrd;
      ctx.fill();
      // Dot
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(241,234,222,${cursorAlpha})`;
      ctx.fill();
    };

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.documentElement.removeEventListener("mouseenter", onEnter);
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
