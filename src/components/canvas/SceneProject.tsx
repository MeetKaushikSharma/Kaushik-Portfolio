import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { Project } from "@/lib/portfolio-data";

interface SceneProjectProps {
  type: Project["interaction"];
  projectName: string;
  metric?: string;
  className?: string;
}

export function SceneProject({
  type,
  projectName,
  metric,
  className = "",
}: SceneProjectProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isReducedMotion = useReducedMotion();

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof window === "undefined") return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 240;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch {
      return; // Graceful fallback
    }

    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 8);

    // Group for mouse parallax rotation
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Subtle lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1.2, 50);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    // ─────────────────────────────────────────────────────────────
    // SCENE GENERATORS FOR THE 6 INTERACTION TYPES
    // ─────────────────────────────────────────────────────────────

    // Clean-up hooks array
    const disposables: (() => void)[] = [];
    let updateScene: (time: number, pointer: THREE.Vector2) => void = () => {};

    if (type === "judge") {
      // 1. CODEARENA: Execution pipeline graph with pulse packets
      const nodeGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
      const nodeMat = new THREE.MeshBasicMaterial({ color: 0xeeeeee, wireframe: true });
      const activeMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

      const nodeCount = 5;
      const nodes: THREE.Mesh[] = [];
      for (let i = 0; i < nodeCount; i++) {
        const mesh = new THREE.Mesh(nodeGeo, i === 2 ? activeMat : nodeMat);
        mesh.position.set((i - 2) * 1.5, Math.sin(i * 1.2) * 0.4, 0);
        rootGroup.add(mesh);
        nodes.push(mesh);
      }

      // Connecting pipeline lines
      const linePoints = nodes.map((n) => n.position);
      const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
      const lineMat = new THREE.LineBasicMaterial({ color: 0x555555 });
      const line = new THREE.Line(lineGeo, lineMat);
      rootGroup.add(line);

      // Packet pulse traveling along pipeline
      const pulseGeo = new THREE.SphereGeometry(0.12, 16, 16);
      const pulseMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
      const pulse = new THREE.Mesh(pulseGeo, pulseMat);
      rootGroup.add(pulse);

      disposables.push(() => {
        nodeGeo.dispose();
        nodeMat.dispose();
        activeMat.dispose();
        lineGeo.dispose();
        lineMat.dispose();
        pulseGeo.dispose();
        pulseMat.dispose();
      });

      updateScene = (t) => {
        nodes.forEach((n, idx) => {
          n.rotation.x = t * (0.8 + idx * 0.2);
          n.rotation.y = t * (0.6 + idx * 0.2);
        });
        const progress = (t * 0.8) % 4;
        const segment = Math.floor(progress);
        const frac = progress - segment;
        if (segment < nodes.length - 1) {
          pulse.position.lerpVectors(nodes[segment].position, nodes[segment + 1].position, frac);
        }
      };
    } else if (type === "diagnostic") {
      // 2. DHARA-VAIDYA: Scanning field with radar grid & target reticle
      const gridHelper = new THREE.GridHelper(6, 16, 0x00f0ff, 0x333333);
      gridHelper.rotation.x = Math.PI * 0.25;
      rootGroup.add(gridHelper);

      // Radar scan line
      const scanGeo = new THREE.CylinderGeometry(0.02, 0.02, 5, 8);
      const scanMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.85 });
      const scanBar = new THREE.Mesh(scanGeo, scanMat);
      scanBar.rotation.z = Math.PI * 0.5;
      rootGroup.add(scanBar);

      // Wireframe target sphere
      const targetGeo = new THREE.IcosahedronGeometry(0.9, 1);
      const targetMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
      const targetMesh = new THREE.Mesh(targetGeo, targetMat);
      targetMesh.position.set(0, 0.5, 0);
      rootGroup.add(targetMesh);

      disposables.push(() => {
        scanGeo.dispose();
        scanMat.dispose();
        targetGeo.dispose();
        targetMat.dispose();
      });

      updateScene = (t) => {
        scanBar.position.y = Math.sin(t * 2.0) * 1.8;
        targetMesh.rotation.y = t * 0.5;
        targetMesh.rotation.x = t * 0.3;
        gridHelper.rotation.y = t * 0.1;
      };
    } else if (type === "search") {
      // 3. SEARCH ENGINE: RAG Pipeline Knowledge Graph
      const count = 18;
      const sphereGeo = new THREE.SphereGeometry(0.12, 12, 12);
      const sphereMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const coreMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

      const spheres: THREE.Mesh[] = [];
      const positions: THREE.Vector3[] = [];

      for (let i = 0; i < count; i++) {
        const isCore = i === 0;
        const mesh = new THREE.Mesh(sphereGeo, isCore ? coreMat : sphereMat);
        const radius = isCore ? 0 : 1.2 + Math.random() * 1.5;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        const pos = new THREE.Vector3(
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.sin(phi) * Math.sin(theta),
          radius * Math.cos(phi)
        );
        mesh.position.copy(pos);
        rootGroup.add(mesh);
        spheres.push(mesh);
        positions.push(pos);
      }

      // Connecting web edges
      const edgePositions: number[] = [];
      for (let i = 1; i < count; i++) {
        edgePositions.push(0, 0, 0);
        edgePositions.push(positions[i].x, positions[i].y, positions[i].z);
        if (i % 2 === 0 && i < count - 1) {
          edgePositions.push(positions[i].x, positions[i].y, positions[i].z);
          edgePositions.push(positions[i + 1].x, positions[i + 1].y, positions[i + 1].z);
        }
      }

      const edgeGeo = new THREE.BufferGeometry();
      edgeGeo.setAttribute("position", new THREE.Float32BufferAttribute(edgePositions, 3));
      const edgeMat = new THREE.LineBasicMaterial({ color: 0x444444, transparent: true, opacity: 0.6 });
      const edgeLines = new THREE.LineSegments(edgeGeo, edgeMat);
      rootGroup.add(edgeLines);

      disposables.push(() => {
        sphereGeo.dispose();
        sphereMat.dispose();
        coreMat.dispose();
        edgeGeo.dispose();
        edgeMat.dispose();
      });

      updateScene = (t) => {
        rootGroup.rotation.y = t * 0.25;
        rootGroup.rotation.x = Math.sin(t * 0.2) * 0.2;
      };
    } else if (type === "robot") {
      // 4. PROJECT ROC: 3D Articulated Robotic Arm Links
      const baseGeo = new THREE.CylinderGeometry(0.8, 1.0, 0.3, 16);
      const baseMat = new THREE.MeshBasicMaterial({ color: 0x666666, wireframe: true });
      const baseMesh = new THREE.Mesh(baseGeo, baseMat);
      baseMesh.position.y = -1.6;
      rootGroup.add(baseMesh);

      // Joint 1
      const arm1Geo = new THREE.BoxGeometry(0.3, 1.4, 0.3);
      const armMat = new THREE.MeshBasicMaterial({ color: 0xeeeeee, wireframe: true });
      const joint1 = new THREE.Group();
      joint1.position.y = -1.3;
      rootGroup.add(joint1);

      const arm1 = new THREE.Mesh(arm1Geo, armMat);
      arm1.position.y = 0.7;
      joint1.add(arm1);

      // Joint 2
      const joint2 = new THREE.Group();
      joint2.position.y = 1.4;
      joint1.add(joint2);

      const arm2Geo = new THREE.BoxGeometry(0.25, 1.2, 0.25);
      const arm2 = new THREE.Mesh(arm2Geo, armMat);
      arm2.position.y = 0.6;
      joint2.add(arm2);

      // End-effector gripper
      const clawGeo = new THREE.ConeGeometry(0.25, 0.5, 4);
      const clawMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true });
      const claw = new THREE.Mesh(clawGeo, clawMat);
      claw.position.y = 1.35;
      claw.rotation.x = Math.PI;
      joint2.add(claw);

      disposables.push(() => {
        baseGeo.dispose();
        baseMat.dispose();
        arm1Geo.dispose();
        armMat.dispose();
        arm2Geo.dispose();
        clawGeo.dispose();
        clawMat.dispose();
      });

      updateScene = (t, pointer) => {
        baseMesh.rotation.y = t * 0.4;
        joint1.rotation.z = Math.sin(t * 1.5) * 0.35 + pointer.x * 0.3;
        joint2.rotation.z = Math.cos(t * 1.8) * 0.5 - pointer.y * 0.3;
        claw.rotation.y = t * 2.0;
      };
    } else if (type === "audio") {
      // 5. SPEECH TO SPEECH: 3D Equalizer Spectrum Wave
      const barCount = 20;
      const barGeo = new THREE.BoxGeometry(0.12, 1, 0.12);
      const barMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const highlightMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

      const bars: THREE.Mesh[] = [];
      const barSpacing = 0.24;
      const startX = -((barCount - 1) * barSpacing) * 0.5;

      for (let i = 0; i < barCount; i++) {
        const isPeak = i === 9 || i === 10;
        const mesh = new THREE.Mesh(barGeo, isPeak ? highlightMat : barMat);
        mesh.position.x = startX + i * barSpacing;
        mesh.position.y = 0;
        rootGroup.add(mesh);
        bars.push(mesh);
      }

      disposables.push(() => {
        barGeo.dispose();
        barMat.dispose();
        highlightMat.dispose();
      });

      updateScene = (t) => {
        bars.forEach((bar, idx) => {
          const wave = Math.sin(t * 4.0 + idx * 0.35) * 0.5 + 0.5;
          const noiseVal = Math.sin(t * 7.0 + idx * 1.2) * 0.2;
          const scaleY = Math.max(0.2, (wave + noiseVal) * 2.8);
          bar.scale.y = scaleY;
          bar.position.y = scaleY * 0.5 - 0.8;
        });
      };
    } else {
      // 6. AGRI-ROVER / FIELD: 3D Coordinate Terrain + Rover Node & Waypoints
      const terrainGeo = new THREE.PlaneGeometry(5, 5, 8, 8);
      const terrainMat = new THREE.MeshBasicMaterial({ color: 0x333333, wireframe: true });
      const terrain = new THREE.Mesh(terrainGeo, terrainMat);
      terrain.rotation.x = -Math.PI * 0.35;
      terrain.position.y = -0.5;
      rootGroup.add(terrain);

      // Rover unit
      const roverGeo = new THREE.BoxGeometry(0.45, 0.2, 0.3);
      const roverMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
      const rover = new THREE.Mesh(roverGeo, roverMat);
      rootGroup.add(rover);

      // Waypoint beacons
      const beaconGeo = new THREE.ConeGeometry(0.12, 0.4, 6);
      const beaconMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
      const waypoints = [
        new THREE.Vector3(-1.4, -0.2, 0.5),
        new THREE.Vector3(0.2, 0.2, -0.6),
        new THREE.Vector3(1.5, -0.4, 0.8),
      ];
      waypoints.forEach((wp) => {
        const beacon = new THREE.Mesh(beaconGeo, beaconMat);
        beacon.position.copy(wp);
        rootGroup.add(beacon);
      });

      disposables.push(() => {
        terrainGeo.dispose();
        terrainMat.dispose();
        roverGeo.dispose();
        roverMat.dispose();
        beaconGeo.dispose();
        beaconMat.dispose();
      });

      updateScene = (t) => {
        const tLoop = (t * 0.4) % waypoints.length;
        const idx = Math.floor(tLoop);
        const nextIdx = (idx + 1) % waypoints.length;
        const frac = tLoop - idx;
        rover.position.lerpVectors(waypoints[idx], waypoints[nextIdx], frac);
        rover.position.y += 0.25;
        terrain.rotation.z = Math.sin(t * 0.2) * 0.1;
      };
    }

    // Interactive pointer handling
    const pointer = new THREE.Vector2(0, 0);
    const targetPointer = new THREE.Vector2(0, 0);

    const onPointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetPointer.set(x, y);
    };

    const onPointerLeave = () => {
      targetPointer.set(0, 0);
    };

    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerleave", onPointerLeave);

    // Resize handling
    const resizeObserver = new ResizeObserver(() => {
      const newW = container.clientWidth || 400;
      const newH = container.clientHeight || 240;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    });
    resizeObserver.observe(container);

    // Render loop
    let rafId: number;
    const startTime = performance.now();

    const animate = () => {
      rafId = requestAnimationFrame(animate);

      const elapsedTime = (performance.now() - startTime) * 0.001;

      if (!isReducedMotion) {
        pointer.lerp(targetPointer, 0.08);
        rootGroup.rotation.y = pointer.x * 0.45;
        rootGroup.rotation.x = -pointer.y * 0.35;
        updateScene(elapsedTime, pointer);
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(rafId);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerleave", onPointerLeave);
      resizeObserver.disconnect();
      disposables.forEach((fn) => fn());
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [type, isReducedMotion]);

  return (
    <div
      ref={containerRef}
      className={`relative h-44 sm:h-52 w-full overflow-hidden border border-border/70 bg-foreground/[0.02] backdrop-blur-sm transition-all duration-300 hover:border-foreground/30 ${className}`}
      data-cursor-text="INSPECT"
    >
      <div className="pointer-events-none absolute left-3 top-2 z-10 flex items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
        <span>SYS_3D // {type.toUpperCase()}</span>
      </div>
      {metric && (
        <div className="pointer-events-none absolute right-3 bottom-2 z-10 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
          {metric}
        </div>
      )}
    </div>
  );
}
