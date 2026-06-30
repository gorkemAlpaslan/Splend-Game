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

    // Particle pool for certain animations
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

    // Grid nodes for Quantum Link / puzzles
    const gridNodes = [
      { x: 30, y: 30, active: true },
      { x: 90, y: 30, active: false },
      { x: 150, y: 30, active: false },
      { x: 30, y: 90, active: true },
      { x: 90, y: 90, active: true },
      { x: 150, y: 90, active: false },
    ];

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

      // Check game type and render appropriate simulation
      if (gameId.includes("chess")) {
        // Draw Chessboard & moves
        const boardSize = 8;
        const cellSize = Math.min(w, h) / 10;
        const startX = (w - boardSize * cellSize) / 2;
        const startY = (h - boardSize * cellSize) / 2;

        ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
        ctx.lineWidth = 1;

        for (let r = 0; r < boardSize; r++) {
          for (let c = 0; c < boardSize; c++) {
            ctx.fillStyle = (r + c) % 2 === 0 ? "rgba(0, 210, 255, 0.04)" : "rgba(10, 10, 25, 0.4)";
            ctx.fillRect(startX + c * cellSize, startY + r * cellSize, cellSize, cellSize);
            ctx.strokeRect(startX + c * cellSize, startY + r * cellSize, cellSize, cellSize);
          }
        }

        // Draw 2 chess pieces sliding
        const bounceY = Math.abs(Math.sin(time * 0.04)) * 12;
        const p1X = startX + 3.5 * cellSize + Math.cos(time * 0.03) * cellSize * 1.5;
        const p1Y = startY + 3.5 * cellSize + Math.sin(time * 0.03) * cellSize * 1.5 - bounceY;

        ctx.shadowBlur = 10;
        ctx.shadowColor = "#00d2ff";
        ctx.fillStyle = "#00d2ff";
        ctx.beginPath();
        ctx.arc(p1X, p1Y, cellSize * 0.35, 0, Math.PI * 2);
        ctx.fill();

        // Draw active move indicator
        ctx.strokeStyle = "rgba(0, 230, 118, 0.5)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(startX + 2 * cellSize, startY + 2 * cellSize);
        ctx.lineTo(p1X, p1Y);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (gameId.includes("battleship")) {
        // Battleship Radar Scan and grid
        const centerX = w / 2;
        const centerY = h / 2;
        const radius = Math.min(w, h) * 0.45;

        // Radar circles
        ctx.strokeStyle = "rgba(0, 230, 118, 0.15)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.arc(centerX, centerY, radius * 0.66, 0, Math.PI * 2);
        ctx.arc(centerX, centerY, radius * 0.33, 0, Math.PI * 2);
        ctx.stroke();

        // Radar line
        const angle = (time * 0.02) % (Math.PI * 2);
        ctx.strokeStyle = "rgba(0, 230, 118, 0.6)";
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#00e676";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
        ctx.stroke();

        // Radar sweep gradient trail
        const sweepGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        sweepGrad.addColorStop(0, "rgba(0, 230, 118, 0.05)");
        sweepGrad.addColorStop(1, "rgba(0, 230, 118, 0)");
        ctx.fillStyle = sweepGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, angle - 0.4, angle);
        ctx.lineTo(centerX, centerY);
        ctx.closePath();
        ctx.fill();

        // Draw blips
        const blips = [
          { x: centerX - radius * 0.4, y: centerY - radius * 0.3, phase: 0 },
          { x: centerX + radius * 0.5, y: centerY + radius * 0.2, phase: Math.PI },
        ];

        blips.forEach((blip) => {
          const intensity = Math.abs(Math.sin(time * 0.05 + blip.phase));
          ctx.fillStyle = `rgba(255, 42, 109, ${intensity})`;
          ctx.shadowColor = "#ff2a6d";
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(blip.x, blip.y, 4, 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (gameId === "grid_solver") {
        // Quantum Link Solver
        ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
        ctx.lineWidth = 1;
        // Draw grid connections
        gridNodes.forEach((node, idx) => {
          gridNodes.forEach((other, oidx) => {
            if (oidx > idx && Math.abs(node.x - other.x) + Math.abs(node.y - other.y) < 70) {
              ctx.strokeStyle = node.active && other.active ? "rgba(0, 230, 118, 0.4)" : "rgba(255, 255, 255, 0.05)";
              ctx.lineWidth = node.active && other.active ? 2 : 1;
              ctx.beginPath();
              ctx.moveTo(node.x + (w - 180) / 2, node.y + (h - 120) / 2);
              ctx.lineTo(other.x + (w - 180) / 2, other.y + (h - 120) / 2);
              ctx.stroke();
            }
          });
        });

        // Pulsing active nodes
        gridNodes.forEach((node) => {
          const pulse = Math.sin(time * 0.08 + node.x) * 2;
          ctx.shadowBlur = node.active ? 10 : 0;
          ctx.shadowColor = node.active ? "#00e676" : "transparent";
          ctx.fillStyle = node.active ? "#00e676" : "rgba(255, 255, 255, 0.1)";
          ctx.beginPath();
          ctx.arc(node.x + (w - 180) / 2, node.y + (h - 120) / 2, node.active ? 6 + pulse : 4, 0, Math.PI * 2);
          ctx.fill();
        });

        // Simulating node rotations
        if (Math.floor(time * 0.02) % 2 === 0) {
          gridNodes[1].active = true;
          gridNodes[2].active = true;
          gridNodes[5].active = true;
        } else {
          gridNodes[1].active = false;
          gridNodes[2].active = false;
          gridNodes[5].active = false;
        }
      } else if (gameId === "memory_matrix") {
        // Memory Matrix blocks flashing
        const cols = 4;
        const rows = 3;
        const blockSize = 24;
        const gap = 4;
        const startX = (w - (cols * blockSize + (cols - 1) * gap)) / 2;
        const startY = (h - (rows * blockSize + (rows - 1) * gap)) / 2;

        const cycle = Math.floor(time / 40) % 3;

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const isHighlight =
              (cycle === 0 && (r + c) % 3 === 0) ||
              (cycle === 1 && (r * c) % 2 === 1) ||
              (cycle === 2 && r === c);

            ctx.fillStyle = isHighlight ? "#00d2ff" : "rgba(255, 255, 255, 0.05)";
            ctx.strokeStyle = isHighlight ? "#00d2ff" : "rgba(255, 255, 255, 0.1)";
            ctx.lineWidth = 1;
            ctx.shadowBlur = isHighlight ? 8 : 0;
            ctx.shadowColor = "#00d2ff";

            ctx.fillRect(startX + c * (blockSize + gap), startY + r * (blockSize + gap), blockSize, blockSize);
            ctx.strokeRect(startX + c * (blockSize + gap), startY + r * (blockSize + gap), blockSize, blockSize);
          }
        }
      } else if (gameId === "wave_tuner") {
        // Wave Tuner matching sine waves
        ctx.lineWidth = 2;
        ctx.shadowBlur = 8;

        // Target Wave (Cyan)
        ctx.strokeStyle = "rgba(0, 210, 255, 0.3)";
        ctx.beginPath();
        for (let x = 0; x < w; x++) {
          const y = h / 2 + Math.sin(x * 0.05 + time * 0.02) * 20;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Player Wave (Green)
        const matchProgress = Math.min(1, Math.abs(Math.sin(time * 0.01)));
        ctx.strokeStyle = "#00e676";
        ctx.shadowColor = "#00e676";
        ctx.beginPath();
        for (let x = 0; x < w; x++) {
          const freq = 0.05 + (1 - matchProgress) * 0.08 * Math.sin(time * 0.005);
          const amp = 20 * matchProgress + (1 - matchProgress) * 8 * Math.sin(time * 0.01);
          const y = h / 2 + Math.sin(x * freq + time * 0.05) * amp;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      } else if (gameId === "matrix_runner") {
        // Snake/Light Stream Runner grid
        const cell = 10;
        const gridW = Math.floor(w / cell);
        const gridH = Math.floor(h / cell);

        // draw background faint grid
        ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= gridW; i++) {
          ctx.beginPath(); ctx.moveTo(i * cell, 0); ctx.lineTo(i * cell, h); ctx.stroke();
        }
        for (let j = 0; j <= gridH; j++) {
          ctx.beginPath(); ctx.moveTo(0, j * cell); ctx.lineTo(w, j * cell); ctx.stroke();
        }

        // draw snake light trail
        ctx.strokeStyle = "#00d2ff";
        ctx.lineWidth = 3;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#00d2ff";
        ctx.lineJoin = "round";
        ctx.lineCap = "round";

        ctx.beginPath();
        let currX = w / 2;
        let currY = h / 2;
        ctx.moveTo(currX - 30, currY - 20);
        ctx.lineTo(currX, currY - 20);
        ctx.lineTo(currX, currY + 10);
        ctx.lineTo(currX + Math.sin(time * 0.05) * 20, currY + 10);
        ctx.stroke();

        // draw food particle
        ctx.fillStyle = "#ff2a6d";
        ctx.shadowColor = "#ff2a6d";
        ctx.beginPath();
        ctx.arc(currX + 30, currY + 10, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (gameId === "cipher_decryptor") {
        // Floating cyber code symbols
        ctx.fillStyle = "rgba(0, 210, 255, 0.85)";
        ctx.font = "bold 14px 'Orbitron', monospace";
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#00d2ff";

        const codes = ["A3_FF", "C9_1B", "D4_A6", "E0_99", "F2_8C", "77_F0"];
        for (let i = 0; i < 4; i++) {
          const valY = 25 + i * 25;
          const shuffleIdx = Math.floor((time / 10 + i) % codes.length);
          const activeText = codes[shuffleIdx];
          ctx.fillText(`0x${activeText}`, w / 2 - 35, valY);
        }

        // Draw selection frame
        ctx.strokeStyle = "rgba(0, 230, 118, 0.6)";
        ctx.lineWidth = 1;
        ctx.strokeRect(w / 2 - 45, h / 2 - 20, 90, 30);
      } else {
        // Generic: Cyber floating code stream / particles
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
      }

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
