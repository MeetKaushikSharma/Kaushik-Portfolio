import { useEffect, useRef } from "react";
import gsap from "gsap";
import type { Theme } from "@/hooks/useTheme";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface CloudThemeTransitionProps {
  theme?: Theme;
  isTransitioning: boolean;
  targetTheme: Theme | null;
  onCommitSwap: () => void;
  onFinish: () => void;
}

interface CloudSprite {
  img: CanvasImageSource;
  x: number;
  y: number;
  width: number;
  height: number;
  alpha: number;
}

const CLOUD_ASSETS = {
  bank: "/assets/clouds/cloud_bank.png",
  puff: "/assets/clouds/cloud_puff.png",
};

let cachedBankImg: HTMLImageElement | null = null;
let cachedPuffImg: HTMLImageElement | null = null;

// Eagerly pre-load cloud assets on module import for zero-delay instant response
if (typeof window !== "undefined") {
  cachedBankImg = new Image();
  cachedBankImg.src = CLOUD_ASSETS.bank;
  cachedPuffImg = new Image();
  cachedPuffImg.src = CLOUD_ASSETS.puff;
}

/**
 * Creates or retrieves a theme-tinted cloud canvas sprite.
 * For light mode: retains original fluffy white textures.
 * For dark mode: composites the cloud into deep midnight charcoal/slate with silver rim lighting.
 */
function getTintedSprite(
  img: HTMLImageElement,
  isDark: boolean
): CanvasImageSource {
  if (!isDark) return img;
  if (!img.complete || img.naturalWidth === 0) return img;

  const c = document.createElement("canvas");
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const tCtx = c.getContext("2d");
  if (!tCtx) return img;

  // 1. Draw original cloud texture
  tCtx.drawImage(img, 0, 0);

  // 2. Tint with dark storm gradient using "source-in" (preserves cloud silhouette & feathered transparency)
  tCtx.globalCompositeOperation = "source-in";
  const grad = tCtx.createLinearGradient(0, 0, 0, c.height);
  grad.addColorStop(0, "#334155"); // Cool slate rim at top crest
  grad.addColorStop(0.45, "#1e293b"); // Deep midnight slate
  grad.addColorStop(1, "#0f172a"); // Charcoal navy body
  tCtx.fillStyle = grad;
  tCtx.fillRect(0, 0, c.width, c.height);

  // 3. Add soft starlight / moonlight rim highlight on top
  tCtx.globalCompositeOperation = "screen";
  tCtx.globalAlpha = 0.32;
  tCtx.drawImage(img, 0, 0);

  return c;
}

/**
 * Draws a cute smiling sun rising with the clouds for the Light Mode transition.
 */
