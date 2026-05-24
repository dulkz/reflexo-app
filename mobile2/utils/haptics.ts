import * as Haptics from 'expo-haptics';

// Thin wrappers around expo-haptics. Fire-and-forget; failures (e.g. unsupported
// platform) are swallowed so gameplay never breaks on a missing vibrator.

/** Short, clear single vibration — minor errors (e.g. Partida false start). */
export function hapticImpactMedium(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

/** Error-notification vibration — decision errors (Alvo/Sequência/Radar). */
export function hapticError(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
}

/** Light follow-up pulse — used as Sequência's second NoGo beat. */
export function hapticLight(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/** Heavy impact — the "weight" of a big moment (archetype evolution flash). */
export function hapticHeavy(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
}

/** Success notification — celebratory beat (archetype evolution particles). */
export function hapticSuccess(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}
