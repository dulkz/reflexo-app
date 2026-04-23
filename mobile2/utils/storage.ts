import AsyncStorage from '@react-native-async-storage/async-storage';
import { ModeKey } from './levels';

export interface SessionRecord {
  id: string;
  mode: ModeKey;
  score: number;         // main score in ms (avg best 5 for partida/alvo, avg for sequencia)
  bestTime: number;      // single best RT in ms
  accuracy?: number;     // 0-1, for alvo and sequencia
  fatigueIndex?: number; // %, sequencia only
  rounds: number;
  times: number[];
  date: number;          // Date.now()
}

const KEY = 'reflexo_sessions_v1';

export async function loadSessions(): Promise<SessionRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveSession(session: SessionRecord): Promise<void> {
  try {
    const all = await loadSessions();
    all.unshift(session);
    await AsyncStorage.setItem(KEY, JSON.stringify(all.slice(0, 200)));
  } catch {}
}

export async function clearSessions(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}

export function getBestByMode(sessions: SessionRecord[]): Record<ModeKey, number | null> {
  const best: Record<ModeKey, number | null> = { partida: null, alvo: null, sequencia: null };
  for (const s of sessions) {
    if (best[s.mode] === null || s.score < best[s.mode]!) {
      best[s.mode] = s.score;
    }
  }
  return best;
}
