/**
 * migrateLocalSessions — envia todas as sessões do AsyncStorage para o Supabase
 * no primeiro login do usuário. Fire-and-forget, nunca bloqueia o fluxo de auth.
 *
 * Roda apenas uma vez por usuário: após concluir, persiste a flag
 * reflexo_migration_done_{userId} no AsyncStorage para não repetir.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { loadSessions } from './storage';

const migrationKey = (userId: string) => `reflexo_migration_done_${userId}`;

export async function migrateLocalSessions(userId: string): Promise<void> {
  try {
    // Já migrou para este usuário? Sai imediatamente.
    const done = await AsyncStorage.getItem(migrationKey(userId));
    if (done) return;

    const sessions = await loadSessions();
    if (!sessions.length) {
      await AsyncStorage.setItem(migrationKey(userId), '1');
      return;
    }

    const rows = sessions.map(s => ({
      user_id:          userId,
      mode:             s.mode,
      avg_rt:           s.score,
      rounds_completed: s.rounds,
      accuracy:         null,
      played_at:        new Date(s.date).toISOString(),
    }));

    // Upsert em lote — ignora duplicatas por (user_id, played_at, mode) na re-migração
    const { error } = await supabase.from('sessions').upsert(rows, {
      onConflict: 'user_id,played_at,mode',
      ignoreDuplicates: true,
    });

    if (error) {
      console.warn('[migrateLocalSessions] insert error:', error.message);
      // NÃO marca como feito — tentará novamente no próximo login
      return;
    }

    // Marca migração como concluída para este usuário
    await AsyncStorage.setItem(migrationKey(userId), '1');
    console.log(`[migrateLocalSessions] ${rows.length} sessões migradas.`);
  } catch (err) {
    console.warn('[migrateLocalSessions] falhou:', err);
    // Silencioso — tentará novamente no próximo login
  }
}

export async function resetMigrationFlag(userId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(`reflexo_migration_done_${userId}`);
  } catch (_) {}
}
