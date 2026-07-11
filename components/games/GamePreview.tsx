import React, { useEffect, useRef } from "react";

interface GamePreviewProps {
  gameId: string;
  isHovered: boolean;
}

export const GamePreview: React.FC<GamePreviewProps> = ({ gameId, isHovered }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    // Set canvas resolution matching displayed container
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Particle pool for animations
    const particles: Array<{ x: number; y: number; vx: number; vy: number; color: string; size: number }> = [];
    for (let i = 0; i < 20; i++) {
      particles.push({
        x: Math.random() * 200,
        y: Math.random() * 120,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        color: i % 2 === 0 ? "#00d2ff" : "#00e676",
        size: Math.random() * 2 + 1,
      });
    }

    const draw = () => {
      if (!ctx || !canvas) return;

      const w = canvas.width / window.devicePixelRatio;
      const h = canvas.height / window.devicePixelRatio;

      // Clear with slight alpha to get a motion blur/trail effect
      ctx.fillStyle = "rgba(6, 6, 16, 0.25)";
      ctx.fillRect(0, 0, w, h);

      // Increment clock if hovered
      if (isHovered) {
        time += 1.5;
      } else {
        time += 0.2; // Slow passive movement
      }

      ctx.save();

      // Cyber floating code stream / particles
      ctx.strokeStyle = "rgba(0, 210, 255, 0.15)";
      ctx.lineWidth = 1;

      // Draw connections
      particles.forEach((p, index) => {
        // Update particles positions
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        // Draw links to close neighbors
        for (let j = index + 1; j < particles.length; j++) {
          const dx = p.x - particles[j].x;
          const dy = p.y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 40) {
            ctx.strokeStyle = `rgba(0, 210, 255, ${0.15 - dist / 300})`;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }

        // Draw node
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [gameId, isHovered]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        background: "#060610",
      }}
    />
  );
};
export default GamePreview;
