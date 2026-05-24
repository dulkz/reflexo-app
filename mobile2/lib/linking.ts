/**
 * linking.ts — utilitários de deep link para auth callbacks.
 * Usa expo-linking para gerar URLs compatíveis com dev (exp://) e produção (reflexo://).
 */
import * as Linking from 'expo-linking';

/**
 * Retorna a URL de callback para auth do Supabase.
 * Em dev (Expo Go): exp://IP:8081/--/auth-callback
 * Em produção (standalone): reflexo://auth-callback
 */
export function getAuthRedirectUrl(): string {
  return Linking.createURL('auth-callback');
}
