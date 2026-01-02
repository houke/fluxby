import { useEffect, useState, useRef } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

// Category data structure with keys for translation
const categoryGroupData = [
  {
    key: 'wonen',
    icon: '🏠',
    color: '#1E40AF',
    subcategoryKeys: ['huur', 'energie', 'inrichting'],
    subcategoryIcons: ['🔑', '⚡', '🪑'],
  },
  {
    key: 'huishouden',
    icon: '🛒',
    color: '#34D399',
    subcategoryKeys: ['supermarkt', 'drogisterij', 'huisdieren'],
    subcategoryIcons: ['🍎', '🧴', '🐾'],
  },
  {
    key: 'vervoer',
    icon: '🚗',
    color: '#3B82F6',
    subcategoryKeys: ['brandstof', 'ov', 'parkeren'],
    subcategoryIcons: ['⛽', '🚆', '🅿️'],
  },
  {
    key: 'eten',
    icon: '🍽️',
    color: '#F59E0B',
    subcategoryKeys: ['restaurant', 'bezorging', 'koffie'],
    subcategoryIcons: ['🥂', '🍕', '☕'],
  },
];

// Shuffle function for randomization
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function CategoriesAnimation({
  isVisible,
}: {
  isVisible: boolean;
}) {
  const { t } = useLanguage();
  const [scrollY, setScrollY] = useState(0);
  const [shuffledData] = useState(() => shuffleArray(categoryGroupData));
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Get translations
  const anim = t.animations?.categories;
  const categoryGroups = shuffledData.map((cat) => ({
    ...cat,
    name: anim?.groups?.[cat.key as keyof typeof anim.groups] || cat.key,
    subcategories: cat.subcategoryKeys.map((subKey, idx) => ({
      name:
        anim?.subcategories?.[subKey as keyof typeof anim.subcategories] ||
        subKey,
      icon: cat.subcategoryIcons[idx],
    })),
  }));

  useEffect(() => {
    if (isVisible) {
      const animate = (currentTime: number) => {
        if (!lastTimeRef.current) lastTimeRef.current = currentTime;
        const delta = currentTime - lastTimeRef.current;
        lastTimeRef.current = currentTime;

        // Scroll at 25px per second
        setScrollY((prev) => {
          const newY = prev + (delta / 1000) * 25;
          const cardHeight = 160; // Approximate height per category card including margin
          const totalHeight = categoryGroups.length * cardHeight;
          return newY % totalHeight;
        });

        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      lastTimeRef.current = 0;
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isVisible, categoryGroups.length]);

  // Triple for seamless loop
  const tripledCategories = [
    ...categoryGroups,
    ...categoryGroups,
    ...categoryGroups,
  ];

  return (
    <div className='relative h-full w-full overflow-hidden'>
      {/* Top gradient */}
      <div className='pointer-events-none absolute left-0 right-0 top-0 z-10 h-8 bg-gradient-to-b from-purple-50 to-transparent dark:from-transparent' />

      {/* Scrolling categories */}
      <div
        className='absolute left-0 right-0 px-4'
        style={{ transform: `translateY(-${scrollY}px)` }}
      >
        {tripledCategories.map((category, idx) => (
          <div
            key={idx}
            className='mb-3 overflow-hidden rounded-xl bg-white/80 shadow-sm dark:bg-white/10 dark:shadow-none'
          >
            {/* Parent category header */}
            <div
              className='flex items-center gap-3 px-3 py-2'
              style={{ backgroundColor: `${category.color}30` }}
            >
              <div
                className='flex h-8 w-8 items-center justify-center rounded-lg'
                style={{ backgroundColor: `${category.color}50` }}
              >
                <span className='text-base'>{category.icon}</span>
              </div>
              <span className='text-sm font-semibold text-gray-900 dark:text-white'>
                {category.name}
              </span>
            </div>

            {/* Subcategories */}
            <div className='px-3 py-2'>
              <div className='flex flex-wrap gap-2'>
                {category.subcategories.map((sub, subIdx) => (
                  <div
                    key={subIdx}
                    className='flex items-center gap-1.5 rounded-lg bg-gray-100 px-2 py-1 dark:bg-white/5'
                  >
                    <span className='text-xs'>{sub.icon}</span>
                    <span className='text-xs text-gray-600 dark:text-white/80'>
                      {sub.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom gradient */}
      <div className='pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-8 bg-gradient-to-t from-indigo-100 to-transparent dark:from-transparent' />
    </div>
  );
}
