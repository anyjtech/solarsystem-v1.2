import React, { useRef, useEffect, useState } from "react";
import { Planet, Star, Point3D, RotatedPoint } from "../types";
import { planetsData } from "../data";
import { Play, Pause, Compass, ZoomIn, ZoomOut, RotateCcw, Orbit, Sparkles } from "lucide-react";

const safeArc = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  counterclockwise?: boolean
) => {
  const safeX = isNaN(x) ? 0 : x;
  const safeY = isNaN(y) ? 0 : y;
  const safeRadius = Math.max(0.1, isNaN(radius) ? 0.1 : Math.abs(radius));
  const safeStart = isNaN(startAngle) ? 0 : startAngle;
  const safeEnd = isNaN(endAngle) ? 0 : endAngle;
  ctx.arc(safeX, safeY, safeRadius, safeStart, safeEnd, counterclockwise);
};

const safeCreateRadialGradient = (
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  r0: number,
  x1: number,
  y1: number,
  r1: number
) => {
  const safeR0 = Math.max(0.1, isNaN(r0) ? 0.1 : Math.abs(r0));
  const safeR1 = Math.max(0.1, isNaN(r1) ? 0.1 : Math.abs(r1));
  const safeX0 = isNaN(x0) ? 0 : x0;
  const safeY0 = isNaN(y0) ? 0 : y0;
  const safeX1 = isNaN(x1) ? 0 : x1;
  const safeY1 = isNaN(y1) ? 0 : y1;
  return ctx.createRadialGradient(safeX0, safeY0, safeR0, safeX1, safeY1, safeR1);
};

interface SolarSystemCanvasProps {
  selectedPlanetId: string | null;
  onSelectPlanet: (planetId: string | null) => void;
  speedMultiplier: number;
  setSpeedMultiplier: (val: number) => void;
  isPaused: boolean;
  setIsPaused: (val: boolean) => void;
}

