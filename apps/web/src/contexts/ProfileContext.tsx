/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import type { Profile, ProfileType } from '@fluxby/shared';
import { useDatabase } from '@/contexts/DatabaseContext';
import { createDataService } from '@/lib/data-service';
import { useQueryClient } from '@tanstack/react-query';
import {
  readFromOPFSSync,
  writeToOPFSWithCache,
  deleteFromOPFSWithCache,
  isSettingsCacheInitialized,
  readFromOPFS,
} from '@fluxby/database';

const ACTIVE_PROFILE_KEY = 'fluxby.activeProfileId';

// Helper to get initial value from OPFS cache
function getInitialProfileId(): string | null {
  if (typeof window === 'undefined') return null;
  if (isSettingsCacheInitialized()) {
    return readFromOPFSSync<string>(ACTIVE_PROFILE_KEY);
  }
  return null;
}

interface ProfileContextValue {
  activeProfile: Profile | null;
  activeProfileId: string | null;
  profiles: Profile[];
  isLoading: boolean;
  isSwitching: boolean;
  switchProfile: (id: string) => void;
  createProfile: (data: {
    name: string;
    type: ProfileType;
    avatarUrl?: string | null;
  }) => Promise<Profile>;
  updateProfile: (
    id: string,
    data: { name?: string; type?: ProfileType; avatarUrl?: string | null }
  ) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  setProfileHidden: (id: string, isHidden: boolean) => Promise<void>;
  refreshProfiles: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(
  undefined
);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { db, isReady } = useDatabase();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(
    getInitialProfileId
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);
  const mountedRef = useRef(true);

  // Debug logging in Tauri
  const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;
  if (isTauri) {
    // eslint-disable-next-line no-console
    console.log('[ProfileProvider] Rendering, db:', !!db, 'isReady:', isReady);
  }

  // Load from OPFS if cache wasn't initialized
  useEffect(() => {
    mountedRef.current = true;

    if (!isSettingsCacheInitialized()) {
      readFromOPFS<string>(ACTIVE_PROFILE_KEY).then((stored) => {
        if (mountedRef.current && stored) {
          setActiveProfileId(stored);
        }
      });
    }

    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Create data service when db is ready
  const dataService = useMemo(() => {
    if (!db) return null;
    return createDataService(db);
  }, [db]);

  const fetchProfiles = useCallback(async () => {
    if (!dataService) return;
    try {
      setIsLoading(true);
      const data = await dataService.getProfiles();
      setProfiles(data);

      // If no active profile or stored profile not found, use first available
      if (data.length > 0) {
        setActiveProfileId((currentId) => {
          const found = data.find((p) => p.id === currentId);
          if (!found) {
            // Store in OPFS (async)
            writeToOPFSWithCache(ACTIVE_PROFILE_KEY, data[0].id).catch((err) =>
              console.warn('Failed to save profile ID to OPFS:', err)
            );
            return data[0].id;
          }
          return currentId;
        });
      } else {
        // No profiles exist - clear any stale activeProfileId
        deleteFromOPFSWithCache(ACTIVE_PROFILE_KEY).catch((err) =>
          console.warn('Failed to clear profile ID from OPFS:', err)
        );
        setActiveProfileId(null);
      }
    } catch (error) {
      console.error('Failed to fetch profiles:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dataService]);

  // Fetch profiles when database is ready
  useEffect(() => {
    if (isReady && dataService) {
      fetchProfiles();
    }
  }, [isReady, dataService, fetchProfiles]);

  const refreshProfiles = useCallback(async () => {
    await fetchProfiles();
  }, [fetchProfiles]);

  const switchProfile = useCallback(
    (id: string) => {
      if (id === activeProfileId) return;

      setIsSwitching(true);
      setActiveProfileId(id);
      // Store in OPFS (async)
      writeToOPFSWithCache(ACTIVE_PROFILE_KEY, id).catch((err) =>
        console.warn('Failed to save profile ID to OPFS:', err)
      );

      // Invalidate all profile-scoped queries to refetch with new profile
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });

      // Brief delay to show switching state
      setTimeout(() => setIsSwitching(false), 300);
    },
    [activeProfileId, queryClient]
  );

  const createProfile = useCallback(
    async (data: {
      name: string;
      type: ProfileType;
      avatarUrl?: string | null;
    }) => {
      if (!dataService) throw new Error('Database not ready');
      const newProfile = await dataService.createProfile({
        name: data.name,
        type: data.type,
        avatarUrl: data.avatarUrl ?? undefined,
      });
      setProfiles((prev) => [...prev, newProfile]);
      return newProfile;
    },
    [dataService]
  );

  const updateProfile = useCallback(
    async (
      id: string,
      data: { name?: string; type?: ProfileType; avatarUrl?: string | null }
    ) => {
      if (!dataService) throw new Error('Database not ready');
      await dataService.updateProfile(id, {
        name: data.name,
        type: data.type,
        avatarUrl: data.avatarUrl ?? undefined,
      });
      await fetchProfiles();
    },
    [dataService, fetchProfiles]
  );

  const deleteProfile = useCallback(
    async (id: string) => {
      if (!dataService) throw new Error('Database not ready');
      await dataService.deleteProfile(id);
      const remaining = profiles.filter((p) => p.id !== id);
      setProfiles(remaining);

      // If deleted the active profile, switch to another
      if (id === activeProfileId && remaining.length > 0) {
        switchProfile(remaining[0].id);
      }
    },
    [activeProfileId, dataService, profiles, switchProfile]
  );

  const setProfileHidden = useCallback(
    async (id: string, isHidden: boolean) => {
      if (!dataService) throw new Error('Database not ready');
      await dataService.setProfileHidden(id, isHidden);
      await fetchProfiles();
    },
    [dataService, fetchProfiles]
  );

  const activeProfile = useMemo(() => {
    return profiles.find((p) => p.id === activeProfileId) || null;
  }, [profiles, activeProfileId]);

  const value = useMemo<ProfileContextValue>(
    () => ({
      activeProfile,
      activeProfileId,
      profiles,
      isLoading,
      isSwitching,
      switchProfile,
      createProfile,
      updateProfile,
      deleteProfile,
      setProfileHidden,
      refreshProfiles,
    }),
    [
      activeProfile,
      activeProfileId,
      profiles,
      isLoading,
      isSwitching,
      switchProfile,
      createProfile,
      updateProfile,
      deleteProfile,
      setProfileHidden,
      refreshProfiles,
    ]
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
