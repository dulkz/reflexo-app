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
  missCount?: number;     // wrong-circle taps (radar only) — each adds +200 ms to score
  invalidForAchievements?: boolean; // true when session had 3+ false starts
  falseStartCount?: number;         // total false starts in a partida session
  timeouts?: number;                // rounds that expired without a tap in alvo / radar
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
  } catch (e) {
    console.error('[storage] error:', e);
    return [];
  }
}

export async function saveSession(session: SessionRecord): Promise<void> {
  try {
    const all = await loadSessions();
    all.unshift(session);
    await AsyncStorage.setItem(KEY, JSON.stringify(all.slice(0, 200)));
  } catch (e) { console.error('[storage] error:', e); }
}

export async function clearSessions(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}

// ── Achievement unlock dates ──────────────────────────────────────────────────

export async function loadUnlockedAchievements(): Promise<Record<string, string>> {
  try {
    const raw = await AsyncStorage.getItem(ACH_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('[storage] error:', e);
    return {};
  }
}

export async function saveUnlockedAchievements(data: Record<string, string>): Promise<void> {
  try {
    await AsyncStorage.setItem(ACH_KEY, JSON.stringify(data));
  } catch (e) { console.error('[storage] error:', e); }
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
  } catch (e) {
    console.error('[storage] error:', e);
    return null;
  }
}

export async function saveWeeklySlots(slots: WeeklySlots): Promise<void> {
  try {
    await AsyncStorage.setItem(WEEKLY_SLOTS_KEY, JSON.stringify(slots));
  } catch (e) { console.error('[storage] error:', e); }
}

// ── Daily mission slots ───────────────────────────────────────────────────────

const DAILY_SLOTS_KEY = 'reflexo_daily_missions_v1';

export interface DailySlots {
  dayStart: number;
  slotIds: string[];
}

export async function loadDailySlots(): Promise<DailySlots | null> {
  try {
    const raw = await AsyncStorage.getItem(DAILY_SLOTS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error('[storage] error:', e);
    return null;
  }
}

export async function saveDailySlots(slots: DailySlots): Promise<void> {
  try {
    await AsyncStorage.setItem(DAILY_SLOTS_KEY, JSON.stringify(slots));
  } catch (e) { console.error('[storage] error:', e); }
}

// ── Onboarding flag ───────────────────────────────────────────────────────────

const ONBOARDING_KEY = 'reflexo_onboarding_done_v1';

export async function loadOnboardingDone(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(ONBOARDING_KEY);
    return raw === 'true';
  } catch (e) {
    console.error('[storage] error:', e);
    return false;
  }
}

export async function saveOnboardingDone(): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
  } catch (e) { console.error('[storage] error:', e); }
}

// ── First-game / triage-prompt flags ─────────────────────────────────────────

const FIRST_GAME_KEY = 'reflexo_has_played_first_game_v1';
const TRIAGE_PROMPT_KEY = 'reflexo_has_seen_triage_prompt_v1';

export async function loadHasPlayedFirstGame(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(FIRST_GAME_KEY);
    return raw === 'true';
  } catch (e) {
    console.error('[storage] error:', e);
    return false;
  }
}

export async function saveHasPlayedFirstGame(value: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(FIRST_GAME_KEY, value ? 'true' : 'false');
  } catch (e) { console.error('[storage] error:', e); }
}

export async function loadHasSeenTriagePrompt(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(TRIAGE_PROMPT_KEY);
    return raw === 'true';
  } catch (e) {
    console.error('[storage] error:', e);
    return false;
  }
}

export async function saveHasSeenTriagePrompt(value: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(TRIAGE_PROMPT_KEY, value ? 'true' : 'false');
  } catch (e) { console.error('[storage] error:', e); }
}

