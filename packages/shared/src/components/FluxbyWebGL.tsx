import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  detectMotionTier,
  observeMotionTier,
  type MotionTier,
} from '../utils/motion.js';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
}

interface FluxbyWebGLProps {
  size?: number;
  width?: number;
  height?: number;
  className?: string;
  particleCount?: number;
  interactive?: boolean;
  animated?: boolean;
}

const FLUXBY_COLORS = [
  '#C4B5FD', // Light purple
  '#A78BFA', // Purple
  '#8B5CF6', // Violet
  '#DDD6FE', // Very light purple
  '#FBBF24', // Gold (coin)
  '#F5F3FF', // White-ish
];

interface QualitySettings {
  particleMultiplier: number;
  textureDensity: number;
  furDensity: number;
  edgeDensity: number;
  earFurDensity: number;
  targetFps: number;
  windIntensity: number;
  breathScale: number;
  animationsEnabled: boolean;
  pauseDuringScroll: boolean;
  scrollResumeDelay: number;
  allowEyeTracking: boolean;
}

const QUALITY_PRESETS: Record<MotionTier, QualitySettings> = {
  full: {
    particleMultiplier: 1,
    textureDensity: 1,
    furDensity: 1,
    edgeDensity: 1,
    earFurDensity: 1,
    targetFps: 30,
    windIntensity: 1,
    breathScale: 1,
    animationsEnabled: true,
    pauseDuringScroll: false,
    scrollResumeDelay: 0,
    allowEyeTracking: true,
  },
  medium: {
    particleMultiplier: 0.7,
    textureDensity: 0.65,
    furDensity: 0.65,
    edgeDensity: 0.7,
    earFurDensity: 0.65,
    targetFps: 26,
    windIntensity: 0.7,
    breathScale: 0.7,
    animationsEnabled: true,
    pauseDuringScroll: true,
    scrollResumeDelay: 160,
    allowEyeTracking: true,
  },
  low: {
    particleMultiplier: 0.35,
    textureDensity: 0.35,
    furDensity: 0.4,
    edgeDensity: 0.45,
    earFurDensity: 0.4,
    targetFps: 20,
    windIntensity: 0.45,
    breathScale: 0.45,
    animationsEnabled: true,
    pauseDuringScroll: true,
    scrollResumeDelay: 220,
    allowEyeTracking: false,
  },
  minimal: {
    particleMultiplier: 0,
    textureDensity: 0.25,
    furDensity: 0.25,
    edgeDensity: 0.3,
    earFurDensity: 0.25,
    targetFps: 0,
    windIntensity: 0,
    breathScale: 0,
    animationsEnabled: false,
    pauseDuringScroll: true,
    scrollResumeDelay: 280,
    allowEyeTracking: false,
  },
};

const getQualitySettings = (tier: MotionTier): QualitySettings =>
  QUALITY_PRESETS[tier] ?? QUALITY_PRESETS.full;

/**
 * FluxbyWebGL - A WebGL canvas component that renders fluffy particle effects
 * Creates a cozy, magical atmosphere around the Fluxby mascot
 */
