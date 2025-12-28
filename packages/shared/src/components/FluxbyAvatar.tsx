import { SVGProps } from 'react';

interface FluxbyAvatarProps extends SVGProps<SVGSVGElement> {
  size?: number;
  showGlow?: boolean;
}

/**
 * Fluxby - A cute fluffy finance avatar
 * A friendly, approachable mascot for the finance app
 */
export function FluxbyAvatar({
  size = 48,
  showGlow = false,
  className,
  ...props
}: FluxbyAvatarProps) {
  return (
    <svg
      viewBox='0 0 100 100'
      width={size}
      height={size}
      className={className}
      {...props}
    >
      <defs>
        {/* Main body gradient - soft purple to pink */}
        <radialGradient id='fluxby-body' cx='50%' cy='40%' r='60%'>
          <stop offset='0%' stopColor='#C4B5FD' />
          <stop offset='50%' stopColor='#A78BFA' />
          <stop offset='100%' stopColor='#8B5CF6' />
        </radialGradient>

        {/* Belly highlight */}
        <radialGradient id='fluxby-belly' cx='50%' cy='50%' r='50%'>
          <stop offset='0%' stopColor='#F5F3FF' />
          <stop offset='100%' stopColor='#DDD6FE' />
        </radialGradient>

        {/* Cheek blush */}
        <radialGradient id='fluxby-blush' cx='50%' cy='50%' r='50%'>
          <stop offset='0%' stopColor='#FDA4AF' stopOpacity='0.7' />
          <stop offset='100%' stopColor='#FDA4AF' stopOpacity='0' />
        </radialGradient>

        {/* Glow effect */}
        {showGlow && (
          <filter id='fluxby-glow' x='-50%' y='-50%' width='200%' height='200%'>
            <feGaussianBlur stdDeviation='3' result='coloredBlur' />
            <feMerge>
              <feMergeNode in='coloredBlur' />
              <feMergeNode in='SourceGraphic' />
            </feMerge>
          </filter>
        )}

        {/* Fluffy fur texture */}
        <filter id='fluxby-fluffy' x='-10%' y='-10%' width='120%' height='120%'>
          <feTurbulence
            type='fractalNoise'
            baseFrequency='0.9'
            numOctaves='3'
            result='noise'
          />
          <feDisplacementMap
            in='SourceGraphic'
            in2='noise'
            scale='2'
            xChannelSelector='R'
            yChannelSelector='G'
          />
        </filter>
      </defs>

      {/* Outer glow */}
      {showGlow && (
        <ellipse
          cx='50'
          cy='55'
          rx='38'
          ry='35'
          fill='#A78BFA'
          opacity='0.3'
          filter='url(#fluxby-glow)'
        />
      )}

      {/* Main fluffy body */}
      <ellipse cx='50' cy='55' rx='35' ry='32' fill='url(#fluxby-body)' />

      {/* Fluffy fur tufts around body */}
      <g fill='url(#fluxby-body)'>
        {/* Top tufts */}
        <circle cx='30' cy='28' r='8' />
        <circle cx='50' cy='22' r='9' />
        <circle cx='70' cy='28' r='8' />

        {/* Side tufts */}
        <circle cx='18' cy='45' r='7' />
        <circle cx='82' cy='45' r='7' />
        <circle cx='20' cy='60' r='6' />
        <circle cx='80' cy='60' r='6' />

        {/* Bottom tufts */}
        <circle cx='30' cy='82' r='6' />
        <circle cx='50' cy='85' r='7' />
        <circle cx='70' cy='82' r='6' />
      </g>

      {/* Cute little ears */}
      <ellipse
        cx='28'
        cy='25'
        rx='8'
        ry='12'
        fill='url(#fluxby-body)'
        transform='rotate(-20 28 25)'
      />
      <ellipse
        cx='72'
        cy='25'
        rx='8'
        ry='12'
        fill='url(#fluxby-body)'
        transform='rotate(20 72 25)'
      />

      {/* Inner ears */}
      <ellipse
        cx='28'
        cy='25'
        rx='4'
        ry='7'
        fill='#DDD6FE'
        transform='rotate(-20 28 25)'
      />
      <ellipse
        cx='72'
        cy='25'
        rx='4'
        ry='7'
        fill='#DDD6FE'
        transform='rotate(20 72 25)'
      />

      {/* Belly */}
      <ellipse cx='50' cy='60' rx='20' ry='18' fill='url(#fluxby-belly)' />

      {/* Eyes */}
      <g>
        {/* Left eye white */}
        <ellipse cx='38' cy='48' rx='8' ry='9' fill='white' />
        {/* Left eye pupil */}
        <ellipse cx='39' cy='49' rx='4' ry='5' fill='#1E1B4B' />
        {/* Left eye shine */}
        <circle cx='41' cy='46' r='2' fill='white' />

        {/* Right eye white */}
        <ellipse cx='62' cy='48' rx='8' ry='9' fill='white' />
        {/* Right eye pupil */}
        <ellipse cx='63' cy='49' rx='4' ry='5' fill='#1E1B4B' />
        {/* Right eye shine */}
        <circle cx='65' cy='46' r='2' fill='white' />
      </g>

      {/* Blush marks */}
      <ellipse cx='26' cy='58' rx='6' ry='4' fill='url(#fluxby-blush)' />
      <ellipse cx='74' cy='58' rx='6' ry='4' fill='url(#fluxby-blush)' />

      {/* Cute little nose */}
      <ellipse cx='50' cy='56' rx='3' ry='2.5' fill='#7C3AED' />

      {/* Smile */}
      <path
        d='M 43 62 Q 50 68, 57 62'
        fill='none'
        stroke='#7C3AED'
        strokeWidth='2'
        strokeLinecap='round'
      />

      {/* Piggy bank slot on top */}
      <rect
        x='46'
        y='8'
        width='8'
        height='6'
        rx='1'
        fill='#FBBF24'
        stroke='#F59E0B'
        strokeWidth='1'
      />
      <rect x='47.5' y='9.5' width='5' height='3' rx='0.5' fill='#92400E' />

      {/* Coin dropping into slot (half visible) */}
      <circle
        cx='50'
        cy='18'
        r='8'
        fill='#FBBF24'
        stroke='#F59E0B'
        strokeWidth='1'
      />
      <text
        x='50'
        y='22'
        textAnchor='middle'
        fill='#92400E'
        fontSize='10'
        fontWeight='bold'
        fontFamily='Arial'
      >
        €
      </text>
      {/* Mask to hide bottom half of coin */}
      <rect x='42' y='18' width='16' height='8' fill='url(#fluxby-body)' />

      {/* Little feet */}
      <ellipse cx='38' cy='88' rx='8' ry='4' fill='#A78BFA' />
      <ellipse cx='62' cy='88' rx='8' ry='4' fill='#A78BFA' />

      {/* Little feet */}
      <ellipse cx='38' cy='88' rx='8' ry='4' fill='#A78BFA' />
      <ellipse cx='62' cy='88' rx='8' ry='4' fill='#A78BFA' />
    </svg>
  );
}

