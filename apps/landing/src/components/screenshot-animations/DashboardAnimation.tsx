import { useEffect, useState, useRef } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

// Category data structure (static parts)
const categoryData = [
  { key: 'supermarkt', icon: '🍎', color: '#34D399', amount: 342.5 },
  { key: 'restaurant', icon: '🍽️', color: '#F59E0B', amount: 186.2 },
  { key: 'brandstof', icon: '⛽', color: '#3B82F6', amount: 124.8 },
  { key: 'energie', icon: '⚡', color: '#1E40AF', amount: 156.0 },
  { key: 'streaming', icon: '📺', color: '#0EA5E9', amount: 45.97 },
  { key: 'transport', icon: '🚆', color: '#8B5CF6', amount: 89.5 },
];

const total = categoryData.reduce((sum, cat) => sum + cat.amount, 0);

export default function DashboardAnimation({
  isVisible,
}: {
  isVisible: boolean;
}) {
  const { t } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Get translated category names
  const anim = t.animations?.dashboard;
  const categories = categoryData.map((cat) => ({
    ...cat,
    name:
      anim?.categories?.[cat.key as keyof typeof anim.categories] || cat.key,
  }));

  useEffect(() => {
    if (isVisible) {
      intervalRef.current = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % categories.length);
      }, 2000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isVisible, categories.length]);

  // Calculate pie slices
  let cumulativeAngle = -90; // Start from top
  const slices = categories.map((cat, idx) => {
    const percentage = cat.amount / total;
    const angle = percentage * 360;
    const startAngle = cumulativeAngle;
    cumulativeAngle += angle;

    // Calculate SVG arc path
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = ((startAngle + angle) * Math.PI) / 180;

    const outerRadius = idx === activeIndex ? 85 : 80;
    const innerRadius = idx === activeIndex ? 50 : 48;

    const x1Outer = 100 + outerRadius * Math.cos(startRad);
    const y1Outer = 100 + outerRadius * Math.sin(startRad);
    const x2Outer = 100 + outerRadius * Math.cos(endRad);
    const y2Outer = 100 + outerRadius * Math.sin(endRad);

    const x1Inner = 100 + innerRadius * Math.cos(endRad);
    const y1Inner = 100 + innerRadius * Math.sin(endRad);
    const x2Inner = 100 + innerRadius * Math.cos(startRad);
    const y2Inner = 100 + innerRadius * Math.sin(startRad);

    const largeArc = angle > 180 ? 1 : 0;

    const path = `
      M ${x1Outer} ${y1Outer}
      A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2Outer} ${y2Outer}
      L ${x1Inner} ${y1Inner}
      A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x2Inner} ${y2Inner}
      Z
    `;

    return {
      ...cat,
      path,
      isActive: idx === activeIndex,
    };
  });

  const activeCat = categories[activeIndex];

  return (
    <div className='flex h-full w-full items-center justify-center gap-4 p-4'>
      {/* Pie Chart */}
      <div className='relative flex-shrink-0'>
        <svg width='200' height='200' viewBox='0 0 200 200'>
          {slices.map((slice, idx) => (
            <path
              key={idx}
              d={slice.path}
              fill={slice.color}
              opacity={slice.isActive ? 1 : 0.7}
              className='transition-all duration-300'
              style={{
                filter: slice.isActive
                  ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
                  : 'none',
                transform: slice.isActive ? 'scale(1.02)' : 'scale(1)',
                transformOrigin: 'center',
              }}
            />
          ))}
          {/* Center text */}
          <text
            x='100'
            y='95'
            textAnchor='middle'
            className='fill-gray-800 text-lg font-bold dark:fill-white'
            style={{ fontSize: '14px' }}
          >
            €{total.toFixed(0)}
          </text>
          <text
            x='100'
            y='112'
            textAnchor='middle'
            className='fill-gray-500 dark:fill-white/70'
            style={{ fontSize: '10px' }}
          >
            {anim?.total || 'total'}
          </text>
        </svg>
      </div>

      {/* Category Legend */}
      <div className='flex flex-col gap-1.5'>
        {categories.map((cat, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-2 rounded-lg px-2 py-1 transition-all duration-300 ${idx === activeIndex ? 'scale-105 bg-gray-800/10 dark:bg-white/20' : 'bg-gray-800/5 dark:bg-white/5'}`}
          >
            <div
              className='flex h-6 w-6 items-center justify-center rounded text-xs'
              style={{ backgroundColor: `${cat.color}40` }}
            >
              {cat.icon}
            </div>
            <span className='text-xs text-gray-700 dark:text-white/90'>
              {cat.name}
            </span>
          </div>
        ))}
      </div>

      {/* Active Amount Display */}
      <div
        className='absolute top-3 right-3 rounded-lg px-3 py-1.5 transition-all duration-300'
        style={{ backgroundColor: activeCat.color }}
      >
        <span className='text-sm font-semibold text-white'>
          €{activeCat.amount.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
