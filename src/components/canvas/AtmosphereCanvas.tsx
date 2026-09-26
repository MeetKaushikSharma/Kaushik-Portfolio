import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface AtmosphereCanvasProps {
  intensity?: number;
  className?: string;
}

export function AtmosphereCanvas({
  intensity = 1.0,
  className = "",
}: AtmosphereCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isReducedMotion = useReducedMotion();

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof window === "undefined") return;

    // Detect WebGL capability safely
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: false, // Performance win
        powerPreference: "high-performance",
      });
    } catch {
      return; // WebGL unsupported fallback cleanly
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 24;

    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Create particle field (Awwwards style floating cyber-dust)
    const particleCount = window.innerWidth < 768 ? 200 : 500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const seeds = new Float32Array(particleCount);

    const isDarkMode = document.documentElement.classList.contains("dark");
    const baseBrightness = isDarkMode ? 0.9 : 0.15;

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 45;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 35;

      const c = baseBrightness + (Math.random() - 0.5) * 0.1;
      colors[i * 3] = c;
      colors[i * 3 + 1] = c;
      colors[i * 3 + 2] = c;

      sizes[i] = Math.random() * 2.5 + 1.2;
      seeds[i] = Math.random();
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("seed", new THREE.BufferAttribute(seeds, 1));

    // Particle Shader Material
    const particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: pixelRatio },
        uIntensity: { value: intensity },
        uScrollVel: { value: 0 },
        uPointer: { value: new THREE.Vector2(0, 0) },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uPixelRatio;
        uniform float uIntensity;
        uniform float uScrollVel;
        uniform vec2 uPointer;
        attribute float size;
        attribute float seed;
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vColor = color;
          vec3 pos = position;

          // Gentle floating wave motion
          pos.y += sin(uTime * 0.5 + seed * 6.28) * 0.8;
          pos.x += cos(uTime * 0.3 + seed * 6.28) * 0.5;
          pos.y -= uScrollVel * 0.05;

          // Subtle interaction with mouse pointer
          float dist = distance(pos.xy, uPointer * 25.0);
          if (dist < 8.0) {
            vec2 push = normalize(pos.xy - (uPointer * 25.0)) * (8.0 - dist) * 0.15;
            pos.xy += push;
          }

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          float pSize = size * uPixelRatio * (28.0 / -mvPosition.z) * uIntensity;
          gl_PointSize = clamp(pSize, 1.0, 18.0);

          vAlpha = 0.3 + 0.4 * sin(uTime + seed * 3.14);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vec2 uv = gl_PointCoord - 0.5;
          float dist = length(uv);
          if (dist > 0.5) discard;

          float strength = smoothstep(0.5, 0.0, dist);
          gl_FragColor = vec4(vColor, strength * vAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      vertexColors: true,
    });

    const particles = new THREE.Points(geometry, particleMaterial);
    scene.add(particles);

    // Add dynamic interactive grid floor plane for depth
    const gridHelper = new THREE.GridHelper(80, 40, 0x888888, 0x333333);
    gridHelper.position.y = -14;
    gridHelper.position.z = -5;
    gridHelper.rotation.x = 0.1;
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.08;
    scene.add(gridHelper);

    // Mouse & Scroll interaction
    const pointer = new THREE.Vector2(0, 0);
    const targetPointer = new THREE.Vector2(0, 0);
    let lastScrollY = window.scrollY;
    let scrollVel = 0;

    const onPointerMove = (e: MouseEvent) => {
      targetPointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      targetPointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const onScroll = () => {
      const currentScrollY = window.scrollY;
      scrollVel = (currentScrollY - lastScrollY) * 0.3;
      lastScrollY = currentScrollY;
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    // Handle Resizing
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      particleMaterial.uniforms.uPixelRatio.value = Math.min(
        window.devicePixelRatio || 1,
        1.5
      );
    };
    window.addEventListener("resize", onResize);

    // Animation Loop
    let animationFrameId: number;
    const startTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = (performance.now() - startTime) * 0.001;
      scrollVel *= 0.92; // smooth decay

      if (!isReducedMotion) {
        pointer.lerp(targetPointer, 0.05);
        particleMaterial.uniforms.uTime.value = elapsedTime;
        particleMaterial.uniforms.uScrollVel.value = scrollVel;
        particleMaterial.uniforms.uPointer.value = pointer;

        particles.rotation.y = elapsedTime * 0.02;
        gridHelper.position.z = -5 + (window.scrollY * 0.005) % 2;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      particleMaterial.dispose();
      renderer.dispose();
    };
  }, [intensity, isReducedMotion]);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 pointer-events-none z-[-1] overflow-hidden ${className}`}
      aria-hidden="true"
    />
  );
}
