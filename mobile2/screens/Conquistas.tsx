import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Platform, StatusBar as RNStatusBar,
} from 'react-native';
import { SessionRecord } from '../utils/storage';
import { UserProfile } from '../types/user';
import { buildUserStats } from '../config/archetypes';
import { ACHIEVEMENTS, getUnlockedCount } from '../config/achievements';

const TOP = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 44;
const DAY = 86_400_000;

function computeStreak(sessions: SessionRecord[]): number {
  if (sessions.length === 0) return 0;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let s = 0;
  for (let i = 0; i < sessions.length; i++) {
    const d = new Date(sessions[i].date); d.setHours(0, 0, 0, 0);
    const diff = Math.round((today.getTime() - d.getTime()) / DAY);
    if (diff === s) s++;
    else if (diff > s) break;
  }
  return s;
}

interface Props {
  sessions: SessionRecord[];
  userProfile: UserProfile;
}

export default function Conquistas({ sessions, userProfile }: Props) {
  const streak = useMemo(() => computeStreak(sessions), [sessions]);
  const stats = useMemo(() => buildUserStats(sessions, streak), [sessions, streak]);
  const unlockedCount = useMemo(() => getUnlockedCount(stats), [stats]);

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.kicker}>CONQUISTAS</Text>
          <Text style={styles.count}>
            {unlockedCount}/{ACHIEVEMENTS.length} desbloqueadas
          </Text>
        </View>

        <View style={styles.grid}>
          {ACHIEVEMENTS.map(a => {
            const done = a.unlocked(stats);
            return (
              <View
                key={a.id}
                style={[styles.cell, !done && styles.cellLocked]}
              >
                <Text style={[styles.icon, !done && styles.iconLocked]}>{a.icon}</Text>
                <Text style={[styles.name, !done && styles.nameLocked]}>{a.name}</Text>
                <Text style={styles.desc} numberOfLines={2}>{a.description}</Text>
              </View>
            );
          })}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0b1220', paddingTop: TOP },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },

  header: {
    flexDirection: 'row', alignItems: 'baseline',
    justifyContent: 'space-between', marginBottom: 16,
  },
  kicker: { fontSize: 11, fontWeight: '700', color: '#3a4a6b', letterSpacing: 2 },
  count: { fontSize: 11, color: '#3a4a6b' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell: {
    width: '48%', backgroundColor: '#111a2e',
    borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    gap: 4,
  },
  cellLocked: { opacity: 0.4 },
  icon: { fontSize: 24 },
  iconLocked: { opacity: 0.5 },
  name: { fontSize: 13, fontWeight: '800', color: '#fff' },
  nameLocked: { color: '#3a4a6b' },
  desc: { fontSize: 11, color: '#4a5a7b', lineHeight: 16 },
});
