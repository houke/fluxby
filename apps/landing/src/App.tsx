import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Hero from './components/Hero';
import Features from './components/Features';
import Screenshots from './components/Screenshots';
import Developer from './components/Developer';
import HelpCenter from './components/HelpCenter';
import Downloads from './components/Downloads';
import CTA from './components/CTA';
import Footer from './components/Footer';
import LegalModal from './components/LegalModal';
import PrivacyPolicyContent from './pages/legal/PrivacyPolicyContent';
import TermsOfUseContent from './pages/legal/TermsOfUseContent';
import FeaturesContent from './pages/legal/FeaturesContent';
import PricingContent from './pages/legal/PricingContent';
import UpdatesContent from './pages/legal/UpdatesContent';
import AboutContent from './pages/legal/AboutContent';
import NotFound from './pages/NotFound';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LegalProvider, useLegal } from './contexts/LegalContext';
import DocsLayout from './components/docs/DocsLayout';
import DocsIntroduction from './pages/docs/DocsIntroduction';
import DocsAuthentication from './pages/docs/DocsAuthentication';
import DocsProfiles from './pages/docs/DocsProfiles';
import DocsErrors from './pages/docs/DocsErrors';
import DocsAccounts from './pages/docs/DocsAccounts';
import DocsTransactions from './pages/docs/DocsTransactions';
import DocsCategories from './pages/docs/DocsCategories';
import DocsBudgets from './pages/docs/DocsBudgets';
import DocsAnalytics from './pages/docs/DocsAnalytics';
import DocsAddressBook from './pages/docs/DocsAddressBook';
import DocsImport from './pages/docs/DocsImport';
import DocsData from './pages/docs/DocsData';
import DocsArchitecture from './pages/docs/DocsArchitecture';
import DocsOpenAPI from './pages/docs/DocsOpenAPI';
import HelpLayout from './components/help/HelpLayout';
import HelpHome from './pages/help/HelpHome';
import HelpBankConnection from './pages/help/HelpBankConnection';
import HelpBudgeting from './pages/help/HelpBudgeting';
import HelpPrivacy from './pages/help/HelpPrivacy';
import HelpFirstSteps from './pages/help/HelpFirstSteps';
import HelpTransactions from './pages/help/HelpTransactions';
import HelpCategories from './pages/help/HelpCategories';
import HelpAccounts from './pages/help/HelpAccounts';
import HelpAnalytics from './pages/help/HelpAnalytics';
import HelpAddressBook from './pages/help/HelpAddressBook';
import { HeadManager } from './components/HeadManager';
import ScrollToTop from './components/ScrollToTop';

function LegalModals() {
  const { activeModal, closeModal } = useLegal();
  const { t } = useLanguage();

  return (
    <>
      <LegalModal
        isOpen={activeModal === 'privacy'}
        onClose={closeModal}
        title={t.legal?.privacyTitle || 'Privacybeleid'}
      >
        <PrivacyPolicyContent />
      </LegalModal>
      <LegalModal
        isOpen={activeModal === 'terms'}
        onClose={closeModal}
        title={t.legal?.termsTitle || 'Gebruiksvoorwaarden'}
      >
        <TermsOfUseContent />
      </LegalModal>
      <LegalModal
        isOpen={activeModal === 'features'}
        onClose={closeModal}
        title={t.legal?.featuresTitle || 'Alle functies'}
      >
        <FeaturesContent />
      </LegalModal>
      <LegalModal
        isOpen={activeModal === 'pricing'}
        onClose={closeModal}
        title={t.legal?.pricingTitle || 'Prijzen'}
      >
        <PricingContent />
      </LegalModal>
      <LegalModal
        isOpen={activeModal === 'updates'}
        onClose={closeModal}
        title={t.legal?.updatesTitle || 'Updates'}
      >
        <UpdatesContent />
      </LegalModal>
      <LegalModal
        isOpen={activeModal === 'about'}
        onClose={closeModal}
        title={t.legal?.aboutTitle || 'Over Fluxby'}
      >
        <AboutContent />
      </LegalModal>
    </>
  );
}

function LandingPage() {
  const { activeModal } = useLegal();

  return (
    <div className='bg-black transition-colors duration-500'>
      <div
        className={`min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-100 transition-all duration-500 ease-out dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 ${
          activeModal
            ? 'origin-top scale-[0.92] rounded-3xl opacity-50 brightness-50'
            : ''
        }`}
      >
        <Hero />
        <Features />
        <Screenshots />
        <Developer />
        <HelpCenter />
        <Downloads />
        <CTA />
        <Footer />
      </div>
      <LegalModals />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <Router basename={import.meta.env.BASE_URL}>
          <ScrollToTop />
          <HeadManager />
          <LegalProvider>
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
                <Route path='authentication' element={<DocsAuthentication />} />
                <Route path='profiles' element={<DocsProfiles />} />
                <Route path='errors' element={<DocsErrors />} />
                <Route path='accounts' element={<DocsAccounts />} />
                <Route path='transactions' element={<DocsTransactions />} />
                <Route path='categories' element={<DocsCategories />} />
                <Route path='budgets' element={<DocsBudgets />} />
                <Route path='analytics' element={<DocsAnalytics />} />
                <Route path='addressbook' element={<DocsAddressBook />} />
                <Route path='import' element={<DocsImport />} />
                <Route path='data' element={<DocsData />} />
                <Route path='architecture' element={<DocsArchitecture />} />
                <Route path='openapi' element={<DocsOpenAPI />} />
              </Route>
              <Route path='/help' element={<HelpLayout />}>
                <Route index element={<HelpHome />} />
                <Route path='first-steps' element={<HelpFirstSteps />} />
                <Route
                  path='bank-connection'
                  element={<HelpBankConnection />}
                />
                <Route path='transactions' element={<HelpTransactions />} />
                <Route path='categories' element={<HelpCategories />} />
                <Route path='accounts' element={<HelpAccounts />} />
                <Route path='address-book' element={<HelpAddressBook />} />
                <Route path='budgeting' element={<HelpBudgeting />} />
                <Route path='analytics' element={<HelpAnalytics />} />
                <Route path='privacy' element={<HelpPrivacy />} />
              </Route>
              <Route path='*' element={<NotFound />} />
            </Routes>
          </LegalProvider>
        </Router>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
