import React, { useRef, useEffect, useState } from "react";
import { Planet } from "../types";
import { Move, ZoomIn, GripHorizontal } from "lucide-react";

// Safe wrapper to prevent IndexSizeError (RangeError) crash when radii are zero or close to zero
const safeEllipse = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rX: number,
  rY: number,
  rotation: number,
  startAngle: number,
  endAngle: number,
  counterclockwise?: boolean
) => {
  const safeX = isNaN(x) ? 0 : x;
  const safeY = isNaN(y) ? 0 : y;
  const safeRX = Math.max(0.1, isNaN(rX) ? 0.1 : Math.abs(rX));
  const safeRY = Math.max(0.1, isNaN(rY) ? 0.1 : Math.abs(rY));
  const safeRot = isNaN(rotation) ? 0 : rotation;
  const safeStart = isNaN(startAngle) ? 0 : startAngle;
  const safeEnd = isNaN(endAngle) ? 0 : endAngle;
  ctx.ellipse(safeX, safeY, safeRX, safeRY, safeRot, safeStart, safeEnd, counterclockwise);
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

interface PlanetInspectorProps {
  planet: Planet;
  isPaused: boolean;
}

export const PlanetInspector: React.FC<PlanetInspectorProps> = ({ planet, isPaused }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState(0);
  const [pitch, setPitch] = useState(0.2); // Sumbu miring planet (~11 derajat)
  const [zoom, setZoom] = useState(1.1); // default zoom factor
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Update rotation continuously if not paused
  useEffect(() => {
    if (isPaused) return;

    let animFrameId: number;
    const update = () => {
      setRotation((prev) => (prev + 0.015) % (Math.PI * 2));
      animFrameId = requestAnimationFrame(update);
    };

    animFrameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animFrameId);
  }, [isPaused]);

  // Main render loop for the 3D Planet Preview
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set high DPI canvas
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const width = rect.width;
    const height = rect.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = Math.min(width, height) * 0.28 * zoom;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

        // Draw deep cosmic space background inside card circle
    ctx.save();
    ctx.beginPath();
    safeArc(ctx, centerX, centerY, baseRadius + 30, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(10, 10, 20, 0.4)";
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(59, 130, 246, 0.15)";
    ctx.stroke();
    ctx.restore();

    // DRAW SATURN BACK RING (drawn first because it goes behind the planet)
    if (planet.id === "saturn") {
      drawSaturnRings(ctx, centerX, centerY, baseRadius, pitch, rotation, "back");
    }

    // DRAW THE PLANET SPHERE
    ctx.save();
    // Create spherical clipping path
    ctx.beginPath();
    safeArc(ctx, centerX, centerY, baseRadius, 0, Math.PI * 2);
    ctx.clip();

    // Fill with solid color space
    ctx.fillStyle = planet.color;
    ctx.fill();

    // Render features depending on the planet style
    renderPlanetFeatures(ctx, centerX, centerY, baseRadius, rotation, pitch, planet);

    // Draw 3D Shading Spherical Overlay (ambient light + shadow)
    // Dynamic lighting assuming Sun is coming from top-left front (x: -0.5, y: -0.3, z: 0.8)
    const shadowGrad = safeCreateRadialGradient(
      ctx,
      centerX - baseRadius * 0.35,
      centerY - baseRadius * 0.35,
      baseRadius * 0.2,
      centerX,
      centerY,
      baseRadius
    );
    shadowGrad.addColorStop(0, "rgba(255, 255, 255, 0.12)");
    shadowGrad.addColorStop(0.5, "rgba(0, 0, 0, 0.3)");
    shadowGrad.addColorStop(1, "rgba(0, 0, 0, 0.92)");

    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    safeArc(ctx, centerX, centerY, baseRadius, 0, Math.PI * 2);
    ctx.fill();

    // Atmosphere glowing ring (limb brightening)
    const atmosphericGlow = safeCreateRadialGradient(
      ctx,
      centerX,
      centerY,
      baseRadius * 0.9,
      centerX,
      centerY,
      baseRadius
    );
    atmosphericGlow.addColorStop(0, "rgba(0, 0, 0, 0)");
    atmosphericGlow.addColorStop(0.7, `${planet.color}15`);
    atmosphericGlow.addColorStop(1, `${planet.accentColor}dd`);

    ctx.fillStyle = atmosphericGlow;
    ctx.beginPath();
    safeArc(ctx, centerX, centerY, baseRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore(); // Stop clipping

    // DRAW SATURN FRONT RING (drawn after planet so it overlaps nicely)
    if (planet.id === "saturn") {
      drawSaturnRings(ctx, centerX, centerY, baseRadius, pitch, rotation, "front");
    }

    // Draw little rotating moons if present
    if (planet.moonsCount > 0) {
      renderMoons(ctx, centerX, centerY, baseRadius, rotation, pitch, planet);
    }

  }, [planet, rotation, pitch, zoom]);

  // Helper function to draw procedural textures for planets
  const renderPlanetFeatures = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    r: number,
    rot: number,
    pt: number,
    pl: Planet
  ) => {
    if (pl.id === "jupiter" || pl.id === "saturn") {
      // Draw horizontal atmospheric storm bands
      const bands = pl.id === "jupiter" 
        ? [
            { y: -0.85, h: 0.1, col: "#B45309" },
            { y: -0.7, h: 0.12, col: "#F59E0B" },
            { y: -0.5, h: 0.18, col: "#D97706" },
            { y: -0.2, h: 0.25, col: "#92400e" },
            { y: 0.1, h: 0.15, col: "#F59E0B" },
            { y: 0.35, h: 0.2, col: "#D97706" },
            { y: 0.65, h: 0.12, col: "#92400e" },
            { y: 0.8, h: 0.1, col: "#78350f" },
          ]
        : [
            { y: -0.8, h: 0.12, col: "#B45309" },
            { y: -0.5, h: 0.2, col: "#FBBF24" },
            { y: -0.1, h: 0.3, col: "#D97706" },
            { y: 0.3, h: 0.25, col: "#EAB308" },
            { y: 0.65, h: 0.15, col: "#A16207" },
          ];

      bands.forEach((band) => {
        ctx.fillStyle = band.col;
        // Project a horizontal strip onto 3D sphere at specific latitudes
        const segments = 40;
        ctx.beginPath();
        
        // Loop from left hemisphere to right hemisphere
        for (let i = 0; i <= segments; i++) {
          const latAngle = -Math.PI / 2 + (i / segments) * Math.PI; // -90 deg to +90 deg
          const localX = Math.sin(latAngle) * r;
          // Calculate localized 3D height under sphere curvature
          const sphereRadAtY = Math.cos(latAngle) * r;

          // Orbit/spherical warping formula based on pitch (PT) and rotation (ROT)
          const localY = cy + r * band.y + (band.h * r * 0.4) * Math.sin(latAngle) * Math.sin(pt);
          
          if (i === 0) {
            ctx.moveTo(cx + localX, localY - (band.h * r) / 2);
          } else {
            ctx.lineTo(cx + localX, localY - (band.h * r) / 2);
          }
        }

        // Loop back for bottom of strip
        for (let i = segments; i >= 0; i--) {
          const latAngle = -Math.PI / 2 + (i / segments) * Math.PI;
          const localX = Math.sin(latAngle) * r;
          const localY = cy + r * band.y + (band.h * r * 0.4) * Math.sin(latAngle) * Math.sin(pt);
          ctx.lineTo(cx + localX, localY + (band.h * r) / 2);
        }

        ctx.closePath();
        ctx.fill();
      });

      // Draw Jupiter's legendary Great Red Spot (Bintik Merah Raksasa)
      if (pl.id === "jupiter") {
        const spotLon = Math.PI * 0.45; // longitude of spot
        const spotLat = 0.33; // latitude of spot (south hemisphere)
        
        // Calculate spot position incorporating sphere rotation
        const currentLon = (spotLon + rot) % (Math.PI * 2);
        
        // Only render if it lies on the visible front hemisphere (i.e. angle is between -PI/2 and PI/2)
        const visibleAngle = ((currentLon + Math.PI / 2) % (Math.PI * 2)) - Math.PI / 2;
        if (Math.abs(visibleAngle) < Math.PI / 2) {
          ctx.save();
          const spotX = cx + Math.sin(visibleAngle) * r * Math.cos(spotLat);
          const spotY = cy + r * spotLat + Math.sin(visibleAngle) * r * 0.12 * Math.sin(pt);
          
          // Draw elliptical eye spot
          ctx.beginPath();
          const scaleRadiusX = r * 0.15 * Math.cos(visibleAngle); // foreshortening near edges
          const scaleRadiusY = r * 0.09;
          
          safeEllipse(ctx, spotX, spotY, scaleRadiusX, scaleRadiusY, -0.05, 0, Math.PI * 2);
          const redSpotGrad = safeCreateRadialGradient(ctx, spotX, spotY, 2, spotX, spotY, scaleRadiusY);
          redSpotGrad.addColorStop(0, "#F43F5E");
          redSpotGrad.addColorStop(0.6, "#BE123C");
          redSpotGrad.addColorStop(1, "#881337");
          ctx.fillStyle = redSpotGrad;
          ctx.fill();

          // Border outlines
          ctx.lineWidth = 1;
          ctx.strokeStyle = "#FEF08A";
          ctx.stroke();
          ctx.restore();
        }
      }
    } else if (pl.id === "earth") {
      // Draw simplified continents (Europe, Americas, Asia, Africa wrap)
      // Moving continents across the screen using sin/cos of rotation
      const continents = [
        { name: "Americas", lon: 0.1, lat: -0.1, sizeX: 0.28, sizeY: 0.45 },
        { name: "Africa-Eurasia", lon: 2.8, lat: 0.05, sizeX: 0.32, sizeY: 0.42 },
        { name: "Asia-Pacific", lon: 4.5, lat: 0.15, sizeX: 0.26, sizeY: 0.38 },
        { name: "Greenland", lon: 0.8, lat: -0.65, sizeX: 0.12, sizeY: 0.14 },
        { name: "Antarctica", lon: 0, lat: 0.85, sizeX: 0.6, sizeY: 0.15 },
      ];

      ctx.fillStyle = pl.accentColor; // Emerald green lands
      continents.forEach((cont) => {
        // Project center
        const currLon = (cont.lon + rot) % (Math.PI * 2);
        const visibleAngle = ((currLon + Math.PI / 2) % (Math.PI * 2)) - Math.PI / 2;
        
        if (Math.abs(visibleAngle) < Math.PI / 1.4) {
          ctx.beginPath();
          const landX = cx + Math.sin(visibleAngle) * r * Math.cos(cont.lat);
          const landY = cy + r * cont.lat + Math.sin(visibleAngle) * r * 0.1 * Math.sin(pt);
          const foreshortenedW = r * cont.sizeX * Math.cos(visibleAngle);

          // Draw an organic blob for continent
          safeEllipse(
            ctx,
            landX,
            landY,
            foreshortenedW,
            r * cont.sizeY,
            0.1,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      });

      // Swirling atmospheric white clouds overlay
      ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
      const clouds = [
        { lon: 1.2, lat: -0.2, w: 0.4, h: 0.08 },
        { lon: 3.4, lat: 0.3, w: 0.5, h: 0.06 },
        { lon: 5.1, lat: -0.4, w: 0.35, h: 0.07 },
      ];
      clouds.forEach((cloud) => {
        const cloudLon = (cloud.lon + rot * 1.3) % (Math.PI * 2); // clouds move faster!
        const visibleAngle = ((cloudLon + Math.PI / 2) % (Math.PI * 2)) - Math.PI / 2;
        if (Math.abs(visibleAngle) < Math.PI / 2) {
          ctx.beginPath();
          const cloudX = cx + Math.sin(visibleAngle) * r * Math.cos(cloud.lat);
          const cloudY = cy + r * cloud.lat;
          safeEllipse(
            ctx,
            cloudX,
            cloudY,
            r * cloud.w * Math.cos(visibleAngle),
            r * cloud.h,
            -0.05,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      });
    } else if (pl.id === "mars") {
      // Draw dusty canyons and polar cap
      ctx.fillStyle = "#991B1B"; // Dark red areas
      const craterFields = [
        { lon: 0.5, lat: 0.2, rX: 0.18, rY: 0.15 },
        { lon: 2.2, lat: -0.3, rX: 0.25, rY: 0.2 },
        { lon: 4.1, lat: 0.1, rX: 0.15, rY: 0.22 },
      ];
      craterFields.forEach((field) => {
        const termLon = (field.lon + rot) % (Math.PI * 2);
        const visibleAngle = ((termLon + Math.PI / 2) % (Math.PI * 2)) - Math.PI / 2;
        if (Math.abs(visibleAngle) < Math.PI / 2) {
          ctx.beginPath();
          const fX = cx + Math.sin(visibleAngle) * r * Math.cos(field.lat);
          const fY = cy + r * field.lat;
          ctx.ellipse(
            fX,
            fY,
            Math.abs(r * field.rX * Math.cos(visibleAngle)),
            r * field.rY,
            0,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      });

      // Pure white Martian North Ice Cap (always on top)
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      // Draw polar ellipse rotated with pitch
      const capRadX = r * 0.28;
      const capRadY = r * 0.12 * Math.cos(pt);
      safeEllipse(ctx, cx, cy - r * 0.88, capRadX, capRadY, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (pl.id === "mercury" || pl.id === "uranus" || pl.id === "neptune" || pl.id === "venus") {
      // General craters or atmospheric swirls
      // Venus swirling wind patterns
      if (pl.id === "venus") {
        ctx.strokeStyle = "rgba(254, 243, 199, 0.25)";
        ctx.lineWidth = 2;
        for (let j = 0; j < 4; j++) {
          const depthPct = -0.6 + j * 0.4;
          ctx.beginPath();
          for (let i = 0; i <= 20; i++) {
            const angle = -Math.PI / 2 + (i / 20) * Math.PI;
            const waveX = cx + Math.sin(angle) * r;
            const waveY = cy + r * depthPct + r * 0.08 * Math.sin(angle * 3 + rot * 2);
            if (i === 0) ctx.moveTo(waveX, waveY);
            else ctx.lineTo(waveX, waveY);
          }
          ctx.stroke();
        }
      }

      // Mercury craters
      if (pl.id === "mercury") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.lineWidth = 1;
        const craters = [
          { lon: 0.8, lat: -0.3, size: 0.12 },
          { lon: 2.1, lat: 0.4, size: 0.15 },
          { lon: 3.5, lat: -0.1, size: 0.08 },
          { lon: 4.8, lat: 0.5, size: 0.1 },
        ];
        craters.forEach((cr) => {
          const crLon = (cr.lon + rot) % (Math.PI * 2);
          const visibleAngle = ((crLon + Math.PI / 2) % (Math.PI * 2)) - Math.PI / 2;
          if (Math.abs(visibleAngle) < Math.PI / 1.6) {
            const posX = cx + Math.sin(visibleAngle) * r * Math.cos(cr.lat);
            const posY = cy + r * cr.lat;
            ctx.beginPath();
            safeArc(ctx, posX, posY, cr.size * r * Math.cos(visibleAngle), 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }
        });
      }

      // Uranus and Neptune ice swirls
      if (pl.id === "neptune" || pl.id === "uranus") {
        ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
        const clouds = [
          { lon: 1.5, lat: 0.1, sizeW: 0.3, sizeH: 0.04 },
          { lon: 3.9, lat: -0.2, sizeW: 0.4, sizeH: 0.03 }
        ];
        clouds.forEach((cl) => {
          const clLon = (cl.lon + rot * 0.8) % (Math.PI * 2);
          const visibleAngle = ((clLon + Math.PI / 2) % (Math.PI * 2)) - Math.PI / 2;
          if (Math.abs(visibleAngle) < Math.PI / 2) {
            const posX = cx + Math.sin(visibleAngle) * r * Math.cos(cl.lat);
            const posY = cy + r * cl.lat;
            ctx.beginPath();
            safeEllipse(
              ctx,
              posX,
              posY,
              cl.sizeW * r * Math.cos(visibleAngle),
              cl.sizeH * r,
              0,
              0,
              Math.PI * 2
            );
            ctx.fill();
          }
        });
      }
    }
  };

  // Helper dedicated to Saturn's Ring 3D projection
  const drawSaturnRings = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    r: number,
    pt: number,
    rot: number,
    side: "back" | "front"
  ) => {
    ctx.save();
    
    // Set 3D ring properties
    const innerRingRadius = r * 1.5;
    const outerRingRadius = r * 2.3;
    const ringThicknessY = outerRingRadius * Math.sin(pt); // Squashes relative to camera pitch

    // Dynamic angles based on pitch
    // If pitch > 0, back is drawn top half, front is drawn bottom half.
    const startAngle = side === "back" ? Math.PI : 0;
    const endAngle = side === "back" ? Math.PI * 2 : Math.PI;

    // Apply rotation tilt corresponding to ring coordinate miring
    ctx.translate(cx, cy);
    ctx.rotate(0.12); // Planet axis inclination tilt (visual tilt)

    ctx.beginPath();
    // Inner ring arc
    safeEllipse(ctx, 0, 0, innerRingRadius, innerRingRadius * Math.sin(pt), 0, startAngle, endAngle, side === "back");
    // Outer ring arc
    safeEllipse(ctx, 0, 0, outerRingRadius, outerRingRadius * Math.sin(pt), 0, endAngle, startAngle, side === "front");
    ctx.closePath();

    // Fill with a gorgeous authentic ring-stripe gradient
    const ringGrad = safeCreateRadialGradient(ctx, 0, 0, innerRingRadius, 0, 0, outerRingRadius);
    ringGrad.addColorStop(0, "rgba(224, 185, 116, 0.05)"); // Inner transparent gap
    ringGrad.addColorStop(0.1, "rgba(216, 180, 115, 0.75)"); // Bright A-ring
    ringGrad.addColorStop(0.5, "rgba(180, 142, 90, 0.55)"); // Cassini Division (darker)
    ringGrad.addColorStop(0.55, "rgba(90, 75, 52, 0.25)");
    ringGrad.addColorStop(0.7, "rgba(202, 168, 107, 0.85)"); // Bright B-ring
    ringGrad.addColorStop(0.9, "rgba(161, 131, 80, 0.65)"); // Outer C-ring
    ringGrad.addColorStop(1, "rgba(100, 80, 50, 0.02)"); // Fadeout

    ctx.fillStyle = ringGrad;
    ctx.fill();

    // Outline details
    ctx.strokeStyle = "rgba(253, 230, 138, 0.18)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  };

  // Helper to render orbiting moons in the detail viewer
  const renderMoons = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    r: number,
    rot: number,
    pt: number,
    pl: Planet
  ) => {
    // Generate up to 3 visualization moons
    const numMoons = Math.min(pl.moonsCount, 3);
    const moonConfigs = [
      { dist: r * 1.5, speed: 1.8, size: 2.2, color: "#D1D5DB" }, // Inner
      { dist: r * 1.9, speed: 1.1, size: 3.0, color: "#E5E7EB" }, // Mid
      { dist: r * 2.3, speed: 0.6, size: 1.8, color: "#9CA3AF" }, // Outer
    ];

    for (let i = 0; i < numMoons; i++) {
      const config = moonConfigs[i];
      // Moon orbit angle calculation
      const angle = (rot * config.speed) % (Math.PI * 2);
      
      // Calculate 3D projected coordinates relative to planet center
      const mX = Math.cos(angle) * config.dist;
      // Slanted orbital planes for visual variety
      const mZ = Math.sin(angle) * config.dist;
      const mY = mZ * Math.sin(pt) * 0.5 + mX * 0.1 * Math.sin(pt); // Slight slant
      
      const screenX = cx + mX;
      const screenY = cy + mY;

      // Depth check: Is the moon behind the planet? (moon Z negative means in back)
      const isBehind = mZ < 0;

      // Draw orbit path line
      ctx.beginPath();
      safeEllipse(
        ctx,
        cx,
        cy,
        config.dist,
        config.dist * Math.sin(pt) * 0.4,
        0.1,
        0,
        Math.PI * 2
      );
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Render the moon sphere
      ctx.beginPath();
      safeArc(ctx, screenX, screenY, config.size, 0, Math.PI * 2);
      ctx.fillStyle = config.color;
      ctx.fill();

      // Shadow overlay on moon
      ctx.beginPath();
      safeArc(ctx, screenX, screenY, config.size, 0, Math.PI * 2);
      const moonShadow = ctx.createLinearGradient(
        screenX - config.size,
        screenY - config.size,
        screenX + config.size,
        screenY + config.size
      );
      moonShadow.addColorStop(0, "rgba(255, 255, 255, 0.15)");
      moonShadow.addColorStop(1, "rgba(0, 0, 0, 0.75)");
      ctx.fillStyle = moonShadow;
      ctx.fill();

      // Label
      if (pl.moonsList[i]) {
        ctx.fillStyle = "rgba(156, 163, 175, 0.7)";
        ctx.font = "8px monospace";
        ctx.fillText(pl.moonsList[i], screenX + config.size + 4, screenY + 2);
      }
    }
  };

  // Mouse drag handlers on preview canvas to control rotation and tilt
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    
    setRotation((prev) => (prev + dx * 0.008) % (Math.PI * 2));
    setPitch((prev) => Math.max(-0.6, Math.min(1.2, prev + dy * 0.008)));
    
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  return (
    <div ref={containerRef} className="relative w-full aspect-square md:aspect-auto md:h-72 lg:h-80 backdrop-blur-md bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center justify-center overflow-hidden group select-none">
      {/* HUD labels */}
      <div className="absolute top-4 left-4 flex flex-col gap-1 z-10">
        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest flex items-center gap-1.5">
          <Move className="w-3 h-3 text-cyan-400" /> INSPEKTUR 3D
        </span>
        <span className="text-[10px] text-gray-400 font-mono">
          Model: {planet.englishName.toUpperCase()}.STL
        </span>
      </div>

      {/* Control Widgets */}
      <div className="absolute bottom-4 right-4 flex gap-2 z-10 opacity-80 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setZoom((z) => Math.max(0.6, z - 0.25))}
          className="p-1 px-3 rounded bg-white/5 border border-white/10 text-white font-mono text-xs hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
          title="Zoom Out"
        >
          -
        </button>
        <button
          onClick={() => setZoom(1.1)}
          className="p-1 px-2.5 rounded bg-white/5 border border-white/10 text-white font-sans text-xs hover:bg-white/10 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
          title="Reset Zoom"
        >
          <ZoomIn className="w-3 h-3 text-cyan-400" /> Reset
        </button>
        <button
          onClick={() => setZoom((z) => Math.min(1.8, z + 0.25))}
          className="p-1 px-3 rounded bg-white/5 border border-white/10 text-white font-mono text-xs hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
          title="Zoom In"
        >
          +
        </button>
      </div>

      {/* Instructions Overlay */}
      <div className="absolute bottom-4 left-4 flex items-center gap-1 text-[10px] text-gray-500 font-mono pointer-events-none">
        <GripHorizontal className="w-3.5 h-3.5 text-gray-500" /> Tarik Mouse untuk Rotasi 3D
      </div>

      {/* Main Preview Drawing Board */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />
    </div>
  );
};
