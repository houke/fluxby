/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  ArrowLeftRight,
  BarChart3,
  Wallet,
  Tags,
  Upload,
  Settings,
  HelpCircle,
  BookUser,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Plus,
  CalendarClock,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { usePrivacy } from './PrivacyContext';
import { useDatabase } from './DatabaseContext';
import { useFilters } from './FilterContext';
import { SpotlightDialog } from '@/components/spotlight/SpotlightDialog';

// ============= Types =============
export interface SpotlightCommand {
  id: string;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  group: 'pages' | 'actions' | 'transactions' | 'contacts';
  keywords?: string[];
  shortcut?: string;
  onSelect: () => void;
}

interface SpotlightContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  commands: SpotlightCommand[];
  recentTransactions: SpotlightCommand[];
  contacts: SpotlightCommand[];
}

const SpotlightContext = createContext<SpotlightContextType | null>(null);

export function useSpotlight() {
  const context = useContext(SpotlightContext);
  if (!context) {
    throw new Error('useSpotlight must be used within a SpotlightProvider');
  }
  return context;
}

// ============= Provider =============
interface SpotlightProviderProps {
  children: ReactNode;
}

export function SpotlightProvider({ children }: SpotlightProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { isPrivacyMode, togglePrivacyMode } = usePrivacy();
  const { dataService, isReady } = useDatabase();
  const { setOpposingAccountName, setAddressBookId, setDateRange } =
    useFilters();

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  // Theme toggle helper
  const toggleTheme = useCallback(() => {
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  }, []);

  const isDarkMode = () => document.documentElement.classList.contains('dark');

  // Keyboard shortcut: Cmd+K (Mac) / Ctrl+K (Windows/Linux)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggle]);

  // Keyboard shortcut: Cmd+Shift+D (Mac) / Ctrl+Shift+D (Windows/Linux) for theme toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey &&
        e.key.toLowerCase() === 'd'
      ) {
        e.preventDefault();
        toggleTheme();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleTheme]);

  // Close spotlight on navigation
  useEffect(() => {
    close();
  }, [location.pathname, close]);

  // ============= Static Commands =============
  const commands: SpotlightCommand[] = [
    // Pages
    {
      id: 'page-dashboard',
      title: t.nav.dashboard,
      icon: LayoutDashboard,
      group: 'pages',
      keywords: t.spotlight?.keywords?.dashboard || [
        'home',
        'overview',
        'main',
      ],
      onSelect: () => navigate('/dashboard'),
    },
    {
      id: 'page-transactions',
      title: t.nav.transactions,
      icon: ArrowLeftRight,
      group: 'pages',
      keywords: t.spotlight?.keywords?.transactions || [
        'payments',
        'history',
        'betalingen',
      ],
      onSelect: () => navigate('/transactions'),
    },
    {
      id: 'page-analytics',
      title: t.nav.analytics,
      icon: BarChart3,
      group: 'pages',
      keywords: t.spotlight?.keywords?.analytics || [
        'charts',
        'reports',
        'statistics',
        'grafieken',
      ],
      onSelect: () => navigate('/analytics'),
    },
    {
      id: 'page-budgets',
      title: t.nav.budgets,
      icon: Wallet,
      group: 'pages',
      keywords: t.spotlight?.keywords?.budgets || [
        'spending',
        'limits',
        'budget',
      ],
      onSelect: () => navigate('/budgets'),
    },
    {
      id: 'page-subscriptions',
      title: t.nav.subscriptions || 'Subscriptions',
      icon: CalendarClock,
      group: 'pages',
      keywords: t.spotlight?.keywords?.subscriptions || [
        'recurring',
        'patterns',
        'abonnementen',
        'herhalend',
      ],
      onSelect: () => navigate('/subscriptions'),
    },
    {
      id: 'page-addressbook',
      title: t.nav.addressBook || 'Address Book',
      icon: BookUser,
      group: 'pages',
      keywords: t.spotlight?.keywords?.addressBook || [
        'contacts',
        'people',
        'accounts',
        'contacten',
      ],
      onSelect: () => navigate('/addressbook'),
    },
    {
      id: 'page-categories',
      title: t.nav.categories,
      icon: Tags,
      group: 'pages',
      keywords: t.spotlight?.keywords?.categories || [
        'labels',
        'tags',
        'categorieën',
      ],
      onSelect: () => navigate('/categories'),
    },
    {
      id: 'page-import',
      title: t.nav.import,
      icon: Upload,
      group: 'pages',
      keywords: t.spotlight?.keywords?.import || [
        'csv',
        'upload',
        'importeren',
      ],
      onSelect: () => navigate('/import'),
    },
    {
      id: 'page-settings',
      title: t.nav.settings,
      icon: Settings,
      group: 'pages',
      keywords: t.spotlight?.keywords?.settings || [
        'preferences',
        'options',
        'instellingen',
      ],
      onSelect: () => navigate('/settings'),
    },
    {
      id: 'page-help',
      title: t.nav.help,
      icon: HelpCircle,
      group: 'pages',
      keywords: t.spotlight?.keywords?.help || [
        'support',
        'faq',
        'docs',
        'hulp',
      ],
      onSelect: () => navigate('/help'),
    },
    // Actions
    {
      id: 'action-toggle-theme',
      title: t.spotlight?.toggleDarkMode || 'Toggle dark mode',
      subtitle: isDarkMode()
        ? t.spotlight?.switchToLight || 'Switch to light mode'
        : t.spotlight?.switchToDark || 'Switch to dark mode',
      icon: isDarkMode() ? Sun : Moon,
      group: 'actions',
      keywords: t.spotlight?.keywords?.theme || [
        'dark',
        'light',
        'theme',
        'mode',
        'thema',
      ],
      shortcut: '⇧⌘D',
      onSelect: toggleTheme,
    },
    {
      id: 'action-toggle-privacy',
      title: t.spotlight?.togglePrivacy || 'Toggle privacy mode',
      subtitle: isPrivacyMode
        ? t.common?.disablePrivacy || 'Show sensitive data'
        : t.common?.enablePrivacy || 'Hide sensitive data',
      icon: isPrivacyMode ? Eye : EyeOff,
      group: 'actions',
      keywords: t.spotlight?.keywords?.privacy || [
        'privacy',
        'blur',
        'hide',
        'show',
      ],
      shortcut: '⇧⌘P',
      onSelect: togglePrivacyMode,
    },
    {
      id: 'action-add-budget',
      title: t.spotlight?.addBudget || 'Add budget',
      icon: Plus,
      group: 'actions',
      keywords: t.spotlight?.keywords?.budget || [
        'new',
        'create',
        'budget',
        'toevoegen',
      ],
      onSelect: () => navigate('/budgets?action=add'),
    },
    {
      id: 'action-add-category',
      title: t.spotlight?.addCategory || 'Add category',
      icon: Tags,
      group: 'actions',
      keywords: t.spotlight?.keywords?.category || [
        'new',
        'create',
        'category',
        'categorie',
        'toevoegen',
      ],
      onSelect: () => navigate('/categories'),
    },
    {
      id: 'action-add-address',
      title: t.spotlight?.addContact || 'Add contact',
      icon: UserPlus,
      group: 'actions',
      keywords: t.spotlight?.keywords?.contact || [
        'new',
        'create',
        'contact',
        'address',
        'adresboek',
        'toevoegen',
      ],
      onSelect: () => navigate('/addressbook'),
    },
  ];

  // ============= Dynamic Data =============
  // Fetch recent transactions (last 100)
  const { data: transactionsData } = useQuery({
    queryKey: ['spotlight-transactions'],
    queryFn: async () => {
      if (!dataService) return [];
      // Get all transactions and limit to 100 most recent
      const transactions = await dataService.getTransactions();
      return transactions.slice(0, 100);
    },
    enabled: isReady && !!dataService,
    staleTime: 30000, // 30 seconds
  });

  // Contact type for address book
  interface AddressBookContact {
    id: string;
    name: string;
    iban: string;
    description: string | null;
  }

  // Fetch address book contacts
  const { data: contactsData } = useQuery({
    queryKey: ['spotlight-contacts'],
    queryFn: async (): Promise<AddressBookContact[]> => {
      if (!dataService) return [];
      const result = await dataService.getAddressBook();
      return result as unknown as AddressBookContact[];
    },
    enabled: isReady && !!dataService,
    staleTime: 30000,
  });

  // Transform transactions to commands
  const recentTransactions: SpotlightCommand[] = (transactionsData || []).map(
    (tx) => ({
      id: `tx-${tx.id}`,
      title: tx.opposingAccountName || tx.description,
      subtitle: `€${Math.abs(tx.amount).toFixed(2)} • ${new Date(tx.date).toLocaleDateString()}`,
      icon: ArrowLeftRight,
      group: 'transactions' as const,
      keywords: [
        tx.description,
        tx.opposingAccountName || '',
        tx.opposingAccountIban || '',
      ].filter(Boolean),
      onSelect: () => {
        // Navigate to transactions with filter for this transaction
        setOpposingAccountName(tx.opposingAccountName || tx.description);
        setDateRange(new Date(tx.date), new Date(tx.date));
        // Pass the search query to the transactions page
        const searchQuery = tx.opposingAccountName || tx.description;
        navigate(`/transactions?search=${encodeURIComponent(searchQuery)}`);
      },
    })
  );

  // Transform contacts to commands
  const contacts: SpotlightCommand[] = (contactsData || []).map((contact) => ({
    id: `contact-${contact.id}`,
    title: contact.name,
    subtitle: contact.iban || undefined,
    icon: BookUser,
    group: 'contacts' as const,
    keywords: [contact.name, contact.iban].filter(Boolean),
    onSelect: () => {
      // Navigate to transactions filtered by this contact
      setAddressBookId(contact.id);
      navigate('/transactions');
    },
  }));

  const value: SpotlightContextType = {
    isOpen,
    open,
    close,
    toggle,
    commands,
    recentTransactions,
    contacts,
  };

  return (
    <SpotlightContext.Provider value={value}>
      {children}
      <SpotlightDialog />
    </SpotlightContext.Provider>
  );
}