function drawSmilingSun(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  angleOffset = 0
) {
  ctx.save();

  // 1. Soft atmospheric warm halo
  const haloGrad = ctx.createRadialGradient(
    cx,
    cy,
    radius * 0.7,
    cx,
    cy,
    radius * 1.85
  );
  haloGrad.addColorStop(0, "rgba(251, 191, 36, 0.45)");
  haloGrad.addColorStop(0.5, "rgba(245, 158, 11, 0.18)");
  haloGrad.addColorStop(1, "rgba(245, 158, 11, 0)");
  ctx.fillStyle = haloGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 1.85, 0, Math.PI * 2);
  ctx.fill();

  // 2. Radiant stylized sun rays (12 rounded rays with gentle spin)
  const rayCount = 12;
  const innerRayR = radius * 1.14;
  const outerRayR = radius * 1.44;
  ctx.strokeStyle = "#fbbf24";
  ctx.lineWidth = Math.max(radius * 0.11, 3);
  ctx.lineCap = "round";
  for (let i = 0; i < rayCount; i++) {
    const angle = (i * Math.PI * 2) / rayCount + angleOffset;
    const x1 = cx + Math.cos(angle) * innerRayR;
    const y1 = cy + Math.sin(angle) * innerRayR;
    const x2 = cx + Math.cos(angle) * outerRayR;
    const y2 = cy + Math.sin(angle) * outerRayR;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // 3. Sun Body Disc (Warm golden 3D gradient)
  const bodyGrad = ctx.createRadialGradient(
    cx - radius * 0.25,
    cy - radius * 0.25,
    radius * 0.08,
    cx,
    cy,
    radius
  );
  bodyGrad.addColorStop(0, "#fef08a"); // Bright warm highlight
  bodyGrad.addColorStop(0.55, "#facc15"); // Golden yellow
  bodyGrad.addColorStop(1, "#f59e0b"); // Rich amber edge
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  // Subtle golden rim
  ctx.strokeStyle = "#d97706";
  ctx.lineWidth = Math.max(radius * 0.035, 1.5);
  ctx.stroke();

  // 4. Cute Blushing Rosy Cheeks
  ctx.fillStyle = "rgba(244, 114, 182, 0.68)";
  const cheekOffsetX = radius * 0.42;
  const cheekOffsetY = radius * 0.12;
  const cheekRadius = radius * 0.16;
  // Left cheek
  ctx.beginPath();
  ctx.arc(cx - cheekOffsetX, cy + cheekOffsetY, cheekRadius, 0, Math.PI * 2);
  ctx.fill();
  // Right cheek
  ctx.beginPath();
  ctx.arc(cx + cheekOffsetX, cy + cheekOffsetY, cheekRadius, 0, Math.PI * 2);
  ctx.fill();

  // 5. Smiling Eyes (Happy upward curved arches: ^ ^)
  ctx.strokeStyle = "#78350f"; // Rich warm espresso brown
  ctx.lineWidth = Math.max(radius * 0.085, 2.5);
  ctx.lineCap = "round";

  const eyeOffsetX = radius * 0.28;
  const eyeOffsetY = -radius * 0.08;
  const eyeR = radius * 0.15;

  // Left Eye
  ctx.beginPath();
  ctx.arc(
    cx - eyeOffsetX,
    cy + eyeOffsetY,
    eyeR,
    Math.PI * 1.15,
    Math.PI * 1.85,
    false
  );
  ctx.stroke();

  // Right Eye
  ctx.beginPath();
  ctx.arc(
    cx + eyeOffsetX,
    cy + eyeOffsetY,
    eyeR,
    Math.PI * 1.15,
    Math.PI * 1.85,
    false
  );
  ctx.stroke();

  // 6. Cute Happy Smile Mouth (Curved joyful arc)
  ctx.beginPath();
  ctx.arc(
    cx,
    cy + radius * 0.08,
    radius * 0.26,
    Math.PI * 0.12,
    Math.PI * 0.88,
    false
  );
  ctx.stroke();

  ctx.restore();
}

/**
 * Helper to draw a tiny sparkling 4-point star for the night sky.
 */
function drawTinyStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  alpha: number
) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
  ctx.restore();
}

/**
 * Draws a 1/4 size crescent/quarter moon rising with the clouds for the Dark Mode transition.
 */
