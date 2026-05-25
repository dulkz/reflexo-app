import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, Alert, ScrollView
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '../lib/supabase'
import { getAuthRedirectUrl } from '../lib/linking'

type Mode = 'login' | 'signup' | 'reset'

type Props = { onContinueAsGuest?: () => void }

export default function AuthScreen({ onContinueAsGuest }: Props) {
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
        if (error) {
          Alert.alert('Erro', error.message)
        } else {
          Alert.alert('Email enviado', 'Verifique sua caixa de entrada para redefinir a senha.')
          setMode('login')
        }
        return
      }

      if (!password) return

      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) Alert.alert('Erro ao entrar', error.message)
      } else {
        if (!username.trim()) {
          Alert.alert('Nome de usuário obrigatório')
          return
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: getAuthRedirectUrl() },
        })
        if (error) { Alert.alert('Erro ao cadastrar', error.message); return }
        if (data.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({ id: data.user.id, username: username.trim(), archetype: 'EXPLORADOR' })
          if (profileError) Alert.alert('Erro ao criar perfil', profileError.message)
        }
        Alert.alert(
          'Conta criada!',
          'Verifique seu email para confirmar o cadastro antes de fazer login.',
          [{ text: 'OK' }]
        )
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
        <Text style={styles.subtitle}>velocidade de reação</Text>

        <View style={styles.card}>
          {!isReset && (
            <View style={styles.tabs}>
              <TouchableOpacity
                style={[styles.tabBtn, mode === 'login' && styles.tabActive]}
                onPress={() => setMode('login')}
              >
                <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>Entrar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabBtn, mode === 'signup' && styles.tabActive]}
                onPress={() => setMode('signup')}
              >
                <Text style={[styles.tabText, mode === 'signup' && styles.tabTextActive]}>Criar conta</Text>
              </TouchableOpacity>
            </View>
          )}

          {isReset && (
            <Text style={styles.resetTitle}>Recuperar senha</Text>
          )}

          {mode === 'signup' && (
            <TextInput
              style={styles.input}
              placeholder="Nome de usuário público"
              placeholderTextColor="#4A5A7B"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              maxLength={20}
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#4A5A7B"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          {!isReset && (
            <TextInput
              style={styles.input}
              placeholder="Senha"
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
          >
            {loading
              ? <ActivityIndicator color="#0A0F1E" />
              : <Text style={styles.buttonText}>
                  {mode === 'login' ? 'ENTRAR' : mode === 'signup' ? 'CRIAR CONTA' : 'ENVIAR EMAIL'}
                </Text>
            }
          </TouchableOpacity>

          {mode === 'login' && (
            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={() => setMode('reset')}
            >
              <Text style={styles.forgotText}>Esqueci minha senha</Text>
            </TouchableOpacity>
          )}

          {isReset && (
            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={() => setMode('login')}
            >
              <Text style={styles.forgotText}>Voltar para o login</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          onPress={async () => {
            await AsyncStorage.setItem('reflexo_guest', 'true')
            onContinueAsGuest?.()
          }}
        >
          <Text style={styles.skip}>Continuar sem conta</Text>
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
