import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface GlobalScreenProps {
  isGuest?: boolean;
}

export default function GlobalScreen({ isGuest }: GlobalScreenProps) {
  if (isGuest) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>GLOBAL</Text>
        <Text style={styles.subtitle}>🌐</Text>
        <Text style={styles.message}>Faça login para ver{'\n'}o ranking global</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>GLOBAL</Text>
      <Text style={styles.message}>Ranking em breve...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1E',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  title: {
    fontSize: 32,
    color: '#00E5CC',
    fontFamily: 'BebasNeue_400Regular',
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 48,
  },
  message: {
    fontSize: 16,
    color: '#8899AA',
    fontFamily: 'DMSans_400Regular',
    textAlign: 'center',
    lineHeight: 24,
  },
});
