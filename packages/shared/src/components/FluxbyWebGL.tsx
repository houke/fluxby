import { useEffect, useRef, useCallback } from 'react';

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

  const createParticle = useCallback(
    (x?: number, y?: number): Particle => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.2 + Math.random() * 0.5;
      return {
        x: x ?? Math.random() * width,
        y: y ?? Math.random() * height,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 6,
        color: FLUXBY_COLORS[Math.floor(Math.random() * FLUXBY_COLORS.length)],
        alpha: 0.3 + Math.random() * 0.5,
        decay: 0.001 + Math.random() * 0.002,
      };
    },
    [width, height]
  );

  const initParticles = useCallback(() => {
    particlesRef.current = Array.from({ length: particleCount }, () =>
      createParticle(undefined, undefined)
    );
  }, [particleCount, createParticle]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set up canvas for high DPI displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    initParticles();

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
      const scale = size / 100; // Base size is 100

      // Add subtle 3D movement based on mouse position (normalized, no scaling)
      const half = Math.max(1, size / 2);
      const nx = Math.max(-1, Math.min(1, eyeTarget.x / half));
      const ny = Math.max(-1, Math.min(1, eyeTarget.y / half));
      const tiltX = nx * 0.04; // Small rotation based on horizontal mouse
      const tiltY = ny * 0.02; // Small vertical tilt

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.scale(scale, scale);
      ctx.rotate(tiltX);

      // Add 3D shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 1 + tiltX * 8;
      ctx.shadowOffsetY = 3 + tiltY * 8;

      // Main body - soft purple gradient with 3D lighting
      const bodyGradient = ctx.createRadialGradient(
        -15 + tiltX * 20,
        -20 + tiltY * 20,
        0, // Light source position (top-left)
        0,
        10,
        35
      );
      bodyGradient.addColorStop(0, '#D1BFFF'); // Softer highlight
      bodyGradient.addColorStop(0.4, '#C4B5FD');
      bodyGradient.addColorStop(0.8, '#A78BFA');
      bodyGradient.addColorStop(1, '#8B5CF6'); // Softer shadow side

      ctx.fillStyle = bodyGradient;
      ctx.beginPath();
      ctx.ellipse(0, 10, 35, 32, 0, 0, Math.PI * 2);
      ctx.fill();

      // Add fluffy texture with small circles around the body edge
      // Slight texture breathing — base value scaled up when canvas is large
      // Subtle edge/texture breathing scaled for larger avatars (size is min(width,height))
      const breathPhase =
        Math.sin(time * 2) * Math.max(0.25, Math.min(4, size / 80));
      for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2;
        const radius = 3 + (Math.sin(i * 0.5) + 1) * 1.5 + breathPhase;
        const x = Math.cos(angle) * 34;
        const y = Math.sin(angle) * 31 + 10;

        ctx.fillStyle = bodyGradient;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      // 3D highlight on body
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.ellipse(-15, -5, 12, 8, -Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();

      // Belly with 3D lighting
      const bellyGradient = ctx.createRadialGradient(
        -5 + tiltX * 10,
        5 + tiltY * 10,
        0,
        0,
        15,
        20
      );
      bellyGradient.addColorStop(0, '#F8F7FF'); // Softer highlight
      bellyGradient.addColorStop(0.6, '#F5F3FF');
      bellyGradient.addColorStop(1, '#E9D5FF'); // Softer shadow side
      ctx.fillStyle = bellyGradient;
      ctx.beginPath();
      ctx.ellipse(0, 15, 20, 18, 0, 0, Math.PI * 2);
      ctx.fill();

      // 3D highlight on belly
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.ellipse(-8, 10, 6, 4, -Math.PI / 6, 0, Math.PI * 2);
      ctx.fill();

      // Reddish blush cheeks - soften core and favor blurred halo
      // Smaller, less opaque core
      ctx.fillStyle = 'rgba(255, 90, 110, 0.25)';
      ctx.beginPath();
      ctx.ellipse(-20, 14, 2.5, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(20, 14, 2.5, 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Soft halo (blurred) for smooth blending into body
      // Reduced width and blur for a subtler look
      const blushGradient = ctx.createRadialGradient(-20, 14, 0, -20, 14, 10);
      blushGradient.addColorStop(0, 'rgba(255, 100, 120, 0.55)');
      blushGradient.addColorStop(0.6, 'rgba(255, 100, 120, 0.22)');
      blushGradient.addColorStop(1, 'rgba(255, 100, 120, 0)');
      ctx.save();
      ctx.fillStyle = blushGradient;
      ctx.beginPath();
      ctx.ellipse(-20, 14, 9, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      // Right cheek gradient (narrower)
      const blushGradientR = ctx.createRadialGradient(20, 14, 0, 20, 14, 10);
      blushGradientR.addColorStop(0, 'rgba(255, 100, 120, 0.55)');
      blushGradientR.addColorStop(0.6, 'rgba(255, 100, 120, 0.22)');
      blushGradientR.addColorStop(1, 'rgba(255, 100, 120, 0)');
      ctx.fillStyle = blushGradientR;
      ctx.beginPath();
      ctx.ellipse(20, 14, 9, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Clear shadow for facial features
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Ears (drawn LAST to be on top of everything)
      // Use a single solid fill color to avoid the body radial gradient
      // bleeding into the ear shapes and creating a circular artifact.
      ctx.fillStyle = '#A78BFA'; // uniform ear color
      ctx.beginPath();
      ctx.ellipse(-18, -15, 8, 12, -Math.PI / 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(18, -15, 8, 12, Math.PI / 6, 0, Math.PI * 2);
      ctx.fill();

      // Inner ears
      ctx.fillStyle = '#DDD6FE';
      ctx.beginPath();
      ctx.ellipse(-18, -15, 4, 7, -Math.PI / 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(18, -15, 4, 7, Math.PI / 6, 0, Math.PI * 2);
      ctx.fill();

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

    const targetFPS = 30;
    const frameInterval = 1000 / targetFPS;

    const animate = (timestamp: number = 0) => {
      // Throttle to 30fps for better performance
      const elapsed = timestamp - lastFrameTimeRef.current;
      if (elapsed < frameInterval) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      lastFrameTimeRef.current = timestamp - (elapsed % frameInterval);

      ctx.clearRect(0, 0, width, height);

      // Update animation state
      const time = animated ? timestamp * 0.001 : 0; // Convert to seconds

      // Breathing animation (gentle up/down movement)
      // Scale breathing amplitude with canvas size so it's visible on large
      // landing instances while staying subtle on small UI avatars.
      let breathAmplitude = animated ? Math.min(width, height) / 80 : 0; // e.g., 400 -> 5
      breathAmplitude = Math.max(0, Math.min(8, breathAmplitude));
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

      const breath = animated ? Math.sin(time * 2) * breathAmplitude : 0;

      // Eye blinking (random blinks) — less frequent but longer "fluffy" blinks
      const shouldBlink = animated && Math.random() < 0.004; // ~0.4% chance per frame
      if (shouldBlink) {
        blinkTimeRef.current = time + 0.28; // Blink for 280ms (longer, fluffier)
      }
      const isBlinking = animated && time < blinkTimeRef.current;

      // Eye tracking (smooth follow) - eyes look towards the mouse relative to avatar position
      if (interactive) {
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

      // Draw Fluxby avatar filling the canvas with animations
      drawFluxbyAvatar(
        ctx,
        width / 2,
        height / 2 - 5 + breath,
        Math.min(width, height),
        isBlinking,
        eyeTargetRef.current,
        time,
        avatarPosXNormalized
      );

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [
    width,
    height,
    particleCount,
    initParticles,
    createParticle,
    interactive,
    animated,
  ]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!interactive) return;
      // store absolute client coordinates (used for both local and window-relative signals)
      mouseRef.current = { x: e.clientX, y: e.clientY };
    },
    [interactive]
  );

  // Global mouse listener so eyes follow even when cursor is outside canvas
  useEffect(() => {
    if (!interactive) return;
    const handler = (e: MouseEvent) => {
      // store absolute client coords
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, [interactive]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!interactive) return;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        // Add burst of particles on click
        for (let i = 0; i < 5; i++) {
          particlesRef.current.push(createParticle(x, y));
        }
        // Keep particle count manageable
        while (particlesRef.current.length > particleCount * 2) {
          particlesRef.current.shift();
        }
      }
    },
    [interactive, createParticle, particleCount]
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
