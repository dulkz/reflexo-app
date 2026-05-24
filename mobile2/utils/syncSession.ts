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
    const { error } = await supabase.from('sessions').upsert({
      user_id: userId,
      mode: session.mode,
      avg_rt: session.score,                  // score local = tempo médio em ms
      rounds_completed: session.rounds,
      accuracy: session.accuracy ?? null,     // 0-1 (alvo/radar/sequencia); null em partida
      played_at: new Date(session.date).toISOString(),
    }, {
      onConflict: 'user_id,played_at,mode',
      ignoreDuplicates: true,
    });
    if (error) {
      // Log silencioso — não interrompe o fluxo offline
      console.warn('[syncSession] Supabase insert error:', error.message);
    }
  } catch (err) {
    console.warn('[syncSession] syncSessionToSupabase failed:', err);
  }
}
