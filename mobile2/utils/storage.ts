import AsyncStorage from '@react-native-async-storage/async-storage';
import { ModeKey } from './levels';

export interface SessionRecord {
  id: string;
  mode: ModeKey;
  score: number;         // main score in ms (avg best 5 for partida/alvo, avg for sequencia)
  bestTime: number;      // single best RT in ms
  accuracy?: number;     // 0-1, for alvo and sequencia
  fatigueIndex?: number; // %, sequencia only
  noGoErrors?: number;    // commission count (tap on NoGo), sequencia only
  noGoAccuracy?: number;  // % of NoGo correctly inhibited (0-100 int), sequencia only
  earlyTapCount?: number; // taps during inter state (anticipations), sequencia only
  invalidForAchievements?: boolean; // true when session had 3+ false starts
  falseStartCount?: number;         // total false starts in a partida session
  timeouts?: number;                // rounds that expired without a tap in alvo
  rounds: number;
  times: number[];
  date: number;          // Date.now()
}

const KEY = 'reflexo_sessions_v1';
const ACH_KEY = 'reflexo_achievements_v1';

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

// ── Achievement unlock dates ──────────────────────────────────────────────────

export async function loadUnlockedAchievements(): Promise<Record<string, string>> {
  try {
    const raw = await AsyncStorage.getItem(ACH_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function saveUnlockedAchievements(data: Record<string, string>): Promise<void> {
  try {
    await AsyncStorage.setItem(ACH_KEY, JSON.stringify(data));
  } catch {}
}

// ── Weekly mission slots ──────────────────────────────────────────────────────

const WEEKLY_SLOTS_KEY = 'reflexo_weekly_missions_v1';

export interface WeeklySlots {
  weekStart: number;
  slotIds: string[];
}

export async function loadWeeklySlots(): Promise<WeeklySlots | null> {
  try {
    const raw = await AsyncStorage.getItem(WEEKLY_SLOTS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveWeeklySlots(slots: WeeklySlots): Promise<void> {
  try {
    await AsyncStorage.setItem(WEEKLY_SLOTS_KEY, JSON.stringify(slots));
  } catch {}
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
