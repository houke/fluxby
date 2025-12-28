// Spotlight overlay component for onboarding
// Creates a blurred backdrop with a "hole" that highlights the target element
// Uses CSS box-shadow technique for smooth animated spotlight effect

import { useEffect, useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';

interface SpotlightOverlayProps {
  targetSelector?: string;
  isActive: boolean;
  padding?: number;
  borderRadius?: number;
  transitionDuration?: number;
  onOverlayClick?: () => void;
}

interface SpotlightRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function SpotlightOverlay({
  targetSelector,
  isActive,
  padding = 8,
  borderRadius = 12,
  transitionDuration = 300,
  onOverlayClick,
}: SpotlightOverlayProps) {
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(
    null
  );
  const [isVisible, setIsVisible] = useState(false);
  // Keep track of the last valid rect to prevent jumping during re-renders
  const lastValidRectRef = useRef<SpotlightRect | null>(null);

  // Calculate the position of the target element
  const updateSpotlight = useCallback(() => {
    if (!targetSelector) {
      // Only clear if we're intentionally removing the selector
      lastValidRectRef.current = null;
      setSpotlightRect(null);
      return;
    }

    const element = document.querySelector(targetSelector);
    if (!element) {
      // Element not found - keep the last known position during re-renders
      // This prevents the spotlight from jumping to null and back
      return;
    }

    const rect = element.getBoundingClientRect();

    // Add padding around the element
    const newRect = {
      x: rect.left - padding,
      y: rect.top - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    };

    // Only update if the position has actually changed significantly
    // This prevents unnecessary re-renders from tiny floating point differences
    const hasSignificantChange =
      !lastValidRectRef.current ||
      Math.abs(newRect.x - lastValidRectRef.current.x) > 0.5 ||
      Math.abs(newRect.y - lastValidRectRef.current.y) > 0.5 ||
      Math.abs(newRect.width - lastValidRectRef.current.width) > 0.5 ||
      Math.abs(newRect.height - lastValidRectRef.current.height) > 0.5;

    if (hasSignificantChange) {
      lastValidRectRef.current = newRect;
      setSpotlightRect(newRect);
    }

    // Scroll element into view if needed
    const isInViewport =
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth;

    if (!isInViewport) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      });
    }
  }, [targetSelector, padding]);

  // Set up visibility and updates
  useEffect(() => {
    if (isActive) {
      setIsVisible(true);
      // Small delay to ensure DOM is ready
      const timer = setTimeout(updateSpotlight, 50);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      lastValidRectRef.current = null;
      setSpotlightRect(null);
    }
  }, [isActive, updateSpotlight]);

  // Update spotlight on resize or scroll
  useEffect(() => {
    if (!isActive) return;

    const handleUpdate = () => updateSpotlight();

    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate, true);

    // Also update when targetSelector changes
    // Use requestAnimationFrame for smoother updates
    requestAnimationFrame(updateSpotlight);

    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate, true);
    };
  }, [isActive, targetSelector, updateSpotlight]);

  if (!isVisible) return null;

  // Generate a unique ID for the SVG mask
  const maskId = 'spotlight-mask';

  // Use SVG mask for the dark overlay to support rounded corners in the cutout
  return (
    <div
      className={cn(
        'fixed inset-0 z-[9998] transition-opacity',
        isVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
      )}
      style={{
        transitionDuration: `${transitionDuration}ms`,
      }}
      onClick={onOverlayClick}
    >
      {/* SVG for mask definition */}
      <svg
        className='pointer-events-none absolute inset-0 h-full w-full'
        style={{ position: 'absolute', width: '100%', height: '100%' }}
      >
        <defs>
          <mask id={maskId}>
            {/* White = visible, black = hidden */}
            <rect x='0' y='0' width='100%' height='100%' fill='white' />
            {/* Rounded rectangle cutout */}
            {spotlightRect && (
              <rect
                x={spotlightRect.x}
                y={spotlightRect.y}
                width={spotlightRect.width}
                height={spotlightRect.height}
                rx={borderRadius}
                ry={borderRadius}
                fill='black'
                style={{
                  transition: `x ${transitionDuration}ms ease-in-out, y ${transitionDuration}ms ease-in-out, width ${transitionDuration}ms ease-in-out, height ${transitionDuration}ms ease-in-out`,
                }}
              />
            )}
          </mask>
        </defs>
        {/* Dark overlay with mask applied */}
        <rect
          x='0'
          y='0'
          width='100%'
          height='100%'
          fill='rgba(0, 0, 0, 0.6)'
          mask={`url(#${maskId})`}
        />
      </svg>
      {/* Purple glow border around spotlight */}
      <div
        className='pointer-events-none absolute'
        style={{
          left: spotlightRect?.x ?? window.innerWidth / 2,
          top: spotlightRect?.y ?? window.innerHeight / 2,
          width: spotlightRect?.width ?? 0,
          height: spotlightRect?.height ?? 0,
          borderRadius: borderRadius,
          // Use border and box-shadow for the purple glow (respects border-radius)
          border: '3px solid rgba(147, 51, 234, 0.6)',
          boxShadow: `
            0 0 20px rgba(147, 51, 234, 0.4),
            0 0 40px rgba(147, 51, 234, 0.2),
            inset 0 0 20px rgba(147, 51, 234, 0.1)
          `,
          transition: `left ${transitionDuration}ms ease-in-out, top ${transitionDuration}ms ease-in-out, width ${transitionDuration}ms ease-in-out, height ${transitionDuration}ms ease-in-out`,
        }}
      />
    </div>
  );
}
