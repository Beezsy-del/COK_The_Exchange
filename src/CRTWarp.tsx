import { useEffect, useRef } from "react";
export interface CRTWarpProps {
  color?: string;
  backgroundColor?: string;
  mask?: "aperture" | "scanline" | "none";
  curvature?: number;
  persistence?: number;
}
/** Local canvas shader-style CRT field. No textures, packages, or network requests. */
export default function CRTWarp({
  color = "#f43f5e",
  backgroundColor = "#120f17",
  mask = "aperture",
  curvature = 0.25,
  persistence = 0.4,
}: CRTWarpProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;
    canvas.style.color = color;
    canvas.style.backgroundColor = backgroundColor;
    const ink = getComputedStyle(canvas).color;
    const background = getComputedStyle(canvas).backgroundColor;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0,
      last = 0,
      width = 1,
      height = 1,
      disposed = false;
    const bend = Math.max(0, Math.min(1, curvature)),
      trail = Math.max(0, Math.min(0.9, persistence));
    const draw = (time: number) => {
      const t = motion.matches ? 0 : time * 0.00012;
      ctx.globalAlpha = 1 - trail * 0.6;
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, width, height);
      ctx.globalAlpha = 1;
      const glow = ctx.createRadialGradient(
        width * 0.5,
        height * 1.05,
        0,
        width * 0.5,
        height * 0.9,
        width * 0.8,
      );
      glow.addColorStop(0, ink);
      glow.addColorStop(0.5, "transparent");
      glow.addColorStop(1, background);
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1;
      for (let row = 0; row < 15; row++) {
        ctx.globalAlpha = 0.035 + row * 0.003;
        ctx.beginPath();
        for (let x = 0; x <= width; x += 20) {
          const nx = (x / width - 0.5) * 2;
          const y =
            height * (row / 15) +
            Math.sin(nx * 3 + t + row * 0.3) * 25 +
            nx * nx * bend * height * 0.15;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      for (let i = 0; i < 46; i++) {
        const phase = (i * 0.61803398875) % 1;
        const y = height - ((t * 75 + i * 43) % (height + 40));
        const x = phase * width + Math.sin(t * 3 + i) * 24;
        ctx.globalAlpha = 0.18 + (0.5 + 0.5 * Math.sin(t * 5 + i)) * 0.38;
        ctx.fillStyle = i % 4 === 0 ? "#ffce88" : ink;
        ctx.beginPath();
        ctx.ellipse(
          x,
          y,
          1 + (i % 2),
          2 + (i % 3),
          Math.sin(i),
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      ctx.globalAlpha = mask === "none" ? 0 : 0.13;
      ctx.fillStyle = "#000";
      if (mask === "aperture")
        for (let x = 0; x < width; x += 4) ctx.fillRect(x, 0, 1, height);
      else for (let y = 0; y < height; y += 4) ctx.fillRect(0, y, width, 1);
      ctx.globalAlpha = 1;
    };
    const loop = (time: number) => {
      if (disposed || document.hidden || motion.matches) return;
      if (time - last > 33) {
        draw(time);
        last = time;
      }
      frame = requestAnimationFrame(loop);
    };
    const sync = () => {
      cancelAnimationFrame(frame);
      draw(performance.now());
      if (!document.hidden && !motion.matches)
        frame = requestAnimationFrame(loop);
    };
    const resize = () => {
      const box = canvas.getBoundingClientRect();
      width = Math.max(1, box.width);
      height = Math.max(1, box.height);
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sync();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    motion.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    resize();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      motion.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [color, backgroundColor, mask, curvature, persistence]);
  return (
    <canvas
      ref={ref}
      className="crt-warp"
      aria-hidden="true"
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        borderRadius: `${Math.max(0, Math.min(1, curvature)) * 12}%`,
      }}
    />
  );
}
