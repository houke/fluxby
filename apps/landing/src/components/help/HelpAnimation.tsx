import { useEffect, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

type AnimationType =
  | 'profile'
  | 'import'
  | 'dashboard'
  | 'transactions'
  | 'categories'
  | 'budget'
  | 'accounts'
  | 'trends'
  | 'addressBook'
  | 'export';

interface HelpAnimationProps {
  type: AnimationType;
  height?: string;
}

export default function HelpAnimation({
  type,
  height = '280px',
}: HelpAnimationProps) {
  const { t } = useLanguage();
  const anim = t.helpCenter?.animations;

  // Render animation based on type
  switch (type) {
    case 'profile':
      return <ProfileAnimation height={height} anim={anim?.profile} />;
    case 'import':
      return <ImportAnimation height={height} anim={anim?.import} />;
    case 'dashboard':
      return <DashboardAnimation height={height} anim={anim?.dashboard} />;
    case 'transactions':
      return (
        <TransactionsAnimation height={height} anim={anim?.transactions} />
      );
    case 'categories':
      return <CategoriesAnimation height={height} anim={anim?.categories} />;
    case 'budget':
      return <BudgetAnimation height={height} anim={anim?.budget} />;
    case 'accounts':
      return <AccountsAnimation height={height} anim={anim?.accounts} />;
    case 'trends':
      return <TrendsAnimation height={height} anim={anim?.trends} />;
    case 'addressBook':
      return <AddressBookAnimation height={height} anim={anim?.addressBook} />;
    case 'export':
      return <ExportAnimation height={height} anim={anim?.export} />;
    default:
      return null;
  }
}

// Base wrapper for all animations
function AnimationWrapper({
  children,
  height,
}: {
  children: React.ReactNode;
  height: string;
}) {
  return (
    <div
      className='my-6 flex w-full items-center justify-center overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800'
      style={{ minHeight: height }}
    >
      {children}
    </div>
  );
}

// 1. Profile Creation Animation
function ProfileAnimation({
  height,
  anim,
}: {
  height: string;
  anim?: { title?: string; placeholder?: string; button?: string };
}) {
  const [typing, setTyping] = useState(0);
  const name = anim?.placeholder || 'Persoonlijk';

  useEffect(() => {
    const interval = setInterval(() => {
      setTyping((prev) => (prev >= name.length ? 0 : prev + 1));
    }, 200);
    return () => clearInterval(interval);
  }, [name.length]);

  return (
    <AnimationWrapper height={height}>
      <div className='flex w-72 flex-col items-center gap-4 p-6'>
        <div className='text-4xl'>👤</div>
        <h3 className='text-lg font-semibold text-gray-700 dark:text-gray-200'>
          {anim?.title || 'Nieuw profiel'}
        </h3>
        <div className='w-full'>
          <div className='relative rounded-lg border-2 border-gray-300 bg-white px-4 py-3 dark:border-gray-600 dark:bg-gray-700'>
            <span className='text-gray-800 dark:text-gray-200'>
              {name.slice(0, typing)}
            </span>
            <span className='animate-pulse text-purple-600'>|</span>
          </div>
        </div>
        <div className='w-full rounded-lg bg-purple-600 py-2 text-center text-white'>
          {anim?.button || 'Aanmaken'}
        </div>
      </div>
    </AnimationWrapper>
  );
}

// 2. Import Animation
function ImportAnimation({
  height,
  anim,
}: {
  height: string;
  anim?: { dropText?: string; fileName?: string; processing?: string };
}) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhase((prev) => (prev + 1) % 4);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <AnimationWrapper height={height}>
      <div className='flex w-72 flex-col items-center gap-4 p-6'>
        <div
          className={`flex h-36 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-500 ${
            phase === 0
              ? 'border-gray-400 bg-gray-200 dark:border-gray-500 dark:bg-gray-700'
              : phase === 1
                ? 'border-purple-400 bg-purple-50 dark:border-purple-500 dark:bg-purple-900/30'
                : 'border-green-400 bg-green-50 dark:border-green-500 dark:bg-green-900/30'
          }`}
        >
          {phase === 0 && (
            <>
              <div className='text-3xl'>📂</div>
              <p className='mt-2 text-sm text-gray-500 dark:text-gray-400'>
                {anim?.dropText || 'Sleep CSV hier'}
              </p>
            </>
          )}
          {phase === 1 && (
            <div
              className='flex flex-col items-center'
              style={{ animation: 'bounce 0.5s infinite' }}
            >
              <div className='flex items-center gap-2 rounded-lg bg-white px-4 py-2 shadow-lg dark:bg-gray-600'>
                <span className='text-xl'>📄</span>
                <span className='text-sm font-medium text-gray-700 dark:text-gray-200'>
                  {anim?.fileName || 'transacties.csv'}
                </span>
              </div>
            </div>
          )}
          {phase >= 2 && (
            <div className='flex flex-col items-center gap-2'>
              <div className='h-2 w-48 overflow-hidden rounded-full bg-gray-300 dark:bg-gray-600'>
                <div
                  className='h-full rounded-full bg-purple-600 transition-all duration-1000'
                  style={{ width: phase === 2 ? '60%' : '100%' }}
                />
              </div>
              <p className='text-sm text-gray-600 dark:text-gray-300'>
                {phase === 2
                  ? anim?.processing || 'Verwerken...'
                  : '✓ ' + (anim?.fileName || 'transacties.csv')}
              </p>
            </div>
          )}
        </div>
      </div>
    </AnimationWrapper>
  );
}

