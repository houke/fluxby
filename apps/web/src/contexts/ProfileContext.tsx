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
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

const ACTIVE_PROFILE_KEY = 'fluxby.activeProfileId';

interface ProfileContextValue {
  activeProfile: Profile | null;
  activeProfileId: number | null;
  profiles: Profile[];
  isLoading: boolean;
  isSwitching: boolean;
  switchProfile: (id: number) => void;
  createProfile: (data: {
    name: string;
    type: ProfileType;
    avatarUrl?: string | null;
  }) => Promise<Profile>;
  updateProfile: (
    id: number,
    data: { name?: string; type?: ProfileType; avatarUrl?: string | null }
  ) => Promise<void>;
  deleteProfile: (id: number) => Promise<void>;
  refreshProfiles: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(
  undefined
);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<number | null>(() => {
    // Load from localStorage on init
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(ACTIVE_PROFILE_KEY);
    return stored ? parseInt(stored, 10) : null;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);

  const fetchProfiles = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api.getProfiles();
      setProfiles(data);

      // If no active profile or stored profile not found, use first available
      if (data.length > 0) {
        setActiveProfileId((currentId) => {
          const found = data.find((p) => p.id === currentId);
          if (!found) {
            localStorage.setItem(ACTIVE_PROFILE_KEY, String(data[0].id));
            return data[0].id;
          }
          return currentId;
        });
      }
    } catch (error) {
      console.error('Failed to fetch profiles:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch profiles on mount
  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const refreshProfiles = useCallback(async () => {
    await fetchProfiles();
  }, [fetchProfiles]);

  const switchProfile = useCallback(
    (id: number) => {
      if (id === activeProfileId) return;

      setIsSwitching(true);
      setActiveProfileId(id);
      localStorage.setItem(ACTIVE_PROFILE_KEY, String(id));

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
      const newProfile = await api.createProfile(data);
      setProfiles((prev) => [...prev, newProfile]);
      return newProfile;
    },
    []
  );

  const updateProfile = useCallback(
    async (
      id: number,
      data: { name?: string; type?: ProfileType; avatarUrl?: string | null }
    ) => {
      await api.updateProfile(id, data);
      await fetchProfiles();
    },
    [fetchProfiles]
  );

  const deleteProfile = useCallback(
    async (id: number) => {
      await api.deleteProfile(id);
      const remaining = profiles.filter((p) => p.id !== id);
      setProfiles(remaining);

      // If deleted the active profile, switch to another
      if (id === activeProfileId && remaining.length > 0) {
        switchProfile(remaining[0].id);
      }
    },
    [activeProfileId, profiles, switchProfile]
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