/**
 * Simple Fluxby icon for small sizes (favicon, etc.)
 */
export function FluxbyIcon({
  size = 32,
  className,
  ...props
}: FluxbyAvatarProps) {
  return (
    <svg
      viewBox='0 0 100 100'
      width={size}
      height={size}
      className={className}
      {...props}
    >
      <defs>
        <radialGradient id='fluxby-icon-body' cx='50%' cy='40%' r='60%'>
          <stop offset='0%' stopColor='#C4B5FD' />
          <stop offset='50%' stopColor='#A78BFA' />
          <stop offset='100%' stopColor='#8B5CF6' />
        </radialGradient>
        <radialGradient id='fluxby-icon-belly' cx='50%' cy='50%' r='50%'>
          <stop offset='0%' stopColor='#F5F3FF' />
          <stop offset='100%' stopColor='#DDD6FE' />
        </radialGradient>
      </defs>

      {/* Simple round fluffy body */}
      <circle cx='50' cy='52' r='40' fill='url(#fluxby-icon-body)' />

      {/* Ears */}
      <circle cx='22' cy='22' r='14' fill='url(#fluxby-icon-body)' />
      <circle cx='78' cy='22' r='14' fill='url(#fluxby-icon-body)' />
      <circle cx='22' cy='22' r='7' fill='#DDD6FE' />
      <circle cx='78' cy='22' r='7' fill='#DDD6FE' />

      {/* Belly */}
      <ellipse cx='50' cy='58' rx='22' ry='20' fill='url(#fluxby-icon-belly)' />

      {/* Eyes */}
      <ellipse cx='38' cy='45' rx='6' ry='7' fill='white' />
      <ellipse cx='62' cy='45' rx='6' ry='7' fill='white' />
      <circle cx='40' cy='46' r='3' fill='#1E1B4B' />
      <circle cx='64' cy='46' r='3' fill='#1E1B4B' />
      <circle cx='41' cy='44' r='1.5' fill='white' />
      <circle cx='65' cy='44' r='1.5' fill='white' />

      {/* Nose */}
      <ellipse cx='50' cy='54' rx='3' ry='2' fill='#7C3AED' />

      {/* Smile */}
      <path
        d='M 44 60 Q 50 65, 56 60'
        fill='none'
        stroke='#7C3AED'
        strokeWidth='2'
        strokeLinecap='round'
      />

      {/* Piggy bank slot on top */}
      <rect
        x='46'
        y='15'
        width='8'
        height='6'
        rx='1'
        fill='#FBBF24'
        stroke='#F59E0B'
        strokeWidth='1'
      />
      <rect x='47.5' y='16.5' width='5' height='3' rx='0.5' fill='#92400E' />

      {/* Coin dropping into slot (half visible) */}
      <circle
        cx='50'
        cy='25'
        r='8'
        fill='#FBBF24'
        stroke='#F59E0B'
        strokeWidth='1'
      />
      <text
        x='50'
        y='29'
        textAnchor='middle'
        fill='#92400E'
        fontSize='10'
        fontWeight='bold'
        fontFamily='Arial'
      >
        €
      </text>
      {/* Mask to hide bottom half of coin */}
      <rect x='42' y='25' width='16' height='8' fill='url(#body)' />
    </svg>
  );
}

export default FluxbyAvatar;
