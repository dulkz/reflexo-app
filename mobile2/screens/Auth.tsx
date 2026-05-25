import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, Alert, ScrollView
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '../lib/supabase'
import { getAuthRedirectUrl } from '../lib/linking'
import { useTranslation } from 'react-i18next'

type Mode = 'login' | 'signup' | 'reset'

type Props = { onContinueAsGuest?: () => void }

// Detecta erros de rede (sem internet) nas respostas/exceções do Supabase
const isNetworkError = (msg: string) =>
  /fetch failed|network request failed|failed to fetch|networkerror/i.test(msg)

export default function AuthScreen({ onContinueAsGuest }: Props) {
  const { t } = useTranslation()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!email) return
    setLoading(true)
    try {
      if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: getAuthRedirectUrl(),
        })
        if (error && isNetworkError(error.message)) {
          Alert.alert(t('auth.errorNoConnection'), t('auth.errorNoConnectionMsg'))
          return
        }
        if (error) {
          Alert.alert(t('auth.error'), error.message)
        } else {
          Alert.alert(t('auth.resetSentTitle'), t('auth.resetSentMsg'))
          setMode('login')
        }
        return
      }

      if (!password) return

      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error && isNetworkError(error.message)) {
          Alert.alert(t('auth.errorNoConnection'), t('auth.errorNoConnectionMsg'))
          return
        }
        if (error) Alert.alert(t('auth.errorLogin'), error.message)
      } else {
        if (!username.trim()) {
          Alert.alert(t('auth.usernameRequired'))
          return
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: getAuthRedirectUrl() },
        })
        if (error && isNetworkError(error.message)) {
          Alert.alert(t('auth.errorNoConnection'), t('auth.errorNoConnectionMsg'))
          return
        }
        if (error) { Alert.alert(t('auth.errorSignup'), error.message); return }
        if (data.user) {
          // Salva o username para aplicar após a confirmação de email (no SIGNED_IN do App.tsx).
          // UPDATE direto aqui não funciona: signUp com confirmação de email não retorna
          // sessão, logo não há usuário autenticado para satisfazer a RLS de profiles.
          await AsyncStorage.setItem('reflexo_pending_username', username.trim())
        }
        Alert.alert(
          t('auth.accountCreated'),
          t('auth.accountCreatedMsg'),
          [{ text: 'OK' }]
        )
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (isNetworkError(msg)) {
        Alert.alert(t('auth.errorNoConnection'), t('auth.errorNoConnectionMsg'))
      } else {
        Alert.alert(t('auth.error'), t('auth.errorGeneric'))
      }
    } finally {
      setLoading(false)
    }
  }

  const isReset = mode === 'reset'

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.logo}>REFLEXO</Text>
        <Text style={styles.subtitle}>{t('auth.subtitle')}</Text>

        <View style={styles.card}>
          {!isReset && (
            <View style={styles.tabs}>
              <TouchableOpacity
                style={[styles.tabBtn, mode === 'login' && styles.tabActive]}
                onPress={() => setMode('login')}
                accessibilityRole="button"
                accessibilityLabel={t('auth.login')}
              >
                <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>{t('auth.login')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabBtn, mode === 'signup' && styles.tabActive]}
                onPress={() => setMode('signup')}
                accessibilityRole="button"
                accessibilityLabel={t('auth.signup')}
              >
                <Text style={[styles.tabText, mode === 'signup' && styles.tabTextActive]}>{t('auth.signup')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {isReset && (
            <Text style={styles.resetTitle}>{t('auth.reset')}</Text>
          )}

          {mode === 'signup' && (
            <TextInput
              style={styles.input}
              placeholder={t('auth.usernamePublic')}
              placeholderTextColor="#4A5A7B"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              maxLength={20}
            />
          )}

          <TextInput
            style={styles.input}
            placeholder={t('auth.email')}
            placeholderTextColor="#4A5A7B"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          {!isReset && (
            <TextInput
              style={styles.input}
              placeholder={t('auth.password')}
              placeholderTextColor="#4A5A7B"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          )}

          <TouchableOpacity
            style={styles.button}
            onPress={handleSubmit}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel={mode === 'login' ? t('auth.btnLogin') : mode === 'signup' ? t('auth.btnSignup') : t('auth.btnReset')}
          >
            {loading
              ? <ActivityIndicator color="#0A0F1E" />
              : <Text style={styles.buttonText}>
                  {mode === 'login' ? t('auth.btnLogin') : mode === 'signup' ? t('auth.btnSignup') : t('auth.btnReset')}
                </Text>
            }
          </TouchableOpacity>

          {mode === 'login' && (
            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={() => setMode('reset')}
              accessibilityRole="link"
              accessibilityLabel={t('auth.forgotPassword')}
            >
              <Text style={styles.forgotText}>{t('auth.forgotPassword')}</Text>
            </TouchableOpacity>
          )}

          {isReset && (
            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={() => setMode('login')}
              accessibilityRole="link"
              accessibilityLabel={t('auth.backToLogin')}
            >
              <Text style={styles.forgotText}>{t('auth.backToLogin')}</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          accessibilityRole="link"
          accessibilityLabel={t('auth.continueAsGuest')}
          onPress={async () => {
            await AsyncStorage.setItem('reflexo_guest', 'true')
            onContinueAsGuest?.()
          }}
        >
          <Text style={styles.skip}>{t('auth.continueAsGuest')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0F1E' },
  scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  logo: { fontFamily: 'BebasNeue_400Regular', fontSize: 48, color: '#FFFFFF', letterSpacing: 6 },
  subtitle: { fontSize: 13, color: '#7A8BAA', letterSpacing: 4, marginBottom: 40, marginTop: 4 },
  card: { width: '100%', backgroundColor: '#0D1530', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#1E2D4A' },
  tabs: { flexDirection: 'row', marginBottom: 20, backgroundColor: '#080E1C', borderRadius: 10, padding: 4 },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#00E5CC22' },
  tabText: { fontSize: 14, color: '#7A8BAA', fontWeight: '600' },
  tabTextActive: { color: '#00E5CC' },
  resetTitle: { fontSize: 18, color: '#E0E6F0', fontWeight: '700', marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: '#080E1C', borderWidth: 1, borderColor: '#1E2D4A', borderRadius: 10, padding: 14, color: '#E0E6F0', marginBottom: 12, fontSize: 15 },
  button: { backgroundColor: '#00E5CC', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 4 },
  buttonText: { color: '#0A0F1E', fontWeight: '700', fontSize: 15, letterSpacing: 1 },
  forgotBtn: { alignItems: 'center', marginTop: 14 },
  forgotText: { color: '#7A8BAA', fontSize: 13, textDecorationLine: 'underline' },
  skip: { color: '#4A5A7B', fontSize: 13, marginTop: 24, textDecorationLine: 'underline' },
})
