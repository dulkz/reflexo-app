import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { AudioPlayer, AudioStatus } from 'expo-audio';

export type SfxName = 'hit' | 'miss' | 'record' | 'milestone';

const ASSETS: Record<SfxName, number> = {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  hit:       require('../assets/sounds/hit.wav'),
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  miss:      require('../assets/sounds/miss.wav'),
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  record:    require('../assets/sounds/record.wav'),
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  milestone: require('../assets/sounds/milestone.wav'),
};

const players: Partial<Record<SfxName, AudioPlayer>> = {};
let preloadPromise: Promise<void> | null = null;

// Waits for the player to finish loading the asset, up to timeoutMs.
// Resolves immediately if already loaded; resolves after timeout if the
// playbackStatusUpdate event never fires isLoaded=true (graceful fallback).
function waitForLoad(player: AudioPlayer, timeoutMs = 3000): Promise<void> {
  return new Promise((resolve) => {
    if (player.isLoaded) { resolve(); return; }
    const timer = setTimeout(resolve, timeoutMs);
    const sub = player.addListener('playbackStatusUpdate', (status: AudioStatus) => {
      if (status.isLoaded) {
        clearTimeout(timer);
        sub.remove();
        resolve();
      }
    });
  });
}

// setAudioModeAsync is called first (before any createAudioPlayer) so the global
// mode — including playsInSilentMode — is applied to all players created after.
// preloadPromise stores the in-flight work so playSfx() can await it and
// still play correctly even on the very first tap of a session.
export function preloadSounds(): void {
  preloadPromise = (async () => {
    try {
      await setAudioModeAsync({
        playsInSilentMode: false,
        shouldPlayInBackground: false,
        interruptionMode: 'duckOthers',
      });
      for (const name of Object.keys(ASSETS) as SfxName[]) {
        const player = createAudioPlayer(ASSETS[name]);
        await waitForLoad(player); // BUG-1: wait for asset to be truly ready
        players[name] = player;
      }
    } catch {
      // non-critical — app works fine without audio
    }
  })();
}

// Awaits preloadPromise so even the first playSfx call in a session is
// guaranteed to find a loaded player. Fire-and-forget at all call sites.
export async function playSfx(name: SfxName): Promise<void> {
  try {
    if (preloadPromise) await preloadPromise;
    const player = players[name];
    if (!player) return;
    await player.seekTo(0);
    player.play();
  } catch {
    // non-critical
  }
}
