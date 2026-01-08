// User profile
export interface UserProfile {
  id: string;
  name: string;
  avatar: string | null;
  createdAt: string;
}

// Tenant profiles (multi-tenant support)
export type ProfileType =
  | 'personal'
  | 'business'
  | 'shared'
  | 'savings'
  | 'investing';

// Reserved ID for demo profile (must use this exact UUID)
export const DEMO_PROFILE_ID = '00000000-0000-0000-0000-000000000001';

export interface Profile {
  id: string;
  userId: string;
  name: string;
  type: ProfileType;
  avatarUrl: string | null;
  isHidden?: boolean;
  createdAt: string;
}

export interface ProfileCreate {
  name: string;
  type: ProfileType;
  avatarUrl?: string | null;
}
