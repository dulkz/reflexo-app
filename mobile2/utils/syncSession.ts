/**
 * syncSession — envia uma sessão concluída para o Supabase.
 *
 * Fire-and-forget: nunca lança exceção para o caller.
 * O app funciona 100% offline; o Supabase é oportunista.
 */
import { supabase } from '../lib/supabase';
import { SessionRecord } from './storage';

export async function syncSessionToSupabase(
  session: SessionRecord,
  userId: string,
): Promise<void> {
  try {
    const { error } = await supabase.from('sessions').insert({
      user_id:    userId,
      mode:       session.mode,
      score:      session.score,       // tempo médio em ms
      best_time:  session.bestTime,
      rounds:     session.rounds,
      played_at:  new Date(session.date).toISOString(),
      local_id:   session.id,          // idempotência: evita duplicata se reenviar
    });
    if (error) {
      // Log silencioso — não interrompe o fluxo offline
      console.warn('[syncSession] Supabase insert error:', error.message);
    }
  } catch (err) {
    console.warn('[syncSession] syncSessionToSupabase failed:', err);
  }
}
