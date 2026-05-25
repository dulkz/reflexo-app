import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, Alert, ScrollView
} from 'react-native'
import { supabase } from '../lib/supabase'
import { useTranslation } from 'react-i18next'

// Tela de definição de nova senha — exibida pelo RootGate quando o evento
// PASSWORD_RECOVERY é emitido (usuário clicou no link de reset de senha).
// A sessão de recuperação já está ativa neste ponto, então updateUser
// pode alterar a senha diretamente.
type Props = { onDone: () => void }

export default function NewPasswordScreen({ onDone }: Props) {
  const { t } = useTranslation()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (password.length < 6) {
      Alert.alert(t('auth.passwordTooShort'))
      return
    }
    if (password !== confirm) {
      Alert.alert(t('auth.passwordMismatch'))
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        Alert.alert(t('auth.error'), error.message)
        return
      }
      Alert.alert(
        t('auth.passwordUpdated'),
        t('auth.passwordUpdatedMsg'),
        [{ text: t('common.ok'), onPress: onDone }],
      )
    } catch (err) {
      Alert.alert(t('auth.errorNoConnection'), t('auth.errorNoConnectionMsg'))
    } finally {
      setLoading(false)
    }
  }

  // Cancelar: encerra a sessão de recuperação e volta ao fluxo normal de auth.
  async function handleCancel() {
    try { await supabase.auth.signOut() } catch (_) {}
    onDone()
  }

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
        <Text style={styles.subtitle}>{t('auth.newPasswordTitle')}</Text>

        <View style={styles.card}>
          <Text style={styles.title}>{t('auth.newPasswordPrompt')}</Text>

          <TextInput
            style={styles.input}
            placeholder={t('auth.newPassword')}
            placeholderTextColor="#4A5A7B"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder={t('auth.confirmPassword')}
            placeholderTextColor="#4A5A7B"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#0A0F1E" />
              : <Text style={styles.buttonText}>{t('auth.savePassword')}</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.forgotBtn} onPress={handleCancel}>
            <Text style={styles.forgotText}>{t('auth.cancelLogout')}</Text>
          </TouchableOpacity>
        </View>
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
  title: { fontSize: 18, color: '#E0E6F0', fontWeight: '700', marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: '#080E1C', borderWidth: 1, borderColor: '#1E2D4A', borderRadius: 10, padding: 14, color: '#E0E6F0', marginBottom: 12, fontSize: 15 },
  button: { backgroundColor: '#00E5CC', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 4 },
  buttonText: { color: '#0A0F1E', fontWeight: '700', fontSize: 15, letterSpacing: 1 },
  forgotBtn: { alignItems: 'center', marginTop: 14 },
  forgotText: { color: '#7A8BAA', fontSize: 13, textDecorationLine: 'underline' },
})