export function FluxbyWebGL({
  size,
  width: widthProp = 200,
  height: heightProp = 200,
  className,
  particleCount = 30,
  interactive = true,
  animated = true,
}: FluxbyWebGLProps) {
  // Use size if provided, otherwise use individual width/height
  const width = size ?? widthProp;
  const height = size ?? heightProp;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number | undefined>(undefined);
  const mouseRef = useRef({ x: width / 2, y: height / 2 });
  const eyeTargetRef = useRef({ x: 0, y: 0 });
  const blinkTimeRef = useRef(0);
  const lastFrameTimeRef = useRef(0);
  const lastSecondsRef = useRef(0);
  const [motionTier, setMotionTier] = useState<MotionTier>('full');
  const qualitySettings = useMemo(
    () => getQualitySettings(motionTier),
    [motionTier]
  );
  const [isInView, setIsInView] = useState(true);
  const [isScrollPaused, setIsScrollPaused] = useState(false);
  const scrollPausedRef = useRef(false);
  const hasStaticFrameRef = useRef(false);
  const effectiveParticleCount = useMemo(() => {
    const base = particleCount ?? 0;
    const scaled = Math.round(base * qualitySettings.particleMultiplier);
    return Math.max(0, scaled);
  }, [particleCount, qualitySettings.particleMultiplier]);

  const createParticle = useCallback(
    (x?: number, y?: number): Particle => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.2 + Math.random() * 0.5;
      return {
        x: x ?? Math.random() * width,
        y: y ?? Math.random() * height,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: width * 0.015 + Math.random() * (width * 0.04), // Scaled radius
        color: FLUXBY_COLORS[Math.floor(Math.random() * FLUXBY_COLORS.length)],
        alpha: 0.3 + Math.random() * 0.5,
        decay: 0.001 + Math.random() * 0.002,
      };
    },
    [width, height]
  );

  const initParticles = useCallback(() => {
    if (effectiveParticleCount <= 0) {
      particlesRef.current = [];
      return;
    }
    particlesRef.current = Array.from({ length: effectiveParticleCount }, () =>
      createParticle(undefined, undefined)
    );
  }, [effectiveParticleCount, createParticle]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let mounted = true;
    const initialTier = detectMotionTier();
    if (mounted) {
      setMotionTier(initialTier);
    }
    const cleanup = observeMotionTier((tier) => {
      if (mounted) {
        setMotionTier(tier);
      }
    });
    return () => {
      mounted = false;
      if (cleanup) cleanup();
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const canvas = canvasRef.current;
    if (!canvas || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const visible = entry
          ? entry.isIntersecting || entry.intersectionRatio > 0
          : true;
        setIsInView(visible);
        if (!visible) {
          hasStaticFrameRef.current = false;
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(canvas);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!qualitySettings.pauseDuringScroll) {
      if (scrollPausedRef.current) {
        scrollPausedRef.current = false;
        setIsScrollPaused(false);
      }
      return;
    }

    let timeoutId: number | undefined;

    const handleScroll = () => {
      if (!scrollPausedRef.current) {
        scrollPausedRef.current = true;
        setIsScrollPaused(true);
      }

      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }

      timeoutId = window.setTimeout(() => {
        scrollPausedRef.current = false;
        setIsScrollPaused(false);
      }, qualitySettings.scrollResumeDelay);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      scrollPausedRef.current = false;
      setIsScrollPaused(false);
    };
  }, [qualitySettings.pauseDuringScroll, qualitySettings.scrollResumeDelay]);

  const shouldAnimate =
    animated &&
    qualitySettings.animationsEnabled &&
    isInView &&
    (!qualitySettings.pauseDuringScroll || !isScrollPaused);

  const enableEyeTracking = interactive && qualitySettings.allowEyeTracking;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = undefined;
    }

    // Set up canvas for high DPI displays
    const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    lastFrameTimeRef.current = 0;
    lastSecondsRef.current = 0;
    if (!qualitySettings.animationsEnabled) {
      blinkTimeRef.current = 0;
    }
    hasStaticFrameRef.current = false;

    initParticles();
    const bodyFurCount = Math.max(
      180,
      Math.floor(1600 * qualitySettings.furDensity)
    );
    const earFurCount = Math.max(
      30,
      Math.floor(100 * qualitySettings.earFurDensity)
    );

    // Seeded random for consistent patterns
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed * 12.9898 + seed * 78.233) * 43758.5453;
      return x - Math.floor(x);
    };

    // Simplex-like noise function for fur texture
    const noise2D = (x: number, y: number, seed: number = 0): number => {
      const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
      return (n - Math.floor(n)) * 2 - 1;
    };

    // Fractal noise for more organic texture
    const fractalNoise = (
      x: number,
      y: number,
      octaves: number = 3
    ): number => {
      let value = 0;
      let amplitude = 1;
      let frequency = 1;
      let maxValue = 0;

      for (let i = 0; i < octaves; i++) {
        value += noise2D(x * frequency, y * frequency, i * 100) * amplitude;
        maxValue += amplitude;
        amplitude *= 0.5;
        frequency *= 2;
      }

      return value / maxValue;
    };

    // Instance-specific seed for variation between multiple avatars
    const instanceSeed = Math.random() * 10000;

    // Pre-generate surface fur marks data with instance variation
    interface FurMark {
      angle: number;
      length: number;
      thickness: number;
      colorShift: number;
      offsetX: number;
      offsetY: number;
    }

    const generateFurMarks = (count: number, seed: number): FurMark[] => {
      const marks: FurMark[] = [];
      for (let i = 0; i < count; i++) {
        const s = seed + i * 0.17;
        marks.push({
          angle: seededRandom(s) * Math.PI * 2,
          length: 0.8 + seededRandom(s + 1) * 2.5,
          thickness: 0.3 + seededRandom(s + 2) * 0.8,
          colorShift: seededRandom(s + 3),
          offsetX: (seededRandom(s + 4) - 0.5) * 2,
          offsetY: (seededRandom(s + 5) - 0.5) * 2,
        });
      }
      return marks;
    };

    // Use instance seed to ensure each avatar looks unique
    const bodyFurMarks = generateFurMarks(bodyFurCount, 42 + instanceSeed);
    const earFurMarks = generateFurMarks(earFurCount, 99 + instanceSeed);
    const textureSampleCount = Math.max(
      80,
      Math.floor(800 * qualitySettings.textureDensity)
    );
    const surfaceFurIterations = bodyFurMarks.length;
    const edgeFurCount = Math.max(
      45,
      Math.floor(200 * qualitySettings.edgeDensity)
    );
    const bellyTextureCount = Math.max(
      30,
      Math.floor(120 * qualitySettings.textureDensity)
    );
    const earTextureCount = Math.max(
      30,
      Math.floor(100 * qualitySettings.textureDensity)
    );
    const earGradientCount = Math.max(
      120,
      Math.floor(640 * qualitySettings.earFurDensity)
    );

    // Function to draw the Fluxby avatar
    const drawFluxbyAvatar = (
      ctx: CanvasRenderingContext2D,
      centerX: number,
      centerY: number,
      size: number,
      isBlinking = false,
      eyeTarget = { x: 0, y: 0 },
      time = 0,
      avatarPosXNormalized = 0
    ) => {
      // Scale to 110% - reduced slightly to avoid shadow cutoff
      const avatarScale = 1.1;
      const scale = (size / 100) * avatarScale;

      // Add subtle 3D movement based on mouse position
      const half = Math.max(1, size / 2);
      const nx = Math.max(-1, Math.min(1, eyeTarget.x / half));
      const ny = Math.max(-1, Math.min(1, eyeTarget.y / half));
      const tiltX = nx * 0.025;
      const tiltY = ny * 0.012;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.scale(scale, scale);
      ctx.rotate(tiltX);

      // Color palette - rich purple tones
      const darkPurple = '#7C3AED';
      const basePurple = '#8B5CF6';
      const midPurple = '#A78BFA';
      const lightPurple = '#C4B5FD';
      const palePurple = '#DDD6FE';
      const creamHighlight = '#F5F3FF';

      // ========== 3D SHADING LAYER ==========
      // Soft drop shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetX = 3 + tiltX * 5;
      ctx.shadowOffsetY = 5 + tiltY * 5;

      // Main body shape - larger, centered
      const bodyRadiusX = 36;
      const bodyRadiusY = 33;
      const bodyCenterY = 6;

      // Base body gradient with 3D lighting
      const bodyGradient = ctx.createRadialGradient(
        -12 + tiltX * 20,
        -10 + tiltY * 15,
        0,
        5,
        bodyCenterY,
        bodyRadiusX
      );
      bodyGradient.addColorStop(0, palePurple);
      bodyGradient.addColorStop(0.25, lightPurple);
      bodyGradient.addColorStop(0.5, midPurple);
      bodyGradient.addColorStop(0.8, basePurple);
      bodyGradient.addColorStop(1, darkPurple);

      ctx.fillStyle = bodyGradient;
      ctx.beginPath();
      ctx.ellipse(0, bodyCenterY, bodyRadiusX, bodyRadiusY, 0, 0, Math.PI * 2);
      ctx.fill();

      // Clear shadow for texture layers
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      // ========== WIND WAVE ANIMATION ==========
      // Enhanced multi-layer Perlin-like noise field for natural wind simulation
      // Runs independently based on time - continues smoothly after scroll pause
      const baseWindSpeed = 1.5 * qualitySettings.windIntensity;
      const windWave =
        baseWindSpeed > 0
          ? (x: number, y: number, t: number) => {
              const uniqueT = t + (instanceSeed % 100);

              // Primary wind direction (left to right with slight upward drift)
              const windDirectionX = 0.85;
              const windDirectionY = -0.15;
              const windPhase =
                (x * windDirectionX + y * windDirectionY) * 0.08;

              // Layer 1: Large-scale gusts (slow, sweeping motion)
              const gust =
                Math.sin(windPhase + uniqueT * baseWindSpeed * 0.6) * 0.45;

              // Layer 2: Medium turbulence (adds variation)
              const wave1 = Math.sin(x * 0.12 + uniqueT * baseWindSpeed) * 0.35;
              const wave2 =
                Math.sin(y * 0.1 + uniqueT * baseWindSpeed * 0.8 + 1.5) * 0.25;

              // Layer 3: Fine detail noise (high frequency flutter)
              const flutter =
                Math.sin(x * 0.2 + y * 0.15 + uniqueT * baseWindSpeed * 2.0) *
                0.15;

              // Layer 4: Randomized micro-movement (per-fur variation)
              const microNoise =
                Math.sin(
                  (x + instanceSeed) * 0.3 + uniqueT * baseWindSpeed * 1.5
                ) * 0.1;

              return (
                (gust + wave1 + wave2 + flutter + microNoise) *
                qualitySettings.windIntensity
              );
            }
          : () => 0;

      // ========== PROCEDURAL FUR TEXTURE ==========
      // Layer 1: Noise-based fur grain texture - increased
      ctx.globalCompositeOperation = 'overlay';
      for (let i = 0; i < textureSampleCount; i++) {
        // Use instance seed for texture variation too
        const seed = i * 0.31 + instanceSeed;
        const angle = seededRandom(seed) * Math.PI * 2;
        const dist = seededRandom(seed + 1) * 0.95;

        const x = Math.cos(angle) * dist * bodyRadiusX;
        const y = Math.sin(angle) * dist * bodyRadiusY + bodyCenterY;

        const noiseVal = fractalNoise(x * 0.15, y * 0.15);
        const brightness = 0.5 + noiseVal * 0.3;

        const dotSize = 0.25 + seededRandom(seed + 2) * 0.5;
        const alpha = 0.1 + Math.abs(noiseVal) * 0.15;

        ctx.fillStyle = brightness > 0.5 ? creamHighlight : lightPurple;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(x, y, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1.0;

      // ========== FUR MARKS WITH GRADIENT (body color to tip) ==========
      ctx.lineCap = 'round';
      const breathPhase =
        qualitySettings.breathScale > 0
          ? Math.sin(time * 1.5 + (instanceSeed % 10)) *
            0.08 *
            qualitySettings.breathScale
          : 0;

      // Helper to draw gradient fur mark
      const drawGradientFur = (
        x: number,
        y: number,
        angle: number,
        length: number,
        thickness: number,
        alpha: number,
        baseColor: string,
        tipColor: string
      ) => {
        const endX = x + Math.cos(angle) * length;
        const endY = y + Math.sin(angle) * length;

        // Create gradient from base to tip
        const grad = ctx.createLinearGradient(x, y, endX, endY);
        grad.addColorStop(0, baseColor);
        grad.addColorStop(1, tipColor);

        ctx.strokeStyle = grad;
        ctx.lineWidth = thickness;
        ctx.globalAlpha = alpha;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      };

      // Layer 2: Surface fur marks with gradient - HIGH DENSITY
      for (let i = 0; i < surfaceFurIterations; i++) {
        const mark = bodyFurMarks[i % bodyFurMarks.length];
        const seed = i * 0.23;

        const t = seededRandom(seed);
        const baseAngle = seededRandom(seed + 0.5) * Math.PI * 2;
        const dist = 0.15 + t * 0.8;

        const baseX = Math.cos(baseAngle) * dist * bodyRadiusX + mark.offsetX;
        const baseY =
          Math.sin(baseAngle) * dist * bodyRadiusY + bodyCenterY + mark.offsetY;

        // Stronger wind wave
        const windOffset = windWave(baseX, baseY, time);

        const furAngle = baseAngle + (mark.angle - Math.PI) * 0.2 + windOffset;
        // TRIPLED fur length (1.2 multiplier version)
        const furLength = mark.length * 1.2 * (1 + breathPhase);

        // Gradient from body purple to lighter tip
        const positionBrightness =
          0.5 - (baseX / bodyRadiusX) * 0.15 - (baseY / bodyRadiusY) * 0.1;
        let tipColor: string;
        if (mark.colorShift + positionBrightness > 0.65) {
          tipColor = creamHighlight;
        } else if (mark.colorShift + positionBrightness > 0.35) {
          tipColor = lightPurple;
        } else {
          tipColor = palePurple;
        }

        // Base color is always body purple
        const baseColor = midPurple;
        const alpha = 0.25 + mark.colorShift * 0.2;

        drawGradientFur(
          baseX,
          baseY,
          furAngle,
          furLength,
          mark.thickness * 0.7,
          alpha,
          baseColor,
          tipColor
        );
      }

      ctx.globalAlpha = 1.0;

      // Layer 3: Edge fur with gradient - high count
      for (let i = 0; i < edgeFurCount; i++) {
        const mark = bodyFurMarks[(i * 3) % bodyFurMarks.length];
        const angle = (i / edgeFurCount) * Math.PI * 2;

        const edgeX = Math.cos(angle) * bodyRadiusX * 0.96;
        const edgeY = Math.sin(angle) * bodyRadiusY * 0.96 + bodyCenterY;

        const windOffset = windWave(edgeX, edgeY, time) * 0.7;

        const furAngle = angle + (mark.angle - Math.PI) * 0.08 + windOffset;
        // TRIPLED edge fur length
        const furLength = 2.25 + mark.length * 0.9 + breathPhase;

        const tipColor = mark.colorShift > 0.5 ? lightPurple : palePurple;

        drawGradientFur(
          edgeX,
          edgeY,
          furAngle,
          furLength,
          mark.thickness * 0.6,
          0.3 + mark.colorShift * 0.15,
          basePurple,
          tipColor
        );
      }

      ctx.globalAlpha = 1.0;

      // ========== 3D HIGHLIGHTS ==========
      const highlightGrad = ctx.createRadialGradient(-15, -8, 0, -10, -5, 20);
      highlightGrad.addColorStop(0, 'rgba(255, 255, 255, 0.22)');
      highlightGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.06)');
      highlightGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = highlightGrad;
      ctx.beginPath();
      ctx.ellipse(-12, -5, 14, 10, -Math.PI / 5, 0, Math.PI * 2);
      ctx.fill();

      // ========== BELLY WITH BLUR ==========
      ctx.save();
      ctx.filter = 'blur(1px)';

      const bellyGradient = ctx.createRadialGradient(-2, 12, 0, 0, 14, 16);
      bellyGradient.addColorStop(0, '#FEFCFF');
      bellyGradient.addColorStop(0.35, '#F5F3FF');
      bellyGradient.addColorStop(0.7, '#E9D5FF');
      bellyGradient.addColorStop(1, palePurple);

      ctx.fillStyle = bellyGradient;
      ctx.beginPath();
      ctx.ellipse(0, 14, 16, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.filter = 'none';
      ctx.restore();

      // Belly fur texture - increased
      for (let i = 0; i < bellyTextureCount; i++) {
        const seed = i * 0.67 + 500;
        const angle = seededRandom(seed) * Math.PI * 2;
        const dist = seededRandom(seed + 1) * 0.8;

        const x = Math.cos(angle) * dist * 14;
        const y = Math.sin(angle) * dist * 12 + 14;

        const noiseVal = fractalNoise(x * 0.2, y * 0.2, 50);
        const dotSize = 0.2 + seededRandom(seed + 2) * 0.4;

        ctx.fillStyle = noiseVal > 0 ? '#FEF3C7' : '#F5F3FF';
        ctx.globalAlpha = 0.15 + Math.abs(noiseVal) * 0.1;
        ctx.beginPath();
        ctx.arc(x, y, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1.0;

      // Belly highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.beginPath();
      ctx.ellipse(-5, 10, 5, 4, -Math.PI / 6, 0, Math.PI * 2);
      ctx.fill();

      // ========== BLUSH CHEEKS ==========
      const blushGradL = ctx.createRadialGradient(-18, 8, 0, -18, 8, 10);
      blushGradL.addColorStop(0, 'rgba(255, 100, 130, 0.35)');
      blushGradL.addColorStop(0.5, 'rgba(255, 100, 130, 0.18)');
      blushGradL.addColorStop(1, 'rgba(255, 100, 130, 0)');
      ctx.fillStyle = blushGradL;
      ctx.beginPath();
      ctx.ellipse(-18, 8, 10, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      const blushGradR = ctx.createRadialGradient(18, 8, 0, 18, 8, 10);
      blushGradR.addColorStop(0, 'rgba(255, 100, 130, 0.35)');
      blushGradR.addColorStop(0.5, 'rgba(255, 100, 130, 0.18)');
      blushGradR.addColorStop(1, 'rgba(255, 100, 130, 0)');
      ctx.fillStyle = blushGradR;
      ctx.beginPath();
      ctx.ellipse(18, 8, 10, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // ========== EARS WITH FULL FUR ==========
      // Ear bases with soft blur edge
      ctx.save();
      ctx.filter = 'blur(1px)';

      const earGrad = ctx.createLinearGradient(-25, -25, -10, -5);
      earGrad.addColorStop(0, midPurple);
      earGrad.addColorStop(1, basePurple);
      ctx.fillStyle = earGrad;
      ctx.beginPath();
      ctx.ellipse(-19, -16, 8, 13, -Math.PI / 6, 0, Math.PI * 2);
      ctx.fill();

      const earGradR = ctx.createLinearGradient(25, -25, 10, -5);
      earGradR.addColorStop(0, midPurple);
      earGradR.addColorStop(1, basePurple);
      ctx.fillStyle = earGradR;
      ctx.beginPath();
      ctx.ellipse(19, -16, 8, 13, Math.PI / 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.filter = 'none';
      ctx.restore();

      // Ear fur - noise texture
      for (let ear = 0; ear < 2; ear++) {
        const earX = ear === 0 ? -19 : 19;
        const earAngleBase = ear === 0 ? -Math.PI / 6 : Math.PI / 6;

        // Noise dots - high density
        for (let i = 0; i < earTextureCount; i++) {
          const seed = i * 0.41 + ear * 100;
          const angle = seededRandom(seed) * Math.PI * 2;
          const dist = seededRandom(seed + 1) * 0.8;

          const x = earX + Math.cos(angle + earAngleBase) * dist * 6;
          const y = -16 + Math.sin(angle) * dist * 10;

          const noiseVal = fractalNoise(x * 0.3, y * 0.3, 70 + ear * 30);
          const dotSize = 0.15 + seededRandom(seed + 2) * 0.35;

          ctx.fillStyle = noiseVal > 0 ? lightPurple : midPurple;
          ctx.globalAlpha = 0.18 + Math.abs(noiseVal) * 0.12;
          ctx.beginPath();
          ctx.arc(x, y, dotSize, 0, Math.PI * 2);
          ctx.fill();
        }

        // Gradient fur marks on ears - QUADRUPLED
        for (let i = 0; i < earGradientCount; i++) {
          const mark = earFurMarks[i % earFurMarks.length];
          const seed = i * 0.37 + ear * 200;
          const angle = seededRandom(seed) * Math.PI * 2;
          const dist = 0.15 + seededRandom(seed + 1) * 0.75;

          const baseX = earX + Math.cos(angle + earAngleBase) * dist * 6;
          const baseY = -16 + Math.sin(angle) * dist * 10;

          const windOffset = windWave(baseX, baseY, time) * 0.5;

          const furAngle = angle + earAngleBase + windOffset;
          // Tripled ear fur length
          const furLength = 1.2 + mark.length * 0.75;

          const tipColor = mark.colorShift > 0.5 ? lightPurple : palePurple;

          drawGradientFur(
            baseX,
            baseY,
            furAngle,
            furLength,
            mark.thickness * 0.5,
            0.2 + mark.colorShift * 0.15,
            midPurple,
            tipColor
          );
        }
      }

      ctx.globalAlpha = 1.0;

      // Inner ears - soft
      ctx.save();
      ctx.filter = 'blur(0.5px)';
      ctx.fillStyle = palePurple;
      ctx.beginPath();
      ctx.ellipse(-19, -16, 4, 7, -Math.PI / 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(19, -16, 4, 7, Math.PI / 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.filter = 'none';
      ctx.restore();

      // Eyes (drawn LAST to be on top of everything)
      if (isBlinking) {
        // Friendly, soft eyelid: semi-transparent purple
        ctx.save();
        ctx.fillStyle = 'rgba(124, 58, 237, 0.55)'; // soft purple

        // Left eyelid (soft quadratic curve)
        ctx.beginPath();
        ctx.moveTo(-20, 4);
        ctx.quadraticCurveTo(-12, -8, -4, 4);
        ctx.lineTo(-20, 4);
        ctx.closePath();
        ctx.fill();

        // Right eyelid (soft quadratic curve)
        ctx.beginPath();
        ctx.moveTo(4, 4);
        ctx.quadraticCurveTo(12, -8, 20, 4);
        ctx.lineTo(4, 4);
        ctx.closePath();
        ctx.fill();

        // Lower lash - subtle rounded small arc to give fluffy edge (lighter)
        ctx.fillStyle = 'rgba(124, 58, 237, 0.32)';
        ctx.beginPath();
        ctx.arc(-12, 6, 6, Math.PI * 0.0, Math.PI * 1.0);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(12, 6, 6, Math.PI * 0.0, Math.PI * 1.0);
        ctx.fill();

        ctx.restore();
      } else {
        // Normal white eyes
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.ellipse(-12, 3, 8, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(12, 3, 8, 9, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pupils — track mouse position relative to avatar position in window
        // Default/start position: top-right corner of eyes
        ctx.fillStyle = '#1E1B4B';
        const maxOffset = 3.5; // max pupil travel distance

        // Calculate pupil position based on normalized mouse direction
        // nx/ny come from eyeTarget which is already normalized to -1..1
        let pupilOffsetX = nx * maxOffset;
        let pupilOffsetY = ny * maxOffset;

        // If no mouse interaction yet, default to top-right
        if (nx === 0 && ny === 0) {
          pupilOffsetX = maxOffset * 0.8; // right
          pupilOffsetY = -maxOffset * 0.6; // up
        }

        const leftEyeX = -10 + pupilOffsetX;
        const leftEyeY = 4 + pupilOffsetY;
        const rightEyeX = 14 + pupilOffsetX;
        const rightEyeY = 4 + pupilOffsetY;

        ctx.beginPath();
        ctx.ellipse(leftEyeX, leftEyeY, 4, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(rightEyeX, rightEyeY, 4, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eye shine (white dot)
        // Position depends on avatar location: if avatar is on right side of screen, shine is top-left, otherwise top-right
        const shineOnLeft = avatarPosXNormalized > 0.1; // avatar is on right side of screen
        const shineOffsetX = shineOnLeft ? -1.8 : 1.8; // left or right
        const shineOffsetY = -2.0; // always up
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(
          leftEyeX + shineOffsetX,
          leftEyeY + shineOffsetY,
          1.5,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.beginPath();
        ctx.arc(
          rightEyeX + shineOffsetX,
          rightEyeY + shineOffsetY,
          1.5,
          0,
          Math.PI * 2
        );
        ctx.fill();

        // Optional debug overlay: show normalized avatar pos and pupil info
        try {
          if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.get('debug_eyes') === '1') {
              const absPosDbg = Math.abs(avatarPosXNormalized);
              const cornerThresholdDbg = 0.6;
              const cornerStrengthDbg = Math.min(
                1,
                absPosDbg / cornerThresholdDbg
              );
              ctx.save();
              // background box
              ctx.fillStyle = 'rgba(0,0,0,0.5)';
              ctx.fillRect(-width / 2 + 8, -height / 2 + 8, 220, 60);
              ctx.fillStyle = 'white';
              ctx.font = '10px sans-serif';
              ctx.fillText(
                `avatarPosX: ${avatarPosXNormalized.toFixed(2)}`,
                -width / 2 + 14,
                -height / 2 + 26
              );
              ctx.fillText(
                `cornerStrength: ${cornerStrengthDbg.toFixed(2)}`,
                -width / 2 + 14,
                -height / 2 + 42
              );
              ctx.fillText(
                `eyeTarget: ${nx.toFixed(2)}, ${ny.toFixed(2)}`,
                -width / 2 + 14,
                -height / 2 + 58
              );
              ctx.restore();
            }
          }
        } catch {
          // ignore debug overlay errors
        }
      }

      // Nose
      ctx.fillStyle = '#7C3AED';
      ctx.beginPath();
      ctx.ellipse(0, 11, 3, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Smile
      ctx.strokeStyle = '#7C3AED';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, 17, 7, 0, Math.PI);
      ctx.stroke();

      ctx.restore();
    };

    const targetFPS =
      qualitySettings.targetFps > 0 ? qualitySettings.targetFps : 30;
    const frameInterval = 1000 / targetFPS;

    const animate = (timestamp: number = 0) => {
      const animationActive =
        shouldAnimate && qualitySettings.animationsEnabled;
      if (animationActive) {
        const elapsed = timestamp - lastFrameTimeRef.current;
        if (elapsed < frameInterval) {
          animationRef.current = requestAnimationFrame(animate);
          return;
        }
        lastFrameTimeRef.current = timestamp - (elapsed % frameInterval);
      } else if (hasStaticFrameRef.current) {
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // Update animation state
      const time = animationActive ? timestamp * 0.001 : lastSecondsRef.current;
      lastSecondsRef.current = time;

      // Breathing animation (gentle up/down movement)
      // Scale breathing amplitude with canvas size so it's visible on large
      // landing instances while staying subtle on small UI avatars.
      const maxBreathAmplitude = Math.min(width, height) / 80; // e.g., 400 -> 5
      let breathAmplitude =
        animationActive && qualitySettings.breathScale > 0
          ? Math.max(0, Math.min(8, maxBreathAmplitude)) *
            qualitySettings.breathScale
          : 0;
      // Respect user-level reduced motion preference
      try {
        if (typeof window !== 'undefined' && window.matchMedia) {
          if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            breathAmplitude = 0;
          }
        }
      } catch {
        // ignore
      }

      const breath =
        animationActive && breathAmplitude > 0
          ? Math.sin(time * 2) * breathAmplitude
          : 0;

      // Eye blinking (random blinks) — less frequent but longer "fluffy" blinks
      const blinkChance = 0.004 * Math.max(0.35, qualitySettings.breathScale);
      const shouldBlink = animationActive && Math.random() < blinkChance;
      if (shouldBlink) {
        blinkTimeRef.current = time + 0.28; // Blink for 280ms (longer, fluffier)
      }
      const isBlinking = animationActive && time < blinkTimeRef.current;

      // Eye tracking (smooth follow) - eyes look towards the mouse relative to avatar position
      if (enableEyeTracking) {
        const eyeSpeed = 0.2;
        const rect = canvas.getBoundingClientRect();
        const avatarCenterX = rect.left + rect.width / 2;
        const avatarCenterY = rect.top + rect.height / 2;
        const mouseX = mouseRef.current.x;
        const mouseY = mouseRef.current.y;

        // Vector from avatar center to mouse
        const dx = mouseX - avatarCenterX;
        const dy = mouseY - avatarCenterY;

        // Normalize to -1..1 based on screen size for consistent eye movement
        const normalizedDX = dx / (window.innerWidth / 2);
        const normalizedDY = dy / (window.innerHeight / 2);

        // Clamp to reasonable range
        const clampedDX = Math.max(-1, Math.min(1, normalizedDX));
        const clampedDY = Math.max(-1, Math.min(1, normalizedDY));

        // Smooth towards the target (scale to match expected range)
        const half = Math.min(width, height) / 2;
        eyeTargetRef.current = {
          x:
            eyeTargetRef.current.x +
            (clampedDX * half - eyeTargetRef.current.x) * eyeSpeed,
          y:
            eyeTargetRef.current.y +
            (clampedDY * half - eyeTargetRef.current.y) * eyeSpeed,
        };
      } else {
        eyeTargetRef.current = {
          x: eyeTargetRef.current.x * 0.9,
          y: eyeTargetRef.current.y * 0.9,
        };
      }

      // Determine normalized avatar X position (-1 left .. 1 right)
      const canvasRect = canvas.getBoundingClientRect();
      const avatarPosXNormalizedRaw =
        (canvasRect.left + canvasRect.width / 2 - window.innerWidth / 2) /
          (window.innerWidth / 2) || 0;
      const avatarPosXNormalized = Math.max(
        -1,
        Math.min(1, avatarPosXNormalizedRaw)
      );

      // Draw background particles if any
      for (let i = 0; i < particlesRef.current.length; i++) {
        if (i >= effectiveParticleCount) {
          break;
        }
        const p = particlesRef.current[i];
        // Edge fading logic to prevent hard cutoffs
        // Increased margin and added a quadratic falloff for a MUCH sharper fadeout
        const marginX = Math.min(width * 0.25, 60);
        const marginY = Math.min(height * 0.25, 60);
        let edgeAlpha = 1.0;

        if (p.x < marginX) edgeAlpha *= Math.pow(p.x / marginX, 2);
        else if (p.x > width - marginX)
          edgeAlpha *= Math.pow((width - p.x) / marginX, 2);

        if (p.y < marginY) edgeAlpha *= Math.pow(p.y / marginY, 2);
        else if (p.y > height - marginY)
          edgeAlpha *= Math.pow((height - p.y) / marginY, 2);

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha * edgeAlpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Update particle position for next frame
        if (animationActive) {
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= p.decay;

          // Bounce logic instead of wrap-around
          if (p.x < 0) {
            p.x = 0;
            p.vx *= -1;
          } else if (p.x > width) {
            p.x = width;
            p.vx *= -1;
          }

          if (p.y < 0) {
            p.y = 0;
            p.vy *= -1;
          } else if (p.y > height) {
            p.y = height;
            p.vy *= -1;
          }

          if (p.alpha <= 0) {
            Object.assign(p, createParticle());
          }
        }
      }
      if (particlesRef.current.length > effectiveParticleCount) {
        particlesRef.current.length = effectiveParticleCount;
      }

      // Draw Fluxby avatar filling the canvas with animations
      // Centered more precisely and moved UP slightly to prevent shadow cutoff
      drawFluxbyAvatar(
        ctx,
        width / 2,
        height / 2 - 2 + breath,
        Math.min(width, height),
        isBlinking,
        eyeTargetRef.current,
        time,
        avatarPosXNormalized
      );

      if (animationActive) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        hasStaticFrameRef.current = true;
      }
    };

    if (!isInView) {
      ctx.clearRect(0, 0, width, height);
      return;
    }

    if (!qualitySettings.animationsEnabled || !animated) {
      animate(0);
      return;
    }

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [
    width,
    height,
    initParticles,
    createParticle,
    animated,
    shouldAnimate,
    enableEyeTracking,
    effectiveParticleCount,
    qualitySettings,
    isInView,
  ]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!enableEyeTracking) return;
      // store absolute client coordinates (used for both local and window-relative signals)
      mouseRef.current = { x: e.clientX, y: e.clientY };
    },
    [enableEyeTracking]
  );

  // Global mouse listener so eyes follow even when cursor is outside canvas
  useEffect(() => {
    if (!enableEyeTracking) return;
    const handler = (e: MouseEvent) => {
      // store absolute client coords
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, [enableEyeTracking]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!interactive || effectiveParticleCount <= 0) return;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        // Add burst of particles on click
        for (let i = 0; i < 5; i++) {
          particlesRef.current.push(createParticle(x, y));
        }
        // Keep particle count manageable
        const maxParticles = Math.max(effectiveParticleCount, 1) * 2;
        while (particlesRef.current.length > maxParticles) {
          particlesRef.current.shift();
        }
      }
    },
    [interactive, createParticle, effectiveParticleCount]
  );

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width, height }}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
    />
  );
}

/**
 * FluxbyGlow - A simpler CSS-based glow effect for when WebGL is too heavy
 */
export function FluxbyGlow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      {/* Animated glow rings */}
      <div className='pointer-events-none absolute inset-0 flex items-center justify-center'>
        <div className='absolute h-full w-full animate-pulse rounded-full bg-violet-400/20' />
        <div
          className='absolute h-[120%] w-[120%] animate-ping rounded-full bg-violet-400/10'
          style={{ animationDuration: '2s' }}
        />
      </div>
      {/* Content */}
      <div className='relative z-10'>{children}</div>
    </div>
  );
}

export default FluxbyWebGL;
