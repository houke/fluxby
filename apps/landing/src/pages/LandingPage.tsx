import { lazy } from 'react';
import Hero from '../components/Hero';
import Features from '../components/Features';
import Screenshots from '../components/Screenshots';
import Developer from '../components/Developer';
import HelpCenter from '../components/HelpCenter';
import Downloads from '../components/Downloads';
import CTA from '../components/CTA';
import Footer from '../components/Footer';
import LegalModal from '../components/LegalModal';
import { useLanguage } from '../contexts/LanguageContext';
import { useLegal } from '../contexts/LegalContext';

const PrivacyPolicyContent = lazy(() => import('./legal/PrivacyPolicyContent'));
const TermsOfUseContent = lazy(() => import('./legal/TermsOfUseContent'));
const FeaturesContent = lazy(() => import('./legal/FeaturesContent'));
const PricingContent = lazy(() => import('./legal/PricingContent'));
const UpdatesContent = lazy(() => import('./legal/UpdatesContent'));
const AboutContent = lazy(() => import('./legal/AboutContent'));

function LegalModals() {
  const { activeModal, closeModal } = useLegal();
  const { t } = useLanguage();

  return (
    <>
      <LegalModal
        isOpen={activeModal === 'privacy'}
        onClose={closeModal}
        title={t.legal.privacyTitle}
      >
        <PrivacyPolicyContent />
      </LegalModal>
      <LegalModal
        isOpen={activeModal === 'terms'}
        onClose={closeModal}
        title={t.legal.termsTitle}
      >
        <TermsOfUseContent />
      </LegalModal>
      <LegalModal
        isOpen={activeModal === 'features'}
        onClose={closeModal}
        title={t.legal.featuresTitle}
      >
        <FeaturesContent />
      </LegalModal>
      <LegalModal
        isOpen={activeModal === 'pricing'}
        onClose={closeModal}
        title={t.legal.pricingTitle}
      >
        <PricingContent />
      </LegalModal>
      <LegalModal
        isOpen={activeModal === 'updates'}
        onClose={closeModal}
        title={t.legal.updatesTitle}
      >
        <UpdatesContent />
      </LegalModal>
      <LegalModal
        isOpen={activeModal === 'about'}
        onClose={closeModal}
        title={t.legal.aboutTitle}
      >
        <AboutContent />
      </LegalModal>
    </>
  );
}

export default function LandingPage() {
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