// ── clearUserData — remove todas as chaves do usuário, preserva energia ───────
//
// NÃO remove: reflexo_energy_v1 e reflexo_install_date_v1
// (evita hack de energia infinita via "Limpar todos os dados")
//
const USER_DATA_KEYS = [
  'reflexo_sessions_v1',
  'reflexo_achievements_v1',
  'reflexo_weekly_missions_v1',
  'reflexo_daily_missions_v1',
  'reflexo_onboarding_done_v1',
  'reflexo_has_played_first_game_v1',
  'reflexo_has_seen_triage_prompt_v1',
  'reflexo_user_profile_v1',
  'mode_unlocked_partida',
  'mode_unlocked_radar',
  'mode_unlocked_sequencia',
  'mode_unlocked_alvo',
] as const;

export async function clearUserData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([...USER_DATA_KEYS]);
  } catch (e) {
    console.error('[storage] clearUserData error:', e);
  }
}

// ── Progressive mode unlock ───────────────────────────────────────────────────
//
// Ordem de desbloqueio: Partida → Radar → Sequência → Alvo.
// Cada modo desbloqueia após 1 sessão completa do modo anterior.
// Estado persistido em AsyncStorage com chave mode_unlocked_{modeKey}.
//
export const MODE_UNLOCK_ORDER: ModeKey[] = ['partida', 'radar', 'sequencia', 'alvo'];

/** Modo que precisa ser concluído para desbloquear `mode` (null se sempre liberado). */
export function previousModeInChain(mode: ModeKey): ModeKey | null {
  const i = MODE_UNLOCK_ORDER.indexOf(mode);
  return i > 0 ? MODE_UNLOCK_ORDER[i - 1] : null;
}

/** Deriva o estado de desbloqueio a partir das sessões concluídas (fonte da verdade). */
export function computeModeUnlocks(sessions: SessionRecord[]): Record<ModeKey, boolean> {
  const played = new Set(sessions.map(s => s.mode));
  const unlocks: Record<ModeKey, boolean> = { partida: true, radar: false, sequencia: false, alvo: false };
  for (const mode of MODE_UNLOCK_ORDER) {
    const prev = previousModeInChain(mode);
    unlocks[mode] = prev === null ? true : played.has(prev);
  }
  return unlocks;
}

const MODE_UNLOCK_KEY = (mode: ModeKey) => `mode_unlocked_${mode}`;

/** Lê os flags persistidos de desbloqueio (partida sempre true). */
export async function loadModeUnlocks(): Promise<Record<ModeKey, boolean>> {
  const unlocks: Record<ModeKey, boolean> = { partida: true, radar: false, sequencia: false, alvo: false };
  try {
    const entries = await AsyncStorage.multiGet(MODE_UNLOCK_ORDER.map(MODE_UNLOCK_KEY));
    for (const [key, val] of entries) {
      const mode = MODE_UNLOCK_ORDER.find(m => MODE_UNLOCK_KEY(m) === key);
      if (mode && val === 'true') unlocks[mode] = true;
    }
  } catch (e) { console.error('[storage] loadModeUnlocks error:', e); }
  unlocks.partida = true;
  return unlocks;
}

/** Persiste o estado de desbloqueio (um flag por modo). */
export async function persistModeUnlocks(unlocks: Record<ModeKey, boolean>): Promise<void> {
  try {
    await AsyncStorage.multiSet(
      MODE_UNLOCK_ORDER.map(m => [MODE_UNLOCK_KEY(m), unlocks[m] ? 'true' : 'false']),
    );
  } catch (e) { console.error('[storage] persistModeUnlocks error:', e); }
}

export function getBestByMode(sessions: SessionRecord[]): Record<ModeKey, number | null> {
  const best: Record<ModeKey, number | null> = { partida: null, alvo: null, sequencia: null, radar: null };
  for (const s of sessions) {
    // Alvo and Radar: prefer bestTime (single raw RT without penalty) over score (penalised average)
    const value = (s.mode === 'alvo' || s.mode === 'radar') ? (s.bestTime ?? s.score) : s.score;
    if (best[s.mode] === null || value < best[s.mode]!) {
      best[s.mode] = value;
    }
  }
  return best;
}
