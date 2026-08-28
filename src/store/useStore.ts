import { create } from 'zustand';
import { User } from 'firebase/auth';

interface UserProfile {
  username: string;
  displayName: string;
  bio: string;
  photoURL: string;
  bannerURL: string;
  profileColor: string;
  favoriteGames: number[]; // Game IDs
  topGames?: number[]; // Game IDs
  gameStatus?: Record<string, 'played' | 'playing' | 'backlog'>;
  lastUsernameChange?: string;
}

interface AppState {
  user: User | null;
  userProfile: UserProfile | null;
  setUser: (user: User | null) => void;
  setUserProfile: (profile: UserProfile | null) => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  userProfile: null,
  setUser: (user) => set({ user }),
  setUserProfile: (profile) => set({ userProfile: profile }),
}));
