/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

type ModalType =
  | 'privacy'
  | 'terms'
  | 'features'
  | 'pricing'
  | 'updates'
  | 'about'
  | null;

interface LegalContextType {
  activeModal: ModalType;
  openPrivacy: () => void;
  openTerms: () => void;
  openFeatures: () => void;
  openPricing: () => void;
  openUpdates: () => void;
  openAbout: () => void;
  closeModal: () => void;
}

const LegalContext = createContext<LegalContextType | undefined>(undefined);

export const LegalProvider = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const activeModal: ModalType =
    location.pathname === '/privacy'
      ? 'privacy'
      : location.pathname === '/terms'
        ? 'terms'
        : location.pathname === '/features'
          ? 'features'
          : location.pathname === '/pricing'
            ? 'pricing'
            : location.pathname === '/updates'
              ? 'updates'
              : location.pathname === '/about'
                ? 'about'
                : null;

  const openPrivacy = () => navigate('/privacy');
  const openTerms = () => navigate('/terms');
  const openFeatures = () => navigate('/features');
  const openPricing = () => navigate('/pricing');
  const openUpdates = () => navigate('/updates');
  const openAbout = () => navigate('/about');
  const closeModal = () => navigate('/');

  return (
    <LegalContext.Provider
      value={{
        activeModal,
        openPrivacy,
        openTerms,
        openFeatures,
        openPricing,
        openUpdates,
        openAbout,
        closeModal,
      }}
    >
      {children}
    </LegalContext.Provider>
  );
};

export const useLegal = () => {
  const context = useContext(LegalContext);
  if (context === undefined) {
    throw new Error('useLegal must be used within a LegalProvider');
  }
  return context;
};