function drawQuarterMoon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  progress = 0
) {
  ctx.save();

  // 1. Soft lunar moonlight glow aura
  const glowGrad = ctx.createRadialGradient(
    cx,
    cy,
    radius * 0.5,
    cx,
    cy,
    radius * 2.1
  );
  glowGrad.addColorStop(0, "rgba(226, 232, 240, 0.35)");
  glowGrad.addColorStop(0.5, "rgba(148, 163, 184, 0.15)");
  glowGrad.addColorStop(1, "rgba(148, 163, 184, 0)");
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 2.1, 0, Math.PI * 2);
  ctx.fill();

  // 2. Crescent / 1/4 Moon Body
  // Outer arc: from top (-PI/2) to bottom (PI/2)
  ctx.beginPath();
  ctx.arc(cx, cy, radius, -Math.PI * 0.5, Math.PI * 0.5, false);
  // Inner bezier curve cutting in to form the crescent silhouette
  ctx.bezierCurveTo(
    cx + radius * 0.18,
    cy + radius * 0.55,
    cx + radius * 0.18,
    cy - radius * 0.55,
    cx,
    cy - radius
  );
  ctx.closePath();

  // Lunar silver-pearl gradient
  const moonGrad = ctx.createLinearGradient(
    cx - radius * 0.2,
    cy - radius,
    cx + radius,
    cy + radius
  );
  moonGrad.addColorStop(0, "#ffffff");
  moonGrad.addColorStop(0.4, "#f1f5f9");
  moonGrad.addColorStop(1, "#cbd5e1");
  ctx.fillStyle = moonGrad;
  ctx.fill();

  // Crisp lunar rim stroke
  ctx.strokeStyle = "rgba(248, 250, 252, 0.85)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 3. Faint lunar maria/craters for realistic moon texture
  ctx.fillStyle = "rgba(148, 163, 184, 0.28)";
  ctx.beginPath();
  ctx.arc(cx + radius * 0.42, cy - radius * 0.25, radius * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + radius * 0.5, cy + radius * 0.18, radius * 0.13, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + radius * 0.28, cy + radius * 0.44, radius * 0.08, 0, Math.PI * 2);
  ctx.fill();

  // 4. Subtle whimsical night stars twinkling nearby as it travels
  const star1Alpha = 0.7 + 0.3 * Math.sin(progress * 16);
  const star2Alpha = 0.65 + 0.35 * Math.cos(progress * 18);
  const star3Alpha = 0.7 + 0.3 * Math.sin(progress * 14 + 1.2);

  drawTinyStar(ctx, cx - radius * 0.95, cy - radius * 0.6, 3.5, star1Alpha);
  drawTinyStar(ctx, cx + radius * 1.35, cy - radius * 0.75, 4.2, star2Alpha);
  drawTinyStar(ctx, cx + radius * 1.15, cy + radius * 0.7, 3.2, star3Alpha);

  ctx.restore();
}

