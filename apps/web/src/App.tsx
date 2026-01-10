import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User } from 'lucide-react';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Analytics from './pages/Analytics';
import Budgets from './pages/Budgets';
import Subscriptions from './pages/Subscriptions';
import Categories from './pages/Categories';
import AddressBook from './pages/AddressBook';
import Import from './pages/Import';
import Settings from './pages/Settings';
import Help from './pages/Help';
import NotFound from './pages/NotFound';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FilterProvider } from './contexts/FilterContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { DatabaseProvider } from './contexts/DatabaseContext';
import { ProfileProvider } from './contexts/ProfileContext';
import { SyncProvider } from './contexts/SyncContext';
import { ToastProvider } from './contexts/ToastContext';
import { ConfirmProvider } from './contexts/ConfirmContext';
import { PrivacyProvider } from './contexts/PrivacyContext';
import {
  EncryptionProvider,
  useEncryption,
} from './contexts/EncryptionContext';
import { LockScreen } from './components/LockScreen';
import { SecuritySetup } from './components/SecuritySetup';
import {
  OnboardingProvider,
  Onboarding,
  useOnboarding,
} from './components/onboarding';
import { SpotlightProvider } from './contexts/SpotlightContext';
import { MigrationGate } from './components/MigrationGate';

// Inner component that can access onboarding context
function AppContent() {
  const { skipOnboarding, state } = useOnboarding();

  const handleError = () => {
    // Close onboarding if it was active
    if (state.isActive) {
      skipOnboarding();
    }
  };

  return (
    <ErrorBoundary onError={handleError}>
      {/* Onboarding overlay - shown on top of the app content */}
      <Onboarding />
      <Routes>
        <Route path='/' element={<Layout />}>
          <Route index element={<Navigate to='/dashboard' replace />} />
          <Route path='dashboard' element={<Dashboard />} />
          <Route path='transactions' element={<Transactions />} />
          <Route path='analytics' element={<Analytics />} />
          <Route path='budgets' element={<Budgets />} />
          <Route path='subscriptions' element={<Subscriptions />} />
          <Route path='addressbook' element={<AddressBook />} />
          <Route path='categories' element={<Categories />} />
          <Route path='import' element={<Import />} />
          <Route path='settings' element={<Settings />} />
          <Route path='help' element={<Help />} />
          <Route path='*' element={<NotFound />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}

// Security gate - shows lock screen if locked, security setup if new user
function SecurityGate({ children }: { children: React.ReactNode }) {
  const { isEncryptionEnabled, isUnlocked } = useEncryption();
  const { needsSecuritySetup, isLoadingUser, triggerDemoSetup } =
    useOnboarding();
  const { t } = useLanguage();

  // Debug logging for Tauri
  const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;
  if (isTauri) {
    // eslint-disable-next-line no-console
    console.log('[SecurityGate] State:', {
      isEncryptionEnabled,
      isUnlocked,
      needsSecuritySetup,
      isLoadingUser,
    });
  }

  // 1. PRIORITY: If encryption is set up but locked, show lock screen immediately
  // We do this BEFORE loading user data to prevent querying encrypted DB
  if (isEncryptionEnabled && !isUnlocked) {
    return <LockScreen />;
  }

  // 2. If we are still checking the user status, show loading
  // Do NOT render children yet to prevent flashing empty dashboard
  if (isLoadingUser) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900'>
        <div className='mx-4 w-full max-w-md rounded-lg border bg-card p-8 shadow-lg'>
          <div className='flex flex-col items-center text-center'>
            {/* Loading spinner */}
            <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30'>
              <User className='h-8 w-8 text-purple-600 dark:text-purple-400' />
            </div>

            {/* Title */}
            <h2 className='mb-2 text-xl font-semibold'>
              {t.common?.loadingUserData || 'Loading your data...'}
            </h2>

            {/* Description */}
            <p className='text-sm text-muted-foreground'>
              {t.common?.prepareDashboard ||
                'Please wait while we prepare your dashboard'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 3. New user needs security setup (no encryption set up yet)
  // This shows the language/name/password setup on the gradient background
  if (needsSecuritySetup) {
    return <SecuritySetup onSetupComplete={triggerDemoSetup} />;
  }

  // 4. Fallback: If no encryption and NOT in security setup (should be rare/impossible)
  if (!isEncryptionEnabled) {
    return <LockScreen showSetup />;
  }

  // 5. App is unlocked, user exists, and ready to use
  // Onboarding will show as overlay on top of the dashboard
  return <>{children}</>;
}

// Determine router basename based on environment
// Tauri uses root path, web uses /app/
const getRouterBasename = () => {
  const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;
  if (isTauri) return '/';
  return import.meta.env.BASE_URL || '/app/';
};

function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <EncryptionProvider>
          {/* MigrationGate checks for pending migrations BEFORE database initializes */}
          <MigrationGate>
            <DatabaseProvider>
              <ProfileProvider>
                <PrivacyProvider>
                  <SyncProvider>
                    <FilterProvider>
                      <ToastProvider>
                        <ConfirmProvider>
                          <BrowserRouter basename={getRouterBasename()}>
                            <OnboardingProvider>
                              <SpotlightProvider>
                                <SecurityGate>
                                  <AppContent />
                                </SecurityGate>
                              </SpotlightProvider>
                            </OnboardingProvider>
                          </BrowserRouter>
                        </ConfirmProvider>
                      </ToastProvider>
                    </FilterProvider>
                  </SyncProvider>
                </PrivacyProvider>
              </ProfileProvider>
            </DatabaseProvider>
          </MigrationGate>
        </EncryptionProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;
