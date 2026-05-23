import AsyncStorage from '@react-native-async-storage/async-storage';
import { ModeKey } from './levels';
import { GRACE_PERIOD_DAYS, MAX_ENERGY_PER_MODE, PREMIUM_ACTIVE } from '../config/monetization';

// Assinante Premium → energia infinita (sem consumo, badge mostra ∞).
export function hasInfiniteEnergy(): boolean {
  return PREMIUM_ACTIVE;
}

// ── Chaves — NÃO incluídas no clearUserData() ───────────────────────────────
export const ENERGY_KEY        = 'reflexo_energy_v1';
export const INSTALL_DATE_KEY  = 'reflexo_install_date_v1';

// ── Tipos ────────────────────────────────────────────────────────────────────

export interface EnergyData {
  /** Energia restante por modo */
  counts: Record<ModeKey, number>;
  /** Timestamp da meia-noite do dia atual (para detectar reset) */
  dayStart: number;
}

// ── Helpers internos ─────────────────────────────────────────────────────────

function getDayStart(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

const FULL_ENERGY: Record<ModeKey, number> = {
  partida:  MAX_ENERGY_PER_MODE,
  alvo:     MAX_ENERGY_PER_MODE,
  sequencia: MAX_ENERGY_PER_MODE,
  radar:    MAX_ENERGY_PER_MODE,
};

// ── Load / Save de energia ───────────────────────────────────────────────────

/**
 * Carrega energia do storage.
 * Auto-reseta para MAX_ENERGY_PER_MODE se o dia mudou desde o último carregamento.
 */
export async function loadEnergy(): Promise<EnergyData> {
  try {
    const raw = await AsyncStorage.getItem(ENERGY_KEY);
    if (!raw) {
      const fresh: EnergyData = { counts: { ...FULL_ENERGY }, dayStart: getDayStart() };
      await AsyncStorage.setItem(ENERGY_KEY, JSON.stringify(fresh));
      return fresh;
    }
    const parsed: EnergyData = JSON.parse(raw);
    const today = getDayStart();
    if (parsed.dayStart < today) {
      // Novo dia — repõe energia diária (reset para 5, não reduz stockpile acima de 5)
      const reset: EnergyData = {
        counts: {
          partida:   Math.max(parsed.counts.partida ?? 0,  MAX_ENERGY_PER_MODE),
          alvo:      Math.max(parsed.counts.alvo ?? 0,     MAX_ENERGY_PER_MODE),
          sequencia: Math.max(parsed.counts.sequencia ?? 0, MAX_ENERGY_PER_MODE),
          radar:     Math.max(parsed.counts.radar ?? 0,    MAX_ENERGY_PER_MODE),
        },
        dayStart: today,
      };
      await AsyncStorage.setItem(ENERGY_KEY, JSON.stringify(reset));
      return reset;
    }
    return parsed;
  } catch (e) {
    console.error('[energy] loadEnergy error:', e);
    return { counts: { ...FULL_ENERGY }, dayStart: getDayStart() };
  }
}

export async function saveEnergy(data: EnergyData): Promise<void> {
  try {
    await AsyncStorage.setItem(ENERGY_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('[energy] saveEnergy error:', e);
  }
}

// ── Data de instalação ───────────────────────────────────────────────────────

export async function loadInstallDate(): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(INSTALL_DATE_KEY);
    return raw ? parseInt(raw, 10) : null;
  } catch (e) {
    console.error('[energy] loadInstallDate error:', e);
    return null;
  }
}

/**
 * Garante que a data de instalação existe.
 * Se não existe (primeira abertura), registra o timestamp atual.
 */
export async function ensureInstallDate(): Promise<number> {
  try {
    const existing = await loadInstallDate();
    if (existing !== null) return existing;
    const now = Date.now();
    await AsyncStorage.setItem(INSTALL_DATE_KEY, String(now));
    return now;
  } catch (e) {
    console.error('[energy] ensureInstallDate error:', e);
    return Date.now();
  }
}

// ── Período de graça ─────────────────────────────────────────────────────────

export function isInGracePeriod(installDate: number): boolean {
  const graceDurationMs = GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() < installDate + graceDurationMs;
}

export function getGraceExpiryMs(installDate: number): number {
  return installDate + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000;
}

/** Retorna horas e minutos restantes do período de graça. */
export function getGraceTimeLeft(installDate: number): { hours: number; minutes: number } {
  const msLeft = Math.max(0, getGraceExpiryMs(installDate) - Date.now());
  return {
    hours:   Math.floor(msLeft / (60 * 60 * 1000)),
    minutes: Math.floor((msLeft % (60 * 60 * 1000)) / 60_000),
  };
}

/** Formata tempo restante da graça para exibição no badge. */
export function formatGraceTimeLeft(installDate: number): string {
  const { hours, minutes } = getGraceTimeLeft(installDate);
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return '<1m';
}

// ── Operações de energia ─────────────────────────────────────────────────────

/**
 * Retorna true se o modo tem energia disponível para jogar.
 * Considera: período de graça (sempre pode jogar) e contagem restante.
 */
export function hasEnergy(
  mode: ModeKey,
  data: EnergyData,
  installDate: number | null,
): boolean {
  if (hasInfiniteEnergy()) return true;
  if (installDate !== null && isInGracePeriod(installDate)) return true;
  return data.counts[mode] > 0;
}

/**
 * Consome 1 energia do modo. Persiste imediatamente.
 * Retorna o estado atualizado.
 */
export async function consumeEnergy(
  mode: ModeKey,
  data: EnergyData,
): Promise<EnergyData> {
  const updated: EnergyData = {
    ...data,
    counts: {
      ...data.counts,
      [mode]: Math.max(0, data.counts[mode] - 1),
    },
  };
  await saveEnergy(updated);
  return updated;
}

/**
 * Adiciona N energias ao modo especificado (ou a todos os modos se 'all').
 * Sem cap máximo — energia comprada pode acumular.
 * Persiste imediatamente. Retorna estado atualizado.
 */
export async function addEnergy(
  mode: ModeKey | 'all',
  amount: number,
  data: EnergyData,
): Promise<EnergyData> {
  const newCounts = { ...data.counts };
  if (mode === 'all') {
    (Object.keys(newCounts) as ModeKey[]).forEach(k => { newCounts[k] += amount; });
  } else {
    newCounts[mode] += amount;
  }
  const updated: EnergyData = { ...data, counts: newCounts };
  await saveEnergy(updated);
  return updated;
}

// ── Countdown do reset diário ────────────────────────────────────────────────

export function getNextResetMs(): number {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.getTime();
}

export interface TimeUntilReset {
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}

export function getTimeUntilReset(): TimeUntilReset {
  const totalMs = Math.max(0, getNextResetMs() - Date.now());
  return {
    hours:   Math.floor(totalMs / (60 * 60 * 1000)),
    minutes: Math.floor((totalMs % (60 * 60 * 1000)) / 60_000),
    seconds: Math.floor((totalMs % 60_000) / 1000),
    totalMs,
  };
}

/** Formata o countdown de reset no padrão HH:MM:SS. */
export function formatResetCountdown(t: TimeUntilReset): string {
  const hh = String(t.hours).padStart(2, '0');
  const mm = String(t.minutes).padStart(2, '0');
  const ss = String(t.seconds).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}