export const SolarSystemCanvas: React.FC<SolarSystemCanvasProps> = ({
  selectedPlanetId,
  onSelectPlanet,
  speedMultiplier,
  setSpeedMultiplier,
  isPaused,
  setIsPaused,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Simulation parameters
  const [yaw, setYaw] = useState<number>(-0.6); // Camera rotate left-right
  const [pitch, setPitch] = useState<number>(0.65); // Camera tilt up-down (isometric by default)
  const [zoom, setZoom] = useState<number>(0.85); // Camera scale factor
  const cameraCenterRef = useRef<Point3D>({ x: 0, y: 0, z: 0 }); // Target focus point
  const [showOrbits, setShowOrbits] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [lockCamera, setLockCamera] = useState<boolean>(true); // Keeps camera centered on active planet if chosen

  // Interactive drag states
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Store real-time planet orbital angles in a ref so they update continuously at 60fps
  const planetAnglesRef = useRef<Record<string, number>>({
    mercury: Math.random() * Math.PI * 2,
    venus: Math.random() * Math.PI * 2,
    earth: Math.random() * Math.PI * 2,
    mars: Math.random() * Math.PI * 2,
    jupiter: Math.random() * Math.PI * 2,
    saturn: Math.random() * Math.PI * 2,
    uranus: Math.random() * Math.PI * 2,
    neptune: Math.random() * Math.PI * 2,
  });

  // Background stars starfield generator (one-time mount)
  const starsRef = useRef<Star[]>([]);
  useEffect(() => {
    const stars: Star[] = [];
    const count = 280;
    for (let i = 0; i < count; i++) {
      // Scatter in spherical boundary inside the universe
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 500 + Math.random() * 1000;

      stars.push({
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.sin(phi) * Math.sin(theta),
        z: r * Math.cos(phi),
        size: 0.5 + Math.random() * 1.5,
        brightness: 0.3 + Math.random() * 0.7,
      });
    }
    starsRef.current = stars;
  }, []);

  // Set default responsive canvas size on resize
  const [dimensions, setDimensions] = useState({ width: 600, height: 600 });
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight || 550,
        });
      }
    };
    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => resizeObserver.disconnect();
  }, []);

  // Update orbit angles at 60 FPS
  useEffect(() => {
    if (isPaused) return;

    let animFrame: number;
    const updateAngles = () => {
      planetsData.forEach((planet) => {
        planetAnglesRef.current[planet.id] += planet.orbitSpeed * 0.45 * speedMultiplier;
      });
      animFrame = requestAnimationFrame(updateAngles);
    };

    animFrame = requestAnimationFrame(updateAngles);
    return () => cancelAnimationFrame(animFrame);
  }, [isPaused, speedMultiplier]);

  // Focus tracking is handled smoothly inside the requestAnimationFrame loop to prevent React state re-renders.

  // Main custom rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle high DPI Retina screens
    canvas.width = dimensions.width * window.devicePixelRatio;
    canvas.height = dimensions.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const width = dimensions.width;
    const height = dimensions.height;
    const centerX = width / 2;
    const centerY = height / 2;

    let animId: number;

    // Mathematical projection function 3D -> 2D with dynamic rotation (Yaw/Pitch) & camera centering translation
    const project3D = (point: Point3D): RotatedPoint => {
      // 1. Shift coords relative to camera's center focal target (panning/tracking offset)
      const tx = point.x - cameraCenterRef.current.x;
      const ty = point.y - cameraCenterRef.current.y;
      const tz = point.z - cameraCenterRef.current.z;

      // 2. Rotate around Y-axis (Yaw)
      const cosYaw = Math.cos(yaw);
      const sinYaw = Math.sin(yaw);
      const rx = tx * cosYaw - tz * sinYaw;
      const rz1 = tx * sinYaw + tz * cosYaw;

      // 3. Rotate around X-axis (Pitch)
      const cosPitch = Math.cos(pitch);
      const sinPitch = Math.sin(pitch);
      const ry = ty * cosPitch - rz1 * sinPitch;
      const rz = ty * sinPitch + rz1 * cosPitch;

      return {
        x: centerX + rx * zoom,
        y: centerY + ry * zoom,
        z: rz, // Kept as depth reference Z
        rotatedX: rx,
        rotatedY: ry,
        rotatedZ: rz,
      };
    };

    const drawFrame = () => {
      // Keep updating camera target tracking if focused vs smooth sliding back to Sol
      if (selectedPlanetId && lockCamera) {
        const activePlanet = planetsData.find((p) => p.id === selectedPlanetId);
        if (activePlanet) {
          const pAngle = planetAnglesRef.current[selectedPlanetId];
          const targetX = activePlanet.baseDistance * Math.cos(pAngle);
          const targetZ = activePlanet.baseDistance * Math.sin(pAngle) * Math.cos(activePlanet.inclination);
          const targetY = activePlanet.baseDistance * Math.sin(pAngle) * Math.sin(activePlanet.inclination);

          // Smoothly interpolate camera target toward the active planet
          cameraCenterRef.current.x += (targetX - cameraCenterRef.current.x) * 0.1;
          cameraCenterRef.current.y += (targetY - cameraCenterRef.current.y) * 0.1;
          cameraCenterRef.current.z += (targetZ - cameraCenterRef.current.z) * 0.1;
        }
      } else {
        // Smoothly slide back to (0,0,0) (Matahari)
        const dx = 0 - cameraCenterRef.current.x;
        const dy = 0 - cameraCenterRef.current.y;
        const dz = 0 - cameraCenterRef.current.z;
        const distance = Math.hypot(dx, dy, dz);
        if (distance < 0.5) {
          cameraCenterRef.current = { x: 0, y: 0, z: 0 };
        } else {
          cameraCenterRef.current.x += dx * 0.15;
          cameraCenterRef.current.y += dy * 0.15;
          cameraCenterRef.current.z += dz * 0.15;
        }
      }

      // Clear with elegant radial canvas universe dark background
      const spaceGrad = safeCreateRadialGradient(ctx, centerX, centerY, 50, centerX, centerY, Math.max(width, height));
      spaceGrad.addColorStop(0, "#06060c");
      spaceGrad.addColorStop(0.5, "#030307");
      spaceGrad.addColorStop(1, "#010103");
      ctx.fillStyle = spaceGrad;
      ctx.fillRect(0, 0, width, height);

      // Draw horizontal reference grid lines for the solar plane (sci-fi HUD asset)
      drawSolarReferencePlane(ctx, centerX, centerY, zoom, yaw, pitch, cameraCenterRef.current);

      // 1. DRAW STARS (depth sorted, very far back)
      starsRef.current.forEach((star) => {
        const proj = project3D(star);
        // Ensure they fall roughly in view bounds
        if (proj.x >= 0 && proj.x < width && proj.y >= 0 && proj.y < height) {
          // Stars fade slightly if they rotate to the back of viewport bounds
          const opacity = Math.max(0.15, star.brightness * (1 - proj.rotatedZ / 2500));
          ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
          ctx.beginPath();
          safeArc(ctx, proj.x, proj.y, star.size, 0, Math.PI * 2);
          ctx.fill();

          // Add a gentle shine to random bright stars
          if (star.size > 1.3 && Math.random() < 0.005) {
            ctx.strokeStyle = "rgba(103, 232, 249, 0.4)";
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(proj.x - 4, proj.y);
            ctx.lineTo(proj.x + 4, proj.y);
            ctx.moveTo(proj.x, proj.y - 4);
            ctx.lineTo(proj.x, proj.y + 4);
            ctx.stroke();
          }
        }
      });

      // 2. BUILD DEPTH-SORTABLE SCENE OBJECTS LIST
      const renderList: Array<{
        type: "sun" | "planet" | "saturn_ring_back" | "saturn_ring_front" | "moon";
        depth: number;
        data?: any;
        draw: (context: CanvasRenderingContext2D) => void;
      }> = [];

      // A. Add the Sun at spatial origin (0, 0, 0)
      const sunProj = project3D({ x: 0, y: 0, z: 0 });
      renderList.push({
        type: "sun",
        depth: sunProj.rotatedZ,
        draw: (c) => drawSun(c, sunProj, zoom),
      });

      // B. Process Orbit paths and Planetes
      planetsData.forEach((planet) => {
        const angle = planetAnglesRef.current[planet.id];
        
        // Calculate current 100% accurate 3D coordinates based on orbit inclination
        const pX = planet.baseDistance * Math.cos(angle);
        const pZ = planet.baseDistance * Math.sin(angle) * Math.cos(planet.inclination);
        const pY = planet.baseDistance * Math.sin(angle) * Math.sin(planet.inclination);

        const planetProj = project3D({ x: pX, y: pY, z: pZ });
        const scaleRadius = Math.max(1.8, planet.baseRadius * zoom * (1 - planetProj.rotatedZ * 0.0012));

        // Draw Orbit Paths beforehand if enabled
        if (showOrbits) {
          drawOrbitPath(ctx, planet, project3D);
        }

        // Earth's orbiting Moon nested calculation (pushed before sort)
        if (planet.id === "earth") {
          const moonAngle = (angle * 6.5) % (Math.PI * 2);
          const mDistance = 18; // base visual distance from earth
          const mX = pX + mDistance * Math.cos(moonAngle);
          const mZ = pZ + mDistance * Math.sin(moonAngle) * Math.cos(0.08); // slight moon tilt
          const mY = pY + mDistance * Math.sin(moonAngle) * Math.sin(0.08);

          const moonProj = project3D({ x: mX, y: mY, z: mZ });
          
          // moons are drawn slightly offsetted
          renderList.push({
            type: "moon",
            depth: moonProj.rotatedZ,
            draw: (mc) => {
              mc.beginPath();
              safeArc(mc, moonProj.x, moonProj.y, Math.max(0.8, 1.8 * zoom), 0, Math.PI * 2);
              mc.fillStyle = "#E5E7EB";
              mc.fill();
            }
          });
        }

        // Saturn's double-pass rings (pushed before sort)
        if (planet.id === "saturn") {
          // Back half of Saturn's ring
          renderList.push({
            type: "saturn_ring_back",
            depth: planetProj.rotatedZ - 1.5, // slightly further back than Saturn's core
            draw: (sc) => drawSaturnSpaceRing(sc, planetProj, scaleRadius, zoom, pitch, "back")
          });

          // Front half of Saturn's ring
          renderList.push({
            type: "saturn_ring_front",
            depth: planetProj.rotatedZ + 1.5, // slightly in front of Saturn's core
            draw: (sc) => drawSaturnSpaceRing(sc, planetProj, scaleRadius, zoom, pitch, "front")
          });
        }

        // Add Planet to render list
        renderList.push({
          type: "planet",
          depth: planetProj.rotatedZ,
          data: planet,
          draw: (c) => {
            // Draw primary planet body
            drawPlanet(c, planet, planetProj, scaleRadius, selectedPlanetId === planet.id, showLabels);
          },
        });
      });

      // 3. SORT BY DEPTH Z (Back legs of orbits drawn first, then origin Sun, then foreground planets)
      renderList.sort((a, b) => b.depth - a.depth);

      // 4. DRAW EVERYTHING IN ORDER
      renderList.forEach((item) => item.draw(ctx));

      // 5. RENDER UI / GLOWING TARGET MARKERS (Overlay)
      if (selectedPlanetId) {
        const activePlanet = planetsData.find((p) => p.id === selectedPlanetId);
        if (activePlanet) {
          const angle = planetAnglesRef.current[selectedPlanetId];
          const tX = activePlanet.baseDistance * Math.cos(angle);
          const tZ = activePlanet.baseDistance * Math.sin(angle) * Math.cos(activePlanet.inclination);
          const tY = activePlanet.baseDistance * Math.sin(angle) * Math.sin(activePlanet.inclination);

          const targetProj = project3D({ x: tX, y: tY, z: tZ });
          drawTargetingHUD(ctx, targetProj, activePlanet, zoom);
        }
      }

      animId = requestAnimationFrame(drawFrame);
    };

    drawFrame();

    return () => cancelAnimationFrame(animId);
  }, [dimensions, yaw, pitch, zoom, selectedPlanetId, lockCamera, showOrbits, showLabels]);

  // Orbit path lines drawer in 3D using segmented paths
  const drawOrbitPath = (
    ctx: CanvasRenderingContext2D,
    planet: Planet,
    project: (p: Point3D) => RotatedPoint
  ) => {
    ctx.save();
    ctx.beginPath();
    
    // Draw 3D elliptical orbits on a segmented arc basis for pristine 3D layout curving
    const segments = 120;
    const isSelected = selectedPlanetId === planet.id;

    for (let i = 0; i <= segments; i++) {
      const phi = (i / segments) * Math.PI * 2;
      const oX = planet.baseDistance * Math.cos(phi);
      const oZ = planet.baseDistance * Math.sin(phi) * Math.cos(planet.inclination);
      const oY = planet.baseDistance * Math.sin(phi) * Math.sin(planet.inclination);

      const proj = project({ x: oX, y: oY, z: oZ });

      if (i === 0) {
        ctx.moveTo(proj.x, proj.y);
      } else {
        ctx.lineTo(proj.x, proj.y);
      }
    }

    ctx.closePath();
    ctx.lineWidth = isSelected ? 1.0 : 0.6;
    ctx.strokeStyle = isSelected 
      ? `rgba(34, 211, 238, 0.45)` 
      : `rgba(255, 255, 255, 0.08)`;
    
    // Make paths dashed for custom orbital grid aesthetics
    ctx.setLineDash([4, 6]);
    ctx.stroke();
    ctx.restore();
  };

  // Background Grid Matrix
  const drawSolarReferencePlane = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    zm: number,
    yw: number,
    pt: number,
    center: Point3D
  ) => {
    ctx.save();
    ctx.strokeStyle = "rgba(34, 211, 238, 0.02)";
    ctx.lineWidth = 1;
    ctx.setLineDash([0, 0]);

    // Draw concentric reference grid concentric rings
    const gridPoints = 4;
    for (let j = 1; j <= gridPoints; j++) {
      const radius = j * 120;
      ctx.beginPath();
      for (let i = 0; i <= 64; i++) {
        const angle = (i / 64) * Math.PI * 2;
        // standard flat 3D point (Y=0 reference solar ecliptic)
        const gX = radius * Math.cos(angle) - center.x;
        const gZ = radius * Math.sin(angle) - center.z;
        const gY = 0 - center.y;

        // Yaw Y-axis rotation
        const rx = gX * Math.cos(yw) - gZ * Math.sin(yw);
        const rz1 = gX * Math.sin(yw) + gZ * Math.cos(yw);
        // Pitch X-axis rotation
        const ry = gY * Math.cos(pt) - rz1 * Math.sin(pt);

        const screenX = cx + rx * zm;
        const screenY = cy + ry * zm;

        if (i === 0) ctx.moveTo(screenX, screenY);
        else ctx.lineTo(screenX, screenY);
      }
      ctx.closePath();
      ctx.stroke();
    }
    
    ctx.restore();
  };

  // Beautiful Glowing Central Sun
  const drawSun = (ctx: CanvasRenderingContext2D, proj: RotatedPoint, zm: number) => {
    ctx.save();
    
    // Constant sun corona expansion pulse over time
    const pulseFactor = 1 + 0.03 * Math.sin(Date.now() * 0.002);
    const sunRadius = 24 * zm * pulseFactor;

    // Flare glow outer pass
    const outerGlow = safeCreateRadialGradient(ctx, proj.x, proj.y, sunRadius * 0.5, proj.x, proj.y, sunRadius * 2.8);
    outerGlow.addColorStop(0, "rgba(249, 115, 22, 0.5)");
    outerGlow.addColorStop(0.3, "rgba(234, 179, 8, 0.25)");
    outerGlow.addColorStop(0.7, "rgba(239, 68, 68, 0.04)");
    outerGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    safeArc(ctx, proj.x, proj.y, sunRadius * 2.8, 0, Math.PI * 2);
    ctx.fill();

    // Hot helium core inner pass
    const innerCore = safeCreateRadialGradient(ctx, proj.x, proj.y, 2, proj.x, proj.y, sunRadius);
    innerCore.addColorStop(0, "#FFFFFF");
    innerCore.addColorStop(0.15, "#FEF08A");
    innerCore.addColorStop(0.5, "#FBBF24");
    innerCore.addColorStop(0.85, "#F97316");
    innerCore.addColorStop(1, "#EA580C");
    ctx.fillStyle = innerCore;
    ctx.beginPath();
    safeArc(ctx, proj.x, proj.y, sunRadius, 0, Math.PI * 2);
    ctx.fill();

    // Sun center tag label
    ctx.fillStyle = "#FDE68A";
    ctx.font = "9px monospace";
    ctx.textAlign = "center";
    ctx.fillText("MATAHARI", proj.x, proj.y - sunRadius - 8);

    ctx.restore();
  };

  // Specific planet drawing routine with directional solar shade mapping
  const drawPlanet = (
    ctx: CanvasRenderingContext2D,
    planet: Planet,
    proj: RotatedPoint,
    radius: number,
    isSelected: boolean,
    labels: boolean
  ) => {
    ctx.save();

    // 1. Core Sphere Base Fill
    ctx.beginPath();
    safeArc(ctx, proj.x, proj.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = planet.color;
    ctx.fill();

    // 2. Solar directional shadow masking overlay
    // Calculate 3D direction vector from origin (Sun) to Planet.
    // The visual shader shadows are drawn in the direction directly opposite to sun position on screen.
    // Since Center of view corresponds to Sun, shadow direction points outward from viewport center.
    const shadowAngle = Math.atan2(proj.rotatedY, proj.rotatedX);
    ctx.beginPath();
    safeArc(ctx, proj.x, proj.y, radius, 0, Math.PI * 2);
    ctx.clip(); // Mask shade to the sphere outline

    // Create shadow gradient offsetting to the dark side
    // Sun source origin is visual center: hence shadow shifts toward shadowAngle
    const shadowGrad = ctx.createLinearGradient(
      proj.x - radius * Math.cos(shadowAngle) * 0.5,
      proj.y - radius * Math.sin(shadowAngle) * 0.5,
      proj.x + radius * Math.cos(shadowAngle) * 0.8,
      proj.y + radius * Math.sin(shadowAngle) * 0.8
    );
    shadowGrad.addColorStop(0, "rgba(255, 255, 255, 0.1)");
    shadowGrad.addColorStop(0.3, "rgba(0, 0, 0, 0.45)");
    shadowGrad.addColorStop(1, "rgba(0, 0, 0, 0.95)");
    ctx.fillStyle = shadowGrad;
    ctx.fill();

    // Atmosphere halo
    const atmosGrad = safeCreateRadialGradient(ctx, proj.x, proj.y, radius * 0.8, proj.x, proj.y, radius);
    atmosGrad.addColorStop(0, "rgba(0,0,0,0)");
    atmosGrad.addColorStop(1, `${planet.accentColor}bb`);
    ctx.fillStyle = atmosGrad;
    ctx.fill();

    ctx.restore(); // Stop planet sphere masking

    // 3. UI Labeling HUD (Optional)
    if (labels) {
      ctx.save();
      ctx.textAlign = "left";
      ctx.fillStyle = isSelected ? "#22D3EE" : "rgba(243, 244, 246, 0.8)";
      ctx.font = isSelected ? "bold 10px monospace" : "9px monospace";
      ctx.fillText(planet.name.toUpperCase(), proj.x + radius + 6, proj.y + 3);

      // Distance info label overlay on hover/focus
      if (isSelected) {
        ctx.fillStyle = "rgba(103, 232, 249, 0.6)";
        ctx.font = "8px monospace";
        ctx.fillText(planet.realDistance, proj.x + radius + 6, proj.y + 13);
      }
      ctx.restore();
    }
  };

  // Specific 3D ring render for Saturn in Space view
  const drawSaturnSpaceRing = (
    ctx: CanvasRenderingContext2D,
    proj: RotatedPoint,
    pRadius: number,
    zm: number,
    pitchAngle: number,
    side: "back" | "front"
  ) => {
    ctx.save();
    
    // Rings tilt corresponding to planet axis (visual angle ~ 15 degrees)
    const ringAngle = 0.12;
    const innerRadiusX = pRadius * 1.5;
    const outerRadiusX = pRadius * 2.4;

    const startAngle = side === "back" ? Math.PI : 0;
    const endAngle = side === "back" ? Math.PI * 2 : Math.PI;

    ctx.translate(proj.x, proj.y);
    ctx.rotate(ringAngle);

    ctx.beginPath();
    ctx.ellipse(0, 0, Math.max(0.1, innerRadiusX), Math.max(0.1, Math.abs(innerRadiusX * Math.sin(pitchAngle))), 0, startAngle, endAngle);
    ctx.ellipse(0, 0, Math.max(0.1, outerRadiusX), Math.max(0.1, Math.abs(outerRadiusX * Math.sin(pitchAngle))), 0, endAngle, startAngle, true);
    ctx.closePath();

    // Custom gradient mimicking rings stripes
    const ringGrad = safeCreateRadialGradient(ctx, 0, 0, innerRadiusX, 0, 0, outerRadiusX);
    ringGrad.addColorStop(0, "rgba(224, 185, 116, 0.05)");
    ringGrad.addColorStop(0.3, "rgba(224, 185, 116, 0.45)");
    ringGrad.addColorStop(0.5, "rgba(100, 80, 50, 0.1)"); // Casini division
    ringGrad.addColorStop(0.7, "rgba(234, 179, 8, 0.5)");
    ringGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

    ctx.fillStyle = ringGrad;
    ctx.fill();
    ctx.restore();
  };

  // Floating sci-fi target hud indicators overlay on selection
  const drawTargetingHUD = (
    ctx: CanvasRenderingContext2D,
    proj: RotatedPoint,
    planet: Planet,
    zm: number
  ) => {
    ctx.save();
    const size = Math.max(16, planet.baseRadius * zm * 1.8);
    const rotationFrame = Date.now() * 0.0015;

    ctx.strokeStyle = "#22D3EE";
    ctx.lineWidth = 1;

    // Glowing coordinate lines
    ctx.beginPath();
    ctx.arc(proj.x, proj.y, size * 1.25, 0, Math.PI * 2);
    ctx.setLineDash([2, 5]);
    ctx.stroke();

    // Four corner targeting brackets
    ctx.translate(proj.x, proj.y);
    ctx.rotate(rotationFrame);
    ctx.setLineDash([0, 0]);

    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(size, size * 0.5);
      ctx.lineTo(size, size);
      ctx.lineTo(size * 0.5, size);
      ctx.stroke();
    }

    ctx.restore();
  };

  // Handle Mouse Down of main Canvas area to initiate rotate drag
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };

    // Identify if double clicked to clear selected planet
    if (e.detail === 2) {
      onSelectPlanet(null);
    }
  };

  // Map 2D Click coordinate to closest 3D Planet
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Only register quick click if it was not a massive rotate drag sequence
    if (isDragging) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let clickedPlanetId: string | null = null;
    let closestDistance = 25; // Click radius pad in px

    planetsData.forEach((planet) => {
      // Access pre-calculated projected coordinate from the rendering calculations
      const angle = planetAnglesRef.current[planet.id];
      const pX = planet.baseDistance * Math.cos(angle);
      const pZ = planet.baseDistance * Math.sin(angle) * Math.cos(planet.inclination);
      const pY = planet.baseDistance * Math.sin(angle) * Math.sin(planet.inclination);

      // Simple real-time recalculation of click projections based on current values
      const tx = pX - cameraCenterRef.current.x;
      const ty = pY - cameraCenterRef.current.y;
      const tz = pZ - cameraCenterRef.current.z;

      const rx = tx * Math.cos(yaw) - tz * Math.sin(yaw);
      const rz1 = tx * Math.sin(yaw) + tz * Math.cos(yaw);
      const ry = ty * Math.cos(pitch) - rz1 * Math.sin(pitch);

      const screenX = dimensions.width / 2 + rx * zoom;
      const screenY = dimensions.height / 2 + ry * zoom;

      const dist = Math.hypot(mouseX - screenX, mouseY - screenY);
      if (dist < closestDistance) {
        clickedPlanetId = planet.id;
        closestDistance = dist;
      }
    });

    if (clickedPlanetId) {
      onSelectPlanet(clickedPlanetId);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;

    // Orbit speed rotation adjustments
    setYaw((y) => (y - dx * 0.0075) % (Math.PI * 2));
    setPitch((p) => Math.max(-1.45, Math.min(1.45, p - dy * 0.0075)));

    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUpOrLeave = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setIsDragging(false);
      // Determine if drag amplitude is low enough to count as genuine select click
      const originalX = dragStart.current.x;
      const originalY = dragStart.current.y;
      const totalDragDist = Math.hypot(e.clientX - originalX, e.clientY - originalY);
      if (totalDragDist < 5) {
        handleCanvasClick(e);
      }
    }
  };

  // Scroll to zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setZoom((prev) => Math.max(0.18, Math.min(3.5, prev - e.deltaY * 0.001)));
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[450px] md:h-[550px] lg:h-[620px] backdrop-blur-md bg-white/5 rounded-2xl border border-white/10 overflow-hidden flex flex-col justify-end"
    >
      {/* 1. Main visual viewport Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={() => setIsDragging(false)}
        onWheel={handleWheel}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* 2. Top-Left Floating HUD telemetry logs */}
      <div className="absolute top-4 left-4 z-10 p-4 backdrop-blur-md bg-white/5 rounded-xl border border-white/10 flex flex-col gap-1 select-none pointer-events-none">
        <div className="flex items-center gap-1.5 ">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-cyan-400">
            KOSMOS-3D ENGINE v4.2
          </span>
        </div>
        <div className="text-[10px] text-gray-400 font-mono flex flex-col gap-0.5 mt-1.5 lowercase">
          <span>Yaw: {(yaw * (180 / Math.PI)).toFixed(1)}°</span>
          <span>Pitch: {(pitch * (180 / Math.PI)).toFixed(1)}°</span>
          <span>Zoom multiplier: {zoom.toFixed(2)}x</span>
          <span>Target lock: {selectedPlanetId ? selectedPlanetId.toUpperCase() : "SOLAR ECLIPTIC ORIGIN"}</span>
        </div>
      </div>

      {/* 3. Right-top Interactive Buttons HUD */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <div className="flex flex-col backdrop-blur-md bg-white/5 rounded-xl border border-white/10 p-1.5 gap-1 shadow-xl">
          <button
            onClick={() => setZoom((z) => Math.min(3.5, z + 0.15))}
            className="p-1.5 rounded-lg text-white hover:text-cyan-400 hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            title="Zoom Masuk"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.18, z - 0.15))}
            className="p-1.5 rounded-lg text-white hover:text-cyan-400 hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            title="Zoom Keluar"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setYaw(-0.6);
              setPitch(0.65);
              setZoom(0.85);
            }}
            className="p-1.5 rounded-lg text-white hover:text-cyan-400 hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            title="Risat Rotasi"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col backdrop-blur-md bg-white/5 rounded-xl border border-white/10 p-1.5 gap-1 shadow-xl">
          <button
            onClick={() => setShowOrbits((prev) => !prev)}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              showOrbits ? "text-cyan-400 bg-white/10" : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
            title="Toggle Jalur Orbit"
          >
            <Orbit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowLabels((prev) => !prev)}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              showLabels ? "text-cyan-400 bg-white/10" : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
            title="Toggle Label Nama"
          >
            <Compass className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4. Bottom Orbit Control Console panel (Interactive speeds + lock camera toggler) */}
      <div className="relative z-10 m-4 p-4 rounded-2xl backdrop-blur-md bg-white/5 border border-white/10 shadow-2xl flex flex-wrap gap-4 justify-between items-center select-none">
        <div className="flex items-center gap-3">
          {/* Pause Button */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`p-2 rounded-lg border cursor-pointer flex items-center justify-center transition-all ${
              isPaused
                ? "bg-emerald-500 border-emerald-400 text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/25"
                : "bg-white/5 border-white/10 text-white hover:bg-white/10"
            }`}
          >
            {isPaused ? <Play className="w-4 h-4 fill-slate-950" /> : <Pause className="w-4 h-4" />}
          </button>

          {/* Speed Controls */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-mono text-gray-500 uppercase font-bold tracking-wider">
              Laju Simulasi
            </span>
            <div className="flex bg-white/5 border border-white/10 rounded-lg p-0.5">
              {[0.2, 1, 3, 7].map((speed) => (
                <button
                  key={speed}
                  onClick={() => {
                    setSpeedMultiplier(speed);
                    setIsPaused(false);
                  }}
                  className={`px-2 py-0.5 font-mono text-[10px] rounded transition-all cursor-pointer ${
                    speedMultiplier === speed && !isPaused
                      ? "text-cyan-400 bg-white/10 font-bold"
                      : "text-gray-400 hover:text-slate-200"
                  }`}
                >
                  {speed === 0.2 ? "0.2X" : speed === 1 ? "1X" : speed === 3 ? "3X" : "7X"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Lock selection focus toggle */}
        {selectedPlanetId && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLockCamera((prev) => !prev)}
              className={`px-3 py-1.5 rounded-lg border cursor-pointer font-mono text-[10px] uppercase tracking-wider flex items-center gap-2 transition-all ${
                lockCamera
                  ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-md shadow-cyan-500/5 hover:bg-cyan-500/20"
                  : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> TRACK: {lockCamera ? "KUNCI" : "BEBAS"}
            </button>
            <button
              onClick={() => onSelectPlanet(null)}
              className="px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white hover:bg-white/10 font-mono text-[10px] cursor-pointer"
            >
              MATAHARI CENTER
            </button>
          </div>
        )}

        <div className="text-[10px] font-mono text-gray-500 hidden sm:block">
          {isPaused
            ? "Simulasi Dihentikan"
            : `Menyimulasikan Orbit... (${speedMultiplier > 1 ? `Kecepatan ${speedMultiplier}x` : "Kecepatan Normal"})`}
        </div>
      </div>
    </div>
  );
};