export function CloudThemeTransition({
  isTransitioning,
  targetTheme,
  onCommitSwap,
  onFinish,
}: CloudThemeTransitionProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isReducedMotion = useReducedMotion();
  const onCommitSwapRef = useRef(onCommitSwap);
  onCommitSwapRef.current = onCommitSwap;
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;
  const isRunningRef = useRef(false);

  useEffect(() => {
    if (!isTransitioning || !targetTheme || isRunningRef.current) return;

    if (isReducedMotion) {
      onCommitSwapRef.current();
      onFinishRef.current();
      return;
    }

    isRunningRef.current = true;
    const dialog = dialogRef.current;
    const canvas = canvasRef.current;
    if (!canvas || !dialog) return;

    // Show dialog in the Top Layer so clouds render ON TOP of all content
    if (typeof dialog.showModal === "function") {
      try {
        dialog.showModal();
      } catch {
        // If already showing or not supported
      }
    }

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = window.innerWidth;
    const H = window.innerHeight;

    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.scale(dpr, dpr);

    const rawBankImg = cachedBankImg || new Image();
    if (!cachedBankImg) {
      rawBankImg.src = CLOUD_ASSETS.bank;
      cachedBankImg = rawBankImg;
    }
    const rawPuffImg = cachedPuffImg || new Image();
    if (!cachedPuffImg) {
      rawPuffImg.src = CLOUD_ASSETS.puff;
      cachedPuffImg = rawPuffImg;
    }

    const isDark = targetTheme === "dark";

    // Obtain theme-tinted sprites: fluffy white for light mode, deep midnight storm for dark mode
    const bankSprite = getTintedSprite(rawBankImg, isDark);
    const puffSprite = getTintedSprite(rawPuffImg, isDark);

    // Volumetric cloud bank configuration
    // Total height of the cloud sea ensures 100% full screen coverage at midpoint
    const totalClusterH = Math.max(H * 1.5, 950);
    const basePuffW = Math.max(W * 0.42, 500);
    const basePuffH = basePuffW * 0.9;
    const baseBankW = Math.max(W * 0.85, 900);
    const baseBankH = baseBankW * 0.65;

    // Sprites separated into layers so the celestial body (Sun/Moon) is nestled naturally
    const coreSprites: CloudSprite[] = [];
    const crestSprites: CloudSprite[] = [];
    const trailingSprites: CloudSprite[] = [];

    // 1. Dense Core Layer (Large wide cloud banks forming opaque center)
    const coreBankCount = Math.ceil(W / (baseBankW * 0.55)) + 1;
    for (let c = -1; c < coreBankCount; c++) {
      coreSprites.push({
        img: bankSprite,
        x: c * (baseBankW * 0.52) - baseBankW * 0.25,
        y: basePuffH * 0.4,
        width: baseBankW * 1.15,
        height: baseBankH * 1.1,
        alpha: 1.0,
      });
      coreSprites.push({
        img: bankSprite,
        x: c * (baseBankW * 0.52) - baseBankW * 0.1,
        y: basePuffH * 0.7,
        width: baseBankW * 1.2,
        height: baseBankH * 1.15,
        alpha: 1.0,
      });
      coreSprites.push({
        img: bankSprite,
        x: c * (baseBankW * 0.52) - baseBankW * 0.3,
        y: basePuffH * 1.0,
        width: baseBankW * 1.15,
        height: baseBankH * 1.1,
        alpha: 1.0,
      });
    }

    // 2. Leading Crest (Organic, fluffy, billowy cumulus cloud heads across the top)
    const crestPuffCount = Math.ceil(W / (basePuffW * 0.45)) + 2;
    for (let p = -1; p < crestPuffCount; p++) {
      const isAlt = p % 2 === 0;
      const puffX = p * (basePuffW * 0.42) - basePuffW * 0.3;
      const puffY = isAlt ? 0 : basePuffH * 0.15;
      const scale = isAlt ? 1.05 : 0.95;

      crestSprites.push({
        img: isAlt ? puffSprite : bankSprite,
        x: puffX,
        y: puffY,
        width: (isAlt ? basePuffW : baseBankW * 0.65) * scale,
        height: (isAlt ? basePuffH : baseBankH * 0.65) * scale,
        alpha: 1.0,
      });
    }

    // 3. Trailing Edge (Soft cloud puffs along the bottom so exit is gentle and misty)
    for (let p = -1; p < crestPuffCount; p++) {
      const puffX = p * (basePuffW * 0.45) - basePuffW * 0.2;
      const puffY = totalClusterH - basePuffH * 0.8;
      trailingSprites.push({
        img: puffSprite,
        x: puffX,
        y: puffY,
        width: basePuffW * 1.1,
        height: basePuffH * 1.1,
        alpha: 0.95,
      });
    }

    // Celestial companion position (Sun for light mode, 1/4 Moon for dark mode)
    const celestialBaseX = Math.round(W * (W < 640 ? 0.70 : 0.74));
    const celestialRadius = Math.min(Math.max(W * 0.075, 46), 72);

    // Motion parameters: fast, snappy duration with uniform linear velocity
    const startY = H + 40;
    const endY = -totalClusterH - 40;
    const DURATION = 0.90; // Fast and snappy (reduced from 1.55s)

    let hasSwapped = false;

    // Helper to safely draw sprite
    function drawSprite(sprite: CloudSprite, clusterBaseY: number) {
      const drawX = sprite.x;
      const drawY = clusterBaseY + sprite.y;
      if (drawY + sprite.height < -20 || drawY > H + 20) return;

      const isDrawable =
        sprite.img instanceof HTMLCanvasElement
          ? sprite.img.width > 0
          : (sprite.img as HTMLImageElement).complete &&
            (sprite.img as HTMLImageElement).naturalWidth > 0;

      if (isDrawable) {
        ctx!.globalAlpha = sprite.alpha;
        ctx!.drawImage(
          sprite.img,
          drawX,
          drawY,
          sprite.width,
          sprite.height
        );
      }
    }

    // Ultra-smooth 60 FPS GPU render loop (Static formation moving at constant velocity)
    function render(progress: number) {
      ctx!.clearRect(0, 0, W, H);

      const clusterBaseY = (1 - progress) * startY + progress * endY;

      // 1. Solid center core beneath the cloud puffs to guarantee 100% opacity at midpoint
      const coreY = clusterBaseY + basePuffH * 0.55;
      const coreH = totalClusterH - basePuffH * 0.9;
      if (coreY < H && coreY + coreH > 0) {
        ctx!.fillStyle = isDark ? "#090d16" : "#ffffff";
        ctx!.fillRect(-20, coreY, W + 40, coreH);
      }

      // 2. Draw Core Cloud Banks
      for (let i = 0; i < coreSprites.length; i++) {
        drawSprite(coreSprites[i], clusterBaseY);
      }

      // 3. Draw Celestial Body (Smiling Sun or 1/4 Moon) ON TOP of core & bank layers
      // Moves seamlessly across the viewport accompanying the clouds throughout the animation
      const celestialStartY = H + celestialRadius + 20;
      const celestialEndY = -celestialRadius * 2 - 30;
      const celestialY = (1 - progress) * celestialStartY + progress * celestialEndY;
      const currentCelestialX = celestialBaseX + Math.sin(progress * Math.PI) * 12;

      if (
        celestialY + celestialRadius * 2 > -50 &&
        celestialY - celestialRadius * 2 < H + 50
      ) {
        if (isDark) {
          drawQuarterMoon(ctx!, currentCelestialX, celestialY, celestialRadius, progress);
        } else {
          drawSmilingSun(ctx!, currentCelestialX, celestialY, celestialRadius, progress * 0.4);
        }
      }

      // 4. Draw Leading Crest Puffs (gracefully hugs and overlaps lower boundary of Sun/Moon)
      for (let i = 0; i < crestSprites.length; i++) {
        drawSprite(crestSprites[i], clusterBaseY);
      }

      // 5. Draw Trailing Edge Puffs
      for (let i = 0; i < trailingSprites.length; i++) {
        drawSprite(trailingSprites[i], clusterBaseY);
      }

      ctx!.globalAlpha = 1.0;
    }

    const finishAndCleanup = () => {
      isRunningRef.current = false;
      if (ctx) ctx.clearRect(0, 0, W, H);
      if (dialog && typeof dialog.close === "function") {
        try {
          dialog.close();
        } catch {
          // Ignore
        }
      }
      onFinishRef.current();
    };

    // Constant linear speed from start to end (ease: "none")
    const animState = { progress: 0 };
    const tween = gsap.to(animState, {
      progress: 1,
      duration: DURATION,
      ease: "none", // 100% constant uniform speed
      onUpdate: () => {
        // Swap theme precisely at the midpoint when the screen is 100% engulfed in dense clouds
        if (!hasSwapped && animState.progress >= 0.48) {
          hasSwapped = true;
          onCommitSwapRef.current();
        }
        render(animState.progress);
      },
      onComplete: () => {
        finishAndCleanup();
      },
    });

    return () => {
      tween.kill();
      finishAndCleanup();
    };
  }, [isTransitioning, targetTheme, isReducedMotion]);

  if (!isTransitioning) {
    return null;
  }

  return (
    <dialog
      ref={dialogRef}
      className="cloud-transition-dialog"
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none select-none block w-full h-full"
      />
    </dialog>
  );
}

