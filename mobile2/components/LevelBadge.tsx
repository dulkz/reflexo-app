import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LevelInfo } from '../utils/levels';

interface Props {
  level: LevelInfo;
  size?: 'sm' | 'md';
}

export default function LevelBadge({ level, size = 'md' }: Props) {
  const sm = size === 'sm';
  return (
    <View style={[styles.badge, { backgroundColor: level.bg }, sm && styles.badgeSm]}>
      <Text style={[styles.text, { color: level.color }, sm && styles.textSm]}>
        {level.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: 20, paddingHorizontal: 20, paddingVertical: 8 },
  badgeSm: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  text: { fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  textSm: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
});
