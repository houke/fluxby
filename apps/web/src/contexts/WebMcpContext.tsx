/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useEncryption } from './EncryptionContext';
import { usePrivacy } from './PrivacyContext';
import { useProfile } from './ProfileContext';

interface WebMcpContextValue {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

const WebMcpContext = createContext<WebMcpContextValue | null>(null);

/** Consent lasts for this mounted app session, including route changes. */
export function WebMcpProvider({ children }: { children: ReactNode }) {
  const [allowedProfileId, setAllowedProfileId] = useState<string | null>(null);
  const { isUnlocked } = useEncryption();
  const { isPrivacyMode } = usePrivacy();
  const { activeProfileId } = useProfile();
  const previousProfileId = useRef(activeProfileId);
  const enabled =
    isUnlocked &&
    !isPrivacyMode &&
    activeProfileId !== null &&
    allowedProfileId === activeProfileId;
  const setEnabled = (value: boolean) =>
    setAllowedProfileId(value ? activeProfileId : null);

  useEffect(() => {
    if (!isUnlocked || isPrivacyMode) setAllowedProfileId(null);
  }, [isUnlocked, isPrivacyMode]);

  useEffect(() => {
    if (
      previousProfileId.current &&
      activeProfileId !== previousProfileId.current
    )
      setAllowedProfileId(null);
    previousProfileId.current = activeProfileId;
  }, [activeProfileId]);
  return (
    <WebMcpContext.Provider value={{ enabled, setEnabled }}>
      {children}
    </WebMcpContext.Provider>
  );
}

export function useWebMcp() {
  const context = useContext(WebMcpContext);
  if (!context) throw new Error('useWebMcp must be used within WebMcpProvider');
  return context;
}
