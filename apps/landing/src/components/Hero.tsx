import { Link } from 'react-router-dom';
import { FluxbyWebGL } from '@fluxby/shared';
import { useState, useMemo, CSSProperties, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

// Extended CSSProperties to support CSS custom properties
type CustomCSSProperties = CSSProperties & {
  '--tx0'?: string;
  '--ty0'?: string;
  '--tx1'?: string;
  '--ty1'?: string;
  '--s0'?: string;
  '--s1'?: string;
  '--o0'?: string;
  '--o1'?: string;
  '--emoji-duration'?: string;
  '--emoji-delay'?: string;
  '--emoji-ease'?: string;
  '--emoji-dir'?: string;
  '--r0'?: string;
  '--r1'?: string;
};

// Proper bokeh CSS effect using layered blur circles with smooth animations
const bokehStyles = `
  @keyframes bokehFloat {
    0%, 100% { transform: translate(0, 0) scale(1); }
    25% { transform: translate(10px, -15px) scale(1.05); }
    50% { transform: translate(-5px, 10px) scale(0.95); }
    75% { transform: translate(-10px, -5px) scale(1.02); }
  }

  @keyframes bokehPulse {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 0.5; }
  }

  @keyframes bokehDrift {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-20px); }
  }

  @keyframes scrollBounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(8px); }
  }

  @keyframes scrollWheel {
    0% { transform: translateY(0); opacity: 1; }
    100% { transform: translateY(6px); opacity: 0; }
  }

  @keyframes emojiPulse {
    0%, 100% { opacity: 0.85; }
    50% { opacity: 1; }
  }

  .bokeh-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(40px);
    mix-blend-mode: screen;
    pointer-events: none;
  }

  .bokeh-float { animation: bokehFloat 20s ease-in-out infinite; }
  .bokeh-pulse { animation: bokehPulse 8s ease-in-out infinite; }
  .bokeh-drift { animation: bokehDrift 15s ease-in-out infinite; }
  .bokeh-float-delayed { animation: bokehFloat 25s ease-in-out infinite; animation-delay: -5s; }
    /* Automated emoji animation (slow, randomized pulse + tiny motion) */
    @keyframes emojiAuto {
      0%, 100% {
        transform: translate(var(--tx0, 0px), var(--ty0, 0px)) rotate(var(--r0, 0deg)) scale(var(--s0, 1));
        opacity: var(--o0, 1);
      }
      50% {
        transform: translate(var(--tx1, 0px), var(--ty1, 0px)) rotate(var(--r1, 0deg)) scale(var(--s1, 1));
        opacity: var(--o1, 0.25);
      }
    }

    .emoji-float {
      animation-name: emojiAuto;
      animation-timing-function: var(--emoji-ease, ease-in-out);
      animation-iteration-count: infinite;
      animation-duration: var(--emoji-duration, 20s);
      animation-delay: var(--emoji-delay, 0s);
      animation-direction: var(--emoji-dir, alternate);
      animation-fill-mode: both;
      will-change: transform, opacity;
      display: inline-block;
      transform-origin: center;
    }
  .scroll-mouse {
    width: 26px;
    height: 42px;
    border: 2px solid rgba(255, 255, 255, 0.7);
    border-radius: 13px;
    position: relative;
    animation: scrollBounce 2s ease-in-out infinite;
    display: flex;
    justify-content: center;
  }

  .scroll-mouse::before {
    content: '';
    position: absolute;
    top: 8px;
    left: 50%;
    margin-left: -2px;
    width: 4px;
    height: 8px;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 2px;
    animation: scrollWheel 1.5s ease-in-out infinite;
  }
`;

const Hero = () => {
  const { t, language, setLanguage, languages } = useLanguage();
  const appHref = `${import.meta.env.BASE_URL}app/`;

  // Category emojis - static list of common financial category icons
  const categoryEmojis = useMemo(
    () => [
      '🛒', // groceries
      '☕', // coffee
      '🚗', // transport
      '🧾', // bills
      '🎬', // entertainment
      '🏠', // home
      '💡', // utilities
      '💖', // heart
      '💰', // money
      '⭐', // star
    ],
    []
  );

  // Random rotation offset for the emoji cloud so it looks different each time
  const [rotationOffset] = useState(() => Math.random() * Math.PI * 2);

  // Responsive dimensions state
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const baseRadius = isMobile ? 140 : 220;
  const avatarSize = isMobile ? 280 : 400;

  // We no longer use mouse-driven parallax; instead compute per-emoji
  // randomized animation parameters (kept stable while categories are stable)
  // Improve randomness and de-synchronization: expand ranges and add easing/rotation
  const emojiConfigs = useMemo(() => {
    const rand = (min: number, max: number) =>
      Math.random() * (max - min) + min;
    const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
    const easings = [
      'cubic-bezier(0.25, 0.1, 0.25, 1)',
      'cubic-bezier(0.3, 0.7, 0.4, 0.9)',
      'cubic-bezier(.2,.9,.3,.95)',
      'cubic-bezier(.4,.0,.2,1)',
    ];
    return categoryEmojis.map((_) => {
      const tx0 = `${Math.round(rand(-8, 8))}px`;
      const ty0 = `${Math.round(rand(-8, 8))}px`;
      const tx1 = `${Math.round(rand(-30, 30))}px`;
      const ty1 = `${Math.round(rand(-30, 30))}px`;
      const s0 = rand(0.96, 1).toFixed(3);
      const s1 = rand(0.95, 1.08).toFixed(3);
      const o0 = '1';
      const o1 = rand(0.22, 0.55).toFixed(3);
      const dur = rand(14, 40).toFixed(2); // longer spread
      const delay = rand(-20, 20).toFixed(2); // large negative to randomize phase
      const ease = pick(easings);
      const dir = Math.random() > 0.5 ? 'alternate' : 'alternate-reverse';
      const r0 = rand(-4, 4).toFixed(2);
      const r1 = rand(-10, 10).toFixed(2);
      return {
        tx0,
        ty0,
        tx1,
        ty1,
        s0,
        s1,
        o0,
        o1,
        dur,
        delay,
        ease,
        dir,
        r0,
        r1,
      };
    });
  }, [categoryEmojis]);

  // Compute a 'cloud' of positions around the avatar to avoid collisions.
  // Use polar coordinates so emojis are distributed evenly with small jitter.
  const CategoryEmojis = () => {
    return (
      <>
        {categoryEmojis.map((emoji, i) => {
          const n = categoryEmojis.length || 1;
          // Add rotationOffset to the angle
          const angle =
            (i / n) * Math.PI * 2 +
            (i % 2 === 0 ? 0.2 : -0.15) +
            rotationOffset;
          const jitter = (i % 3) * 10 - 10; // small deterministic jitter
          const radius = baseRadius + (i % 2 === 0 ? 15 : -15) + jitter;
          const baseX = Math.round(Math.cos(angle) * radius);
          const baseY = Math.round(Math.sin(angle) * radius) - 12; // nudge upward
          const cfg = emojiConfigs[i] || {};

          // Outer wrapper: fixed base position. Inner span: handles
          // the slow randomized motion and pulse (opacity + scale).
          return (
            <div
              key={i}
              className='pointer-events-none absolute text-2xl drop-shadow-md'
              style={{
                left: '50%',
                top: '50%',
                transform: `translate(calc(-50% + ${baseX}px), calc(-50% + ${baseY}px))`,
              }}
              aria-hidden
            >
              <span
                className='emoji-float'
                style={
                  {
                    // CSS custom properties used by the emojiAuto keyframes
                    '--tx0': cfg.tx0,
                    '--ty0': cfg.ty0,
                    '--tx1': cfg.tx1,
                    '--ty1': cfg.ty1,
                    '--s0': cfg.s0,
                    '--s1': cfg.s1,
                    '--o0': cfg.o0,
                    '--o1': cfg.o1,
                    '--emoji-duration': `${cfg.dur}s`,
                    '--emoji-delay': `${cfg.delay}s`,
                    '--emoji-ease': cfg.ease,
                    '--emoji-dir': cfg.dir,
                    '--r0': `${cfg.r0}deg`,
                    '--r1': `${cfg.r1}deg`,
                  } as CustomCSSProperties
                }
              >
                {emoji}
              </span>
            </div>
          );
        })}
      </>
    );
  };

  return (
    <section className='gradient-bg relative flex min-h-screen items-center justify-center overflow-hidden pt-24 pb-12 lg:py-0'>
      {/* Header with language selector */}
      <header className='absolute left-0 right-0 top-0 z-30 px-6 py-4'>
        <div className='container mx-auto flex items-center justify-between'>
          <Link to="/" className='text-2xl font-black text-white hover:text-fluxby-light transition-colors'>Fluxby</Link>
          {/* Language Selector */}
          <div className='flex items-center gap-2'>
            {(Object.keys(languages) as Array<keyof typeof languages>).map(
              (lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`text-xl transition-transform hover:scale-110 ${
                    language === lang ? 'scale-110' : 'opacity-60'
                  }`}
                  title={languages[lang].name}
                >
                  {languages[lang].flag}
                </button>
              )
            )}
          </div>
        </div>
      </header>

      {/* Animated bokeh background */}
      <div className='absolute inset-0 overflow-hidden'>
        {/* Inject local keyframes */}
        <style>{bokehStyles}</style>
        {/* Bokeh orbs - large soft blurred circles */}
        <div
          className='bokeh-orb bokeh-float bokeh-pulse'
          style={{
            width: '300px',
            height: '300px',
            background: 'rgba(139, 92, 246, 0.4)',
            top: '10%',
            left: '5%',
          }}
        />
        <div
          className='bokeh-orb bokeh-drift bokeh-pulse-delayed'
          style={{
            width: '400px',
            height: '400px',
            background: 'rgba(167, 139, 250, 0.35)',
            top: '30%',
            right: '-5%',
          }}
        />
        <div
          className='bokeh-orb bokeh-float-delayed bokeh-pulse'
          style={{
            width: '250px',
            height: '250px',
            background: 'rgba(196, 181, 253, 0.4)',
            bottom: '20%',
            left: '10%',
          }}
        />
        <div
          className='bokeh-orb bokeh-drift bokeh-pulse-delayed'
          style={{
            width: '180px',
            height: '180px',
            background: 'rgba(221, 214, 254, 0.45)',
            top: '60%',
            left: '30%',
          }}
        />
        <div
          className='bokeh-orb bokeh-float bokeh-pulse-delayed'
          style={{
            width: '220px',
            height: '220px',
            background: 'rgba(124, 58, 237, 0.3)',
            top: '15%',
            right: '20%',
          }}
        />
        <div
          className='bokeh-orb bokeh-drift bokeh-pulse'
          style={{
            width: '150px',
            height: '150px',
            background: 'rgba(139, 92, 246, 0.35)',
            bottom: '10%',
            right: '15%',
          }}
        />
        <div
          className='bokeh-orb bokeh-float-delayed bokeh-pulse-delayed'
          style={{
            width: '120px',
            height: '120px',
            background: 'rgba(167, 139, 250, 0.4)',
            top: '45%',
            left: '50%',
          }}
        />
        <div
          className='bokeh-orb bokeh-drift bokeh-pulse'
          style={{
            width: '280px',
            height: '280px',
            background: 'rgba(196, 181, 253, 0.3)',
            bottom: '30%',
            right: '30%',
          }}
        />
        <div
          className='bokeh-breathe absolute h-56 w-56 rounded-full opacity-20'
          style={{
            background:
              'radial-gradient(circle, rgba(221,214,254,0.82) 0%, transparent 70%)',
            bottom: '30%',
            right: '20%',
            animationDuration: '9s',
            animationDelay: '0.5s',
          }}
        />
        {/* Extra bokeh for depth */}
        <div
          className='opacity-28 bokeh-blur-pulse absolute h-28 w-28 rounded-full'
          style={{
            background:
              'radial-gradient(circle, rgba(124,58,237,0.9) 0%, transparent 70%)',
            top: '55%',
            left: '6%',
            animationDuration: '5.5s',
            animationDelay: '0.8s',
          }}
        />
        <div
          className='bokeh-breathe absolute h-20 w-20 rounded-full opacity-30'
          style={{
            background:
              'radial-gradient(circle, rgba(245,243,255,0.9) 0%, transparent 70%)',
            top: '14%',
            right: '23%',
            animationDuration: '6.2s',
            animationDelay: '1.3s',
          }}
        />
        {/* Smaller accent bokeh */}
        <div
          className='animate-pulse-slow absolute h-20 w-20 rounded-full opacity-40 blur-md'
          style={{
            background:
              'radial-gradient(circle, rgba(139,92,246,0.9) 0%, transparent 70%)',
            top: '60%',
            left: '8%',
            animationDuration: '4s',
          }}
        />
        <div
          className='animate-pulse-slow absolute h-24 w-24 rounded-full opacity-35 blur-lg'
          style={{
            background:
              'radial-gradient(circle, rgba(245,243,255,0.8) 0%, transparent 70%)',
            top: '15%',
            right: '25%',
            animationDuration: '5s',
            animationDelay: '1.5s',
          }}
        />
        {/* Extra small subtle bokeh dots for texture */}
        <div
          className='bokeh-breathe absolute h-10 w-10 rounded-full opacity-10'
          style={{
            background: 'rgba(196,181,253,0.22)',
            top: '22%',
            left: '12%',
            mixBlendMode: 'screen',
          }}
        />
        <div
          className='bokeh-breathe absolute h-8 w-8 rounded-full opacity-10'
          style={{
            background: 'rgba(167,139,250,0.18)',
            top: '48%',
            left: '22%',
            animationDelay: '0.6s',
            mixBlendMode: 'screen',
          }}
        />
        <div
          className='bokeh-blur-pulse absolute h-12 w-12 rounded-full'
          style={{
            background: 'rgba(124,58,237,0.18)',
            top: '72%',
            left: '10%',
            animationDelay: '1.1s',
            mixBlendMode: 'screen',
            opacity: 0.08,
          }}
        />
        <div
          className='bokeh-breathe absolute h-10 w-10 rounded-full opacity-10'
          style={{
            background: 'rgba(244,114,182,0.18)',
            top: '32%',
            right: '18%',
            animationDelay: '0.9s',
            mixBlendMode: 'screen',
          }}
        />
        <div
          className='bokeh-breathe absolute h-6 w-6 rounded-full'
          style={{
            background: 'rgba(245,243,255,0.14)',
            top: '58%',
            right: '12%',
            animationDelay: '1.4s',
            mixBlendMode: 'screen',
            opacity: 0.08,
          }}
        />
      </div>

      <div className='container relative z-10 mx-auto px-4 text-center'>
        <div className='flex flex-col items-center justify-between gap-12 lg:flex-row'>
          {/* Left side - Text content */}
          <div className='flex-1 text-left lg:text-left'>
            <h1 className='mb-6 text-2xl font-black leading-tight text-white sm:text-4xl lg:text-6xl'>
              {t.hero.title} <span className='text-fluxby-light'>Fluxby</span>,{' '}
              <span className='text-white'>{t.hero.subtitle}</span>
            </h1>
            <p className='mb-8 max-w-2xl text-lg leading-relaxed text-white/90 sm:text-xl lg:text-2xl'>
              {t.hero.description}
            </p>
            <div className='flex flex-col gap-4 sm:flex-row'>
              <a
                href={appHref}
                target='_blank'
                rel='noopener noreferrer'
                className='btn-primary fluffy-shadow w-full transform px-12 py-6 text-center text-xl transition-all duration-300 hover:scale-110 sm:w-auto'
              >
                {t.hero.getStarted}
              </a>
            </div>
          </div>

          {/* Right side - Big Fluxby Avatar */}
          <div className='flex flex-1 justify-center px-4 lg:justify-end lg:px-0'>
            <div className='avatar-breathe relative flex aspect-square w-full max-w-[280px] items-center justify-center sm:max-w-[400px]'>
              {/* Glow effect behind avatar */}
              <div className='bg-fluxby-purple/30 animate-pulse-slow absolute inset-0 scale-150 rounded-full blur-3xl'></div>
              <FluxbyWebGL
                width={avatarSize}
                height={avatarSize}
                className='relative z-10 drop-shadow-2xl'
                interactive={true}
              />
              {/* Category-inspired emojis (fetched from API, fallback to defaults) */}
              <CategoryEmojis />
            </div>
          </div>
        </div>
      </div>

      {/* Scroll down indicator - centered at bottom of hero */}
      <button
        aria-label='Scroll down'
        onClick={() =>
          window.scrollTo({
            top: window.innerHeight,
            behavior: 'smooth',
          })
        }
        className='absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 cursor-pointer flex-col items-center gap-2'
      >
        <div className='scroll-mouse' />
      </button>
    </section>
  );
};

export default Hero;
