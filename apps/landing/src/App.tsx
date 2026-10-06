import { lazy, Suspense } from 'react';
import PageLoading from './components/PageLoading';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LegalProvider } from './contexts/LegalContext';
import DocsLayout from './components/docs/DocsLayout';
import HelpLayout from './components/help/HelpLayout';
import { HeadManager } from './components/HeadManager';
import ScrollToTop from './components/ScrollToTop';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const NotFound = lazy(() => import('./pages/NotFound'));
const DocsIntroduction = lazy(() => import('./pages/docs/DocsIntroduction'));
const DocsAuthentication = lazy(
  () => import('./pages/docs/DocsAuthentication')
);
const DocsProfiles = lazy(() => import('./pages/docs/DocsProfiles'));
const DocsErrors = lazy(() => import('./pages/docs/DocsErrors'));
const DocsAccounts = lazy(() => import('./pages/docs/DocsAccounts'));
const DocsTransactions = lazy(() => import('./pages/docs/DocsTransactions'));
const DocsCategories = lazy(() => import('./pages/docs/DocsCategories'));
const DocsBudgets = lazy(() => import('./pages/docs/DocsBudgets'));
const DocsSubscriptions = lazy(() => import('./pages/docs/DocsSubscriptions'));
const DocsAnalytics = lazy(() => import('./pages/docs/DocsAnalytics'));
const DocsAddressBook = lazy(() => import('./pages/docs/DocsAddressBook'));
const DocsImport = lazy(() => import('./pages/docs/DocsImport'));
const DocsData = lazy(() => import('./pages/docs/DocsData'));
const DocsArchitecture = lazy(() => import('./pages/docs/DocsArchitecture'));
const DocsOpenAPI = lazy(() => import('./pages/docs/DocsOpenAPI'));
const DocsAI = lazy(() => import('./pages/docs/DocsAI'));
const DocsWebMcp = lazy(() => import('./pages/docs/DocsWebMcp'));
const HelpHome = lazy(() => import('./pages/help/HelpHome'));
const HelpBankConnection = lazy(
  () => import('./pages/help/HelpBankConnection')
);
const HelpBudgeting = lazy(() => import('./pages/help/HelpBudgeting'));
const HelpSubscriptions = lazy(() => import('./pages/help/HelpSubscriptions'));
const HelpPrivacy = lazy(() => import('./pages/help/HelpPrivacy'));
const HelpFirstSteps = lazy(() => import('./pages/help/HelpFirstSteps'));
const HelpInstallation = lazy(() => import('./pages/help/HelpInstallation'));
const HelpTransactions = lazy(() => import('./pages/help/HelpTransactions'));
const HelpBulkDelete = lazy(() => import('./pages/help/HelpBulkDelete'));
const HelpCategories = lazy(() => import('./pages/help/HelpCategories'));
const HelpAccounts = lazy(() => import('./pages/help/HelpAccounts'));
const HelpAnalytics = lazy(() => import('./pages/help/HelpAnalytics'));
const HelpAddressBook = lazy(() => import('./pages/help/HelpAddressBook'));
const HelpSync = lazy(() => import('./pages/help/HelpSync'));
const HelpAI = lazy(() => import('./pages/help/HelpAI'));
const HelpWebMcp = lazy(() => import('./pages/help/HelpWebMcp'));
const HelpPlanning = lazy(() => import('./pages/help/HelpPlanning'));

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <Router basename={import.meta.env.BASE_URL}>
          <ScrollToTop />
          <HeadManager />
          <LegalProvider>
            <Suspense fallback={<PageLoading />}>
              <Routes>
                <Route path='/' element={<LandingPage />} />
                <Route path='/privacy' element={<LandingPage />} />
                <Route path='/terms' element={<LandingPage />} />
                <Route path='/features' element={<LandingPage />} />
                <Route path='/pricing' element={<LandingPage />} />
                <Route path='/updates' element={<LandingPage />} />
                <Route path='/about' element={<LandingPage />} />
                <Route path='/docs' element={<DocsLayout />}>
                  <Route index element={<DocsIntroduction />} />
                  <Route
                    path='authentication'
                    element={<DocsAuthentication />}
                  />
                  <Route path='profiles' element={<DocsProfiles />} />
                  <Route path='errors' element={<DocsErrors />} />
                  <Route path='accounts' element={<DocsAccounts />} />
                  <Route path='transactions' element={<DocsTransactions />} />
                  <Route path='categories' element={<DocsCategories />} />
                  <Route path='budgets' element={<DocsBudgets />} />
                  <Route path='subscriptions' element={<DocsSubscriptions />} />
                  <Route path='analytics' element={<DocsAnalytics />} />
                  <Route path='addressbook' element={<DocsAddressBook />} />
                  <Route path='import' element={<DocsImport />} />
                  <Route path='data' element={<DocsData />} />
                  <Route path='architecture' element={<DocsArchitecture />} />
                  <Route path='openapi' element={<DocsOpenAPI />} />
                  <Route path='ai' element={<DocsAI />} />
                  <Route path='webmcp' element={<DocsWebMcp />} />
                </Route>
                <Route path='/help' element={<HelpLayout />}>
                  <Route index element={<HelpHome />} />
                  <Route path='first-steps' element={<HelpFirstSteps />} />
                  <Route path='installation' element={<HelpInstallation />} />
                  <Route
                    path='bank-connection'
                    element={<HelpBankConnection />}
                  />
                  <Route path='transactions' element={<HelpTransactions />} />
                  <Route path='bulk-delete' element={<HelpBulkDelete />} />
                  <Route path='categories' element={<HelpCategories />} />
                  <Route path='accounts' element={<HelpAccounts />} />
                  <Route path='address-book' element={<HelpAddressBook />} />
                  <Route path='planning' element={<HelpPlanning />} />
                  <Route path='budgeting' element={<HelpBudgeting />} />
                  <Route path='subscriptions' element={<HelpSubscriptions />} />
                  <Route path='analytics' element={<HelpAnalytics />} />
                  <Route path='sync' element={<HelpSync />} />
                  <Route path='privacy' element={<HelpPrivacy />} />
                  <Route path='ai' element={<HelpAI />} />
                  <Route path='webmcp' element={<HelpWebMcp />} />
                </Route>
                <Route path='*' element={<NotFound />} />
              </Routes>
            </Suspense>
          </LegalProvider>
        </Router>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