// 3. Dashboard Animation
function DashboardAnimation({
  height,
  anim,
}: {
  height: string;
  anim?: { balance?: string; income?: string; expenses?: string };
}) {
  const [activeSlice, setActiveSlice] = useState(0);
  const slices = [
    { color: '#34D399', pct: 35, label: 'Boodschappen', amount: '€435' },
    { color: '#F59E0B', pct: 25, label: 'Vervoer', amount: '€312' },
    { color: '#3B82F6', pct: 20, label: 'Wonen', amount: '€250' },
    { color: '#8B5CF6', pct: 20, label: 'Overig', amount: '€248' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlice((prev) => (prev + 1) % slices.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [slices.length]);

  return (
    <AnimationWrapper height={height}>
      <div className='flex w-full max-w-md flex-col items-center gap-4 p-4'>
        {/* Horizontal stat cards */}
        <div className='flex w-full gap-2'>
          <div className='flex-1 rounded-lg bg-white px-3 py-2 shadow-sm dark:bg-gray-700'>
            <p className='text-xs text-gray-500 dark:text-gray-400'>
              {anim?.balance || 'Saldo'}
            </p>
            <p className='text-lg font-bold text-gray-800 dark:text-gray-200'>
              €3.450
            </p>
          </div>
          <div className='flex-1 rounded-lg bg-white px-3 py-2 shadow-sm dark:bg-gray-700'>
            <p className='text-xs text-gray-500 dark:text-gray-400'>
              {anim?.income || 'Inkomsten'}
            </p>
            <p className='font-semibold text-green-600'>+€2.800</p>
          </div>
          <div className='flex-1 rounded-lg bg-white px-3 py-2 shadow-sm dark:bg-gray-700'>
            <p className='text-xs text-gray-500 dark:text-gray-400'>
              {anim?.expenses || 'Uitgaven'}
            </p>
            <p className='font-semibold text-red-500'>-€1.245</p>
          </div>
        </div>
        {/* Pie chart with linked legend */}
        <div className='flex items-center gap-6'>
          <svg width='100' height='100' viewBox='0 0 100 100'>
            {slices.map((slice, i) => {
              const startAngle = slices
                .slice(0, i)
                .reduce((sum, s) => sum + (s.pct / 100) * 360, -90);
              const angle = (slice.pct / 100) * 360;
              const rad1 = (startAngle * Math.PI) / 180;
              const rad2 = ((startAngle + angle) * Math.PI) / 180;
              const r = i === activeSlice ? 40 : 38;
              const x1 = 50 + r * Math.cos(rad1);
              const y1 = 50 + r * Math.sin(rad1);
              const x2 = 50 + r * Math.cos(rad2);
              const y2 = 50 + r * Math.sin(rad2);
              const largeArc = angle > 180 ? 1 : 0;
              return (
                <path
                  key={i}
                  d={`M 50 50 L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                  fill={slice.color}
                  opacity={i === activeSlice ? 1 : 0.7}
                  className='transition-all duration-300'
                />
              );
            })}
          </svg>
          {/* Legend linked to chart */}
          <div className='flex flex-col gap-1.5'>
            {slices.map((slice, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 rounded px-2 py-1 transition-all duration-300 ${
                  i === activeSlice
                    ? 'scale-105 bg-white shadow-sm dark:bg-gray-700'
                    : ''
                }`}
              >
                <div
                  className='h-3 w-3 rounded-sm'
                  style={{ backgroundColor: slice.color }}
                />
                <span className='text-xs text-gray-600 dark:text-gray-300'>
                  {slice.label}
                </span>
                <span className='text-xs font-medium text-gray-800 dark:text-gray-200'>
                  {slice.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AnimationWrapper>
  );
}

// 4. Transactions Animation
function TransactionsAnimation({
  height,
  anim,
}: {
  height: string;
  anim?: { search?: string; items?: string[] };
}) {
  const [highlighted, setHighlighted] = useState(0);
  const items = anim?.items || [
    '🛒 Albert Heijn',
    '⛽ Shell',
    '🍽️ Restaurant',
    '📺 Netflix',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setHighlighted((prev) => (prev + 1) % items.length);
    }, 1200);
    return () => clearInterval(interval);
  }, [items.length]);

  return (
    <AnimationWrapper height={height}>
      <div className='flex w-72 flex-col gap-3 p-4'>
        {/* Search bar */}
        <div className='flex items-center gap-2 rounded-lg bg-white px-3 py-2 dark:bg-gray-700'>
          <span className='text-gray-400'>🔍</span>
          <span className='text-sm text-gray-400'>
            {anim?.search || 'Zoeken...'}
          </span>
        </div>
        {/* Transaction list */}
        <div className='flex flex-col gap-2'>
          {items.map((item, i) => (
            <div
              key={i}
              className={`flex items-center justify-between rounded-lg px-3 py-2 transition-all duration-300 ${
                i === highlighted
                  ? 'scale-105 bg-purple-100 dark:bg-purple-900/40'
                  : 'bg-white dark:bg-gray-700'
              }`}
            >
              <span className='text-sm text-gray-700 dark:text-gray-200'>
                {item}
              </span>
              <span
                className={`text-sm font-medium ${i % 2 === 0 ? 'text-red-500' : 'text-green-600'}`}
              >
                {i % 2 === 0 ? '-€' : '+€'}
                {(Math.random() * 100 + 10).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </AnimationWrapper>
  );
}

// 5. Categories Animation
function CategoriesAnimation({
  height,
  anim,
}: {
  height: string;
  anim?: { items?: Array<{ emoji: string; name: string; color: string }> };
}) {
  const [selected, setSelected] = useState(0);
  const items = anim?.items || [
    { emoji: '🛒', name: 'Boodschappen', color: '#34D399' },
    { emoji: '🚗', name: 'Vervoer', color: '#3B82F6' },
    { emoji: '🍽️', name: 'Uit eten', color: '#F97316' },
    { emoji: '🎬', name: 'Entertainment', color: '#8B5CF6' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setSelected((prev) => (prev + 1) % items.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [items.length]);

  return (
    <AnimationWrapper height={height}>
      <div className='grid w-80 grid-cols-2 gap-3 p-4'>
        {items.map((item, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-300 ${
              i === selected
                ? 'scale-105 ring-2 ring-purple-500'
                : 'bg-white dark:bg-gray-700'
            }`}
            style={{
              backgroundColor: i === selected ? `${item.color}20` : undefined,
            }}
          >
            <span
              className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg'
              style={{ backgroundColor: `${item.color}30` }}
            >
              {item.emoji}
            </span>
            <span className='truncate text-sm font-medium text-gray-700 dark:text-gray-200'>
              {item.name}
            </span>
          </div>
        ))}
      </div>
    </AnimationWrapper>
  );
}

// 6. Budget Animation
function BudgetAnimation({
  height,
  anim,
}: {
  height: string;
  anim?: { title?: string; spent?: string; remaining?: string };
}) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 75 ? 0 : prev + 5));
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const spent = Math.round(progress * 4);
  const remaining = 300 - spent;

  return (
    <AnimationWrapper height={height}>
      <div className='flex w-64 flex-col items-center gap-4 p-4'>
        {/* Circular progress */}
        <div className='relative'>
          <svg width='140' height='140' viewBox='0 0 140 140'>
            {/* Background circle */}
            <circle
              cx='70'
              cy='70'
              r='55'
              fill='none'
              stroke='#E5E7EB'
              strokeWidth='12'
              className='dark:stroke-gray-600'
            />
            {/* Progress circle */}
            <circle
              cx='70'
              cy='70'
              r='55'
              fill='none'
              stroke={progress > 80 ? '#EF4444' : '#8B5CF6'}
              strokeWidth='12'
              strokeDasharray={`${(progress / 100) * 345} 345`}
              strokeLinecap='round'
              transform='rotate(-90 70 70)'
              className='transition-all duration-200'
            />
          </svg>
          <div className='absolute inset-0 flex flex-col items-center justify-center'>
            <span className='text-2xl font-bold text-gray-800 dark:text-gray-200'>
              {progress}%
            </span>
            <span className='text-xs text-gray-500'>
              {anim?.title || 'Budget'}
            </span>
          </div>
        </div>
        {/* Stats */}
        <div className='flex w-full justify-between text-sm'>
          <div>
            <p className='text-gray-500 dark:text-gray-400'>
              {anim?.spent || 'Uitgegeven'}
            </p>
            <p className='font-semibold text-purple-600'>€{spent}</p>
          </div>
          <div className='text-right'>
            <p className='text-gray-500 dark:text-gray-400'>
              {anim?.remaining || 'Resterend'}
            </p>
            <p className='font-semibold text-gray-800 dark:text-gray-200'>
              €{remaining}
            </p>
          </div>
        </div>
      </div>
    </AnimationWrapper>
  );
}

// 7. Accounts Animation
function AccountsAnimation({
  height,
  anim,
}: {
  height: string;
  anim?: { checking?: string; savings?: string };
}) {
  const [balances, setBalances] = useState([3450, 8920]);

  useEffect(() => {
    const interval = setInterval(() => {
      setBalances((prev) => [
        prev[0] + Math.floor(Math.random() * 100 - 50),
        prev[1] + Math.floor(Math.random() * 50 - 20),
      ]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AnimationWrapper height={height}>
      <div className='flex w-72 flex-col gap-3 p-4'>
        <div className='flex items-center justify-between rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 p-4 text-white'>
          <div>
            <p className='text-sm opacity-80'>
              {anim?.checking || 'Betaalrekening'}
            </p>
            <p className='text-xl font-bold'>
              €{balances[0].toLocaleString('nl-NL')}
            </p>
          </div>
          <span className='text-3xl'>💳</span>
        </div>
        <div className='flex items-center justify-between rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 p-4 text-white'>
          <div>
            <p className='text-sm opacity-80'>
              {anim?.savings || 'Spaarrekening'}
            </p>
            <p className='text-xl font-bold'>
              €{balances[1].toLocaleString('nl-NL')}
            </p>
          </div>
          <span className='text-3xl'>🏦</span>
        </div>
      </div>
    </AnimationWrapper>
  );
}

// 8. Trends Animation
function TrendsAnimation({
  height,
  anim,
}: {
  height: string;
  anim?: { months?: string[]; income?: string; expenses?: string };
}) {
  const months = anim?.months || ['Jan', 'Feb', 'Mar', 'Apr', 'Mei'];
  const [activeMonth, setActiveMonth] = useState(0);
  // Income and expenses data for each month
  const incomeData = [2800, 3200, 2900, 3100, 2950];
  const expenseData = [2100, 2400, 1800, 2600, 2200];
  const maxValue = Math.max(...incomeData, ...expenseData);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveMonth((prev) => (prev + 1) % months.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [months.length]);

  return (
    <AnimationWrapper height={height}>
      <div className='flex w-80 flex-col gap-3 p-4'>
        {/* Legend */}
        <div className='flex justify-center gap-4'>
          <div className='flex items-center gap-1.5'>
            <div className='h-3 w-3 rounded-sm bg-green-500' />
            <span className='text-xs text-gray-600 dark:text-gray-300'>
              {anim?.income || 'Inkomsten'}
            </span>
          </div>
          <div className='flex items-center gap-1.5'>
            <div className='h-3 w-3 rounded-sm bg-red-400' />
            <span className='text-xs text-gray-600 dark:text-gray-300'>
              {anim?.expenses || 'Uitgaven'}
            </span>
          </div>
        </div>
        {/* Bar chart */}
        <div className='flex h-32 items-end justify-around gap-1'>
          {months.map((month, i) => (
            <div key={i} className='flex flex-col items-center gap-1'>
              <div className='flex items-end gap-0.5'>
                {/* Income bar */}
                <div
                  className={`w-5 rounded-t transition-all duration-300 ${
                    i === activeMonth
                      ? 'bg-green-500'
                      : 'bg-green-300 dark:bg-green-700'
                  }`}
                  style={{ height: `${(incomeData[i] / maxValue) * 100}%` }}
                />
                {/* Expense bar */}
                <div
                  className={`w-5 rounded-t transition-all duration-300 ${
                    i === activeMonth
                      ? 'bg-red-400'
                      : 'bg-red-200 dark:bg-red-800'
                  }`}
                  style={{ height: `${(expenseData[i] / maxValue) * 100}%` }}
                />
              </div>
              <span
                className={`text-xs transition-colors ${
                  i === activeMonth
                    ? 'font-medium text-gray-800 dark:text-gray-200'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {month}
              </span>
            </div>
          ))}
        </div>
        {/* Active month stats */}
        <div className='flex justify-center gap-6 rounded-lg bg-white px-4 py-2 dark:bg-gray-700'>
          <div className='text-center'>
            <p className='text-xs text-gray-500'>
              {months[activeMonth]} {anim?.income || 'Inkomsten'}
            </p>
            <p className='font-semibold text-green-600'>
              €{incomeData[activeMonth].toLocaleString('nl-NL')}
            </p>
          </div>
          <div className='text-center'>
            <p className='text-xs text-gray-500'>
              {months[activeMonth]} {anim?.expenses || 'Uitgaven'}
            </p>
            <p className='font-semibold text-red-500'>
              €{expenseData[activeMonth].toLocaleString('nl-NL')}
            </p>
          </div>
        </div>
      </div>
    </AnimationWrapper>
  );
}

// 9. Address Book Animation
function AddressBookAnimation({
  height,
  anim,
}: {
  height: string;
  anim?: { contacts?: Array<{ name: string; count: number }> };
}) {
  const [selected, setSelected] = useState(0);
  const contacts = anim?.contacts || [
    { name: 'Albert Heijn', count: 24 },
    { name: 'Shell', count: 12 },
    { name: 'NS', count: 8 },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setSelected((prev) => (prev + 1) % contacts.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [contacts.length]);

  return (
    <AnimationWrapper height={height}>
      <div className='flex w-72 flex-col gap-2 p-4'>
        {contacts.map((contact, i) => (
          <div
            key={i}
            className={`flex items-center justify-between rounded-lg p-3 transition-all duration-300 ${
              i === selected
                ? 'scale-105 bg-purple-100 ring-2 ring-purple-500 dark:bg-purple-900/40'
                : 'bg-white dark:bg-gray-700'
            }`}
          >
            <div className='flex items-center gap-3'>
              <div className='flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-lg dark:bg-gray-600'>
                {contact.name.charAt(0)}
              </div>
              <span className='font-medium text-gray-700 dark:text-gray-200'>
                {contact.name}
              </span>
            </div>
            <span className='rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-600 dark:text-gray-300'>
              {contact.count}x
            </span>
          </div>
        ))}
      </div>
    </AnimationWrapper>
  );
}

// 10. Export Animation
function ExportAnimation({
  height,
  anim,
}: {
  height: string;
  anim?: { formats?: string[]; exporting?: string };
}) {
  const [step, setStep] = useState(0);
  const formats = anim?.formats || ['JSON', 'CSV'];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % 4);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <AnimationWrapper height={height}>
      <div className='flex w-64 flex-col items-center gap-4 p-4'>
        {step < 2 && (
          <div className='flex gap-3'>
            {formats.map((format, i) => (
              <button
                key={format}
                className={`rounded-lg px-6 py-3 font-medium transition-all ${
                  step === 1 && i === 0
                    ? 'scale-105 bg-purple-600 text-white'
                    : 'bg-white text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                }`}
              >
                {format}
              </button>
            ))}
          </div>
        )}
        {step >= 2 && (
          <div className='flex flex-col items-center gap-3'>
            <div
              className={`text-5xl transition-all duration-500 ${step === 3 ? 'scale-110' : ''}`}
            >
              {step === 2 ? '⏳' : '✅'}
            </div>
            <p className='text-sm text-gray-600 dark:text-gray-300'>
              {step === 2
                ? anim?.exporting || 'Exporteren...'
                : 'fluxby-export.json'}
            </p>
            {step === 3 && <div className='animate-bounce text-2xl'>⬇️</div>}
          </div>
        )}
      </div>
    </AnimationWrapper>
  );
}
