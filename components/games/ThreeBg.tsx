import React, { useEffect, useRef } from "react";
import * as THREE from "three";

const ThreeBg: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create Scene
    const scene = new THREE.Scene();

    // Create Camera
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 35;

    // Create Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // Create Particles
    const particlesCount = 1800;
    const positions = new Float32Array(particlesCount * 3);
    const colors = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i += 3) {
      // Position coordinates spread in a 3D grid/field
      positions[i] = (Math.random() - 0.5) * 110; // x
      positions[i + 1] = (Math.random() - 0.5) * 60; // y (keep height spread tighter for wave effect)
      positions[i + 2] = (Math.random() - 0.5) * 100; // z

      // Particle colors: gradient mix of cyber blue and bright purple
      const mixRatio = Math.random();
      colors[i] = mixRatio * 0.4 + 0.1; // R (soft purple/blue)
      colors[i + 1] = (1 - mixRatio) * 0.6 + 0.2; // G (cyan hues)
      colors[i + 2] = 0.9; // B (deep neon blue)
    }

    // Keep copies of initial positions and colors for interpolation/wave logic
    const initialPositions = positions.slice();
    const initialColors = colors.slice();

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    // Custom Canvas Texture to generate glowing round particles programmatically
    const canvas = document.createElement("canvas");
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const gradient = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
      gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
      gradient.addColorStop(0.2, "rgba(0, 168, 255, 0.8)");
      gradient.addColorStop(0.5, "rgba(156, 39, 176, 0.3)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 16, 16);
    }
    const texture = new THREE.CanvasTexture(canvas);

    // Particle material
    const material = new THREE.PointsMaterial({
      size: 0.65,
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // Warp & Event Animations State
    let speedMultiplier = 1.0;
    let targetSpeedMultiplier = 1.0;
    let colorFlashType: "none" | "victory" | "defeat" = "none";
    let flashIntensity = 0.0;

    const handleMatrixEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.type === "victory") {
        targetSpeedMultiplier = 10.0; // Speed warp!
        colorFlashType = "victory";
        flashIntensity = 1.0; // Max intensity flash
      } else if (detail && detail.type === "defeat") {
        targetSpeedMultiplier = 5.0; // Erratic warp
        colorFlashType = "defeat";
        flashIntensity = 1.0;
      }
    };

    window.addEventListener("matrix-event", handleMatrixEvent);

    // Mouse Tracking for Parallax Shift
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const onMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX - window.innerWidth / 2) / 80;
      mouseY = (event.clientY - window.innerHeight / 2) / 80;
    };

    window.addEventListener("mousemove", onMouseMove);

    // Handle Window Resize
    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    // Animation loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Warp speed interpolation
      speedMultiplier += (targetSpeedMultiplier - speedMultiplier) * 0.06;
      targetSpeedMultiplier += (1.0 - targetSpeedMultiplier) * 0.012; // slowly slide back to 1.0

      // Color flash fadeout
      if (flashIntensity > 0) {
        flashIntensity += (0.0 - flashIntensity) * 0.015; // slow fade
      }

      // 1. Particle positions: Update with Sine Wave Mesh flow
      const positionAttr = geometry.getAttribute("position") as THREE.BufferAttribute;
      const posArray = positionAttr.array as Float32Array;

      // 2. Color flashes: Interpolate colors
      const colorAttr = geometry.getAttribute("color") as THREE.BufferAttribute;
      const colArray = colorAttr.array as Float32Array;

      for (let i = 0; i < particlesCount; i++) {
        const i3 = i * 3;
        const initX = initialPositions[i3];
        const initY = initialPositions[i3 + 1];
        const initZ = initialPositions[i3 + 2];

        // Rhythmic wave oscillation: compute unique offset for each particle based on coordinate grids
        const waveOffset = Math.sin(elapsedTime * 1.2 + initX * 0.1) * 3.5 + Math.cos(elapsedTime * 0.8 + initZ * 0.08) * 2.5;
        
        // Speed up wave frequency when warping
        const warpWaveOffset = waveOffset * (0.8 + speedMultiplier * 0.2);

        // Apply wave y coordinate shifts
        posArray[i3 + 1] = initY + warpWaveOffset;

        // Apply visual warp stretching on z coordinates
        posArray[i3 + 2] = initZ + (speedMultiplier - 1.0) * (initZ * 0.05);

        // Apply Color blending
        const origR = initialColors[i3];
        const origG = initialColors[i3 + 1];
        const origB = initialColors[i3 + 2];

        if (flashIntensity > 0.02) {
          if (colorFlashType === "victory") {
            // Success glow - blend into pure success green (0.0, 0.9, 0.4)
            colArray[i3] = origR * (1.0 - flashIntensity) + 0.0 * flashIntensity;
            colArray[i3 + 1] = origG * (1.0 - flashIntensity) + 0.9 * flashIntensity;
            colArray[i3 + 2] = origB * (1.0 - flashIntensity) + 0.4 * flashIntensity;
          } else if (colorFlashType === "defeat") {
            // Failure glow - blend into warning red (1.0, 0.1, 0.3)
            colArray[i3] = origR * (1.0 - flashIntensity) + 1.0 * flashIntensity;
            colArray[i3 + 1] = origG * (1.0 - flashIntensity) + 0.1 * flashIntensity;
            colArray[i3 + 2] = origB * (1.0 - flashIntensity) + 0.3 * flashIntensity;
          }
        } else {
          colArray[i3] = origR;
          colArray[i3 + 1] = origG;
          colArray[i3 + 2] = origB;
        }
      }

      positionAttr.needsUpdate = true;
      colorAttr.needsUpdate = true;

      // Rotation movement, scaled by active warp multiplier
      points.rotation.y = elapsedTime * 0.03 * (0.6 + speedMultiplier * 0.4);
      points.rotation.x = elapsedTime * 0.01 * (0.6 + speedMultiplier * 0.4);

      // Smooth mouse parallax interpolation
      targetX = mouseX * 0.7;
      targetY = mouseY * 0.7;
      points.position.x += (targetX - points.position.x) * 0.05;
      points.position.y += (-targetY - points.position.y) * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    // Clean up resources on unmount
    return () => {
      window.removeEventListener("matrix-event", handleMatrixEvent);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);

      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }

      geometry.dispose();
      material.dispose();
      texture.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: -2,
        pointerEvents: "none",
        background: "linear-gradient(to bottom, #030308, #0a0a14, #030308)",
        overflow: "hidden",
      }}
    />
  );
};

export default ThreeBg;
