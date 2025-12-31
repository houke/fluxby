/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import type { Profile, ProfileType } from '@fluxby/shared';
import { useDatabase } from '@/contexts/DatabaseContext';
import { createDataService } from '@/lib/data-service';
import { useQueryClient } from '@tanstack/react-query';

const ACTIVE_PROFILE_KEY = 'fluxby.activeProfileId';

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
  refreshProfiles: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(
  undefined
);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { db, isReady } = useDatabase();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(() => {
    // Load from localStorage on init
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(ACTIVE_PROFILE_KEY);
    return stored || null;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);

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
            localStorage.setItem(ACTIVE_PROFILE_KEY, data[0].id);
            return data[0].id;
          }
          return currentId;
        });
      } else {
        // No profiles exist - clear any stale activeProfileId
        localStorage.removeItem(ACTIVE_PROFILE_KEY);
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
      localStorage.setItem(ACTIVE_PROFILE_KEY, id);

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
