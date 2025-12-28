import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Analytics from './pages/Analytics';
import Budgets from './pages/Budgets';
import Categories from './pages/Categories';
import AddressBook from './pages/AddressBook';
import Import from './pages/Import';
import Settings from './pages/Settings';
import Help from './pages/Help';
import NotFound from './pages/NotFound';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FilterProvider } from './contexts/FilterContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ApiHealthProvider } from './contexts/ApiHealthContext';
import { ProfileProvider } from './contexts/ProfileContext';
import {
  OnboardingProvider,
  Onboarding,
  useOnboarding,
} from './components/onboarding';

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
      <Routes>
        <Route path='/' element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path='transactions' element={<Transactions />} />
          <Route path='analytics' element={<Analytics />} />
          <Route path='budgets' element={<Budgets />} />
          <Route path='addressbook' element={<AddressBook />} />
          <Route path='categories' element={<Categories />} />
          <Route path='import' element={<Import />} />
          <Route path='settings' element={<Settings />} />
          <Route path='help' element={<Help />} />
          <Route path='*' element={<NotFound />} />
        </Route>
      </Routes>
      <Onboarding />
    </ErrorBoundary>
  );
}

function App() {
  return (
    <LanguageProvider>
      <ApiHealthProvider>
        <ProfileProvider>
          <FilterProvider>
            <BrowserRouter>
              <OnboardingProvider>
                <AppContent />
              </OnboardingProvider>
            </BrowserRouter>
          </FilterProvider>
        </ProfileProvider>
      </ApiHealthProvider>
    </LanguageProvider>
  );
}

export default App;
