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
      // Position coordinates spread in a 3D sphere/box
      positions[i] = (Math.random() - 0.5) * 110; // x
      positions[i + 1] = (Math.random() - 0.5) * 110; // y
      positions[i + 2] = (Math.random() - 0.5) * 100; // z

      // Particle colors: gradient mix of cyber blue and bright purple
      const mixRatio = Math.random();
      colors[i] = mixRatio * 0.4 + 0.1; // R (soft purple/blue)
      colors[i + 1] = (1 - mixRatio) * 0.6 + 0.2; // G (cyan hues)
      colors[i + 2] = 0.9; // B (deep neon blue)
    }

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
      size: 0.55,
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

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

      // Rotation movement
      points.rotation.y = elapsedTime * 0.03;
      points.rotation.x = elapsedTime * 0.01;

      // Smooth mouse parallax interpolation (easing)
      targetX = mouseX * 0.7;
      targetY = mouseY * 0.7;
      points.position.x += (targetX - points.position.x) * 0.05;
      points.position.y += (-targetY - points.position.y) * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    // Clean up resources on unmount
    return () => {
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
