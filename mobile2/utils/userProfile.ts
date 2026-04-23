import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, defaultUserProfile } from '../types/user';

const KEY = 'reflexo_user_profile_v1';

export async function loadUserProfile(): Promise<UserProfile> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return defaultUserProfile();
    return { ...defaultUserProfile(), ...JSON.parse(raw) };
  } catch {
    return defaultUserProfile();
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(profile));
  } catch {}
}

export async function patchUserProfile(patch: Partial<UserProfile>): Promise<UserProfile> {
  const current = await loadUserProfile();
  const updated: UserProfile = { ...current, ...patch };
  await saveUserProfile(updated);
  return updated;
}
