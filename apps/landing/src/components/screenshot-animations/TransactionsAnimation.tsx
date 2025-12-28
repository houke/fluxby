import { useEffect, useState, useRef } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

// Transaction data structure (static parts with category keys)
const transactionData = [
  {
    id: 1,
    day: 24,
    name: 'Albert Heijn',
    categoryKey: 'supermarkt',
    icon: '🍎',
    amount: -67.45,
    type: 'expense',
  },
  {
    id: 2,
    day: 23,
    name: 'Salaris',
    categoryKey: 'inkomen',
    icon: '💰',
    amount: 3250.0,
    type: 'income',
  },
  {
    id: 3,
    day: 22,
    name: 'Shell Tankstation',
    categoryKey: 'brandstof',
    icon: '⛽',
    amount: -52.8,
    type: 'expense',
  },
  {
    id: 4,
    day: 21,
    name: 'Netflix',
    categoryKey: 'streaming',
    icon: '📺',
    amount: -15.99,
    type: 'expense',
  },
  {
    id: 5,
    day: 20,
    name: 'Restaurant De Kas',
    categoryKey: 'restaurant',
    icon: '🍽️',
    amount: -89.0,
    type: 'expense',
  },
  {
    id: 6,
    day: 19,
    name: 'Eneco Energie',
    categoryKey: 'energie',
    icon: '⚡',
    amount: -156.0,
    type: 'expense',
  },
  {
    id: 7,
    day: 18,
    name: 'NS Reizen',
    categoryKey: 'transport',
    icon: '🚆',
    amount: -23.5,
    type: 'expense',
  },
  {
    id: 8,
    day: 17,
    name: 'IKEA',
    categoryKey: 'inrichting',
    icon: '🪑',
    amount: -245.0,
    type: 'expense',
  },
  {
    id: 9,
    day: 16,
    name: 'Kruidvat',
    categoryKey: 'drogisterij',
    icon: '🧴',
    amount: -34.5,
    type: 'expense',
  },
  {
    id: 10,
    day: 15,
    name: 'Tikkie',
    categoryKey: 'transfers',
    icon: '↔️',
    amount: 25.0,
    type: 'transfer',
  },
];

export default function TransactionsAnimation({
  isVisible,
}: {
  isVisible: boolean;
}) {
  const { t } = useLanguage();
  const [scrollY, setScrollY] = useState(0);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Get translated category names
  const anim = t.animations?.transactions;
  const dateLabel = anim?.date || 'dec';
  const transactions = transactionData.map((tx) => ({
    ...tx,
    date: `${tx.day} ${dateLabel}`,
    category:
      anim?.categories?.[tx.categoryKey as keyof typeof anim.categories] ||
      tx.categoryKey,
  }));

  useEffect(() => {
    if (isVisible) {
      const animate = (currentTime: number) => {
        if (!lastTimeRef.current) lastTimeRef.current = currentTime;
        const delta = currentTime - lastTimeRef.current;
        lastTimeRef.current = currentTime;

        // Scroll at 30px per second
        setScrollY((prev) => {
          const newY = prev + (delta / 1000) * 30;
          const rowHeight = 56; // 56px per row
          const totalHeight = transactions.length * rowHeight;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  // Double the transactions for seamless loop
  const doubledTransactions = [...transactions, ...transactions];

  return (
    <div className='relative h-full w-full overflow-hidden'>
      {/* Top gradient fade */}
      <div className='pointer-events-none absolute left-0 right-0 top-0 z-10 h-12 bg-gradient-to-b from-purple-600 to-transparent' />

      {/* Scrolling transactions */}
      <div
        className='absolute left-0 right-0'
        style={{ transform: `translateY(-${scrollY}px)` }}
      >
        {doubledTransactions.map((tx, idx) => (
          <div
            key={`${tx.id}-${idx}`}
            className='flex items-center gap-3 border-b border-white/10 px-4 py-3'
          >
            {/* Icon */}
            <div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white/10'>
              <span className='text-lg'>{tx.icon}</span>
            </div>

            {/* Details */}
            <div className='min-w-0 flex-1'>
              <div className='truncate text-sm font-medium text-white'>
                {tx.name}
              </div>
              <div className='flex items-center gap-2 text-xs text-white/60'>
                <span>{tx.date}</span>
                <span>•</span>
                <span>{tx.category}</span>
              </div>
            </div>

            {/* Amount */}
            <div
              className={`flex-shrink-0 text-sm font-semibold ${
                tx.type === 'income'
                  ? 'text-emerald-400'
                  : tx.type === 'transfer'
                    ? 'text-blue-400'
                    : 'text-white'
              }`}
            >
              {tx.amount >= 0 ? '+' : ''}€
              {Math.abs(tx.amount).toLocaleString('nl-NL', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom gradient fade */}
      <div className='pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-12 bg-gradient-to-t from-purple-600 to-transparent' />
    </div>
  );
}
