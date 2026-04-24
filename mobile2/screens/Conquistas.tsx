import React, { useMemo, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Platform, StatusBar as RNStatusBar,
} from 'react-native';
import { SessionRecord } from '../utils/storage';
import { UserProfile } from '../types/user';
import { buildUserStats } from '../config/archetypes';
import { ACHIEVEMENTS, getUnlockedCount, RARITY_CONFIG, RarityKey } from '../config/achievements';
import { loadUnlockedAchievements, saveUnlockedAchievements } from '../utils/storage';

const TOP = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 44;
const DAY = 86_400_000;

const MONTH_ABBR = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

const RARITY_ORDER: RarityKey[] = ['lendario', 'epico', 'raro', 'dificil', 'medio', 'comum'];
const SECRET_COLOR = '#4a5a7b';
const RARITY_ICONS: Record<RarityKey, string> = {
  lendario: '💎', epico: '🔥', raro: '🌟', dificil: '⚡', medio: '🔷', comum: '⬜',
};

const GROUPED = (() => {
  const map = {} as Record<RarityKey, typeof ACHIEVEMENTS>;
  for (const r of RARITY_ORDER) map[r] = [];
  for (const a of ACHIEVEMENTS) map[a.rarity].push(a);
  return map;
})();

function formatUnlockDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTH_ABBR[d.getMonth()]} ${d.getFullYear()}`;
}

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

  const [unlockDates, setUnlockDates] = useState<Record<string, string>>({});

  useEffect(() => {
    loadUnlockedAchievements().then(stored => {
      const now = new Date().toISOString();
      let changed = false;
      const updated = { ...stored };
      for (const a of ACHIEVEMENTS) {
        if (a.unlocked(stats) && !updated[a.id]) {
          updated[a.id] = now;
          changed = true;
        }
      }
      if (changed) saveUnlockedAchievements(updated);
      setUnlockDates(updated);
    });
  }, [stats]);

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.kicker}>CONQUISTAS</Text>
          <Text style={styles.count}>
            {unlockedCount}/{ACHIEVEMENTS.length} desbloqueadas
          </Text>
        </View>

        {RARITY_ORDER.map(r => {
          const group = GROUPED[r];
          if (group.length === 0) return null;
          const cfg = RARITY_CONFIG[r];
          return (
            <View key={r}>
              <Text style={[styles.rarityHeader, { color: cfg.cor }]}>
                {RARITY_ICONS[r]} {cfg.label}
              </Text>
              <View style={styles.grid}>
                {group.map(a => {
                  const done = a.unlocked(stats);
                  const unlockDate = unlockDates[a.id];
                  const isSecret = !!a.secret && !done;
                  const badgeColor = isSecret ? SECRET_COLOR : cfg.cor;
                  const badgeLabel = isSecret ? 'SECRETA' : cfg.label;
                  const displayIcon = isSecret ? '🔒' : a.icon;
                  const displayName = isSecret ? '???' : a.name;
                  const displayDesc = isSecret ? 'Conquista secreta — descubra jogando' : a.description;
                  const progressText = done
                    ? `✓ Desbloqueada${unlockDate ? ` em ${formatUnlockDate(unlockDate)}` : ''}`
                    : isSecret ? '🔒 Bloqueada' : a.progress(stats);
                  return (
                    <View
                      key={a.id}
                      style={[
                        styles.cell,
                        {
                          borderWidth: 1.5,
                          borderColor: done ? cfg.cor : isSecret ? SECRET_COLOR + '66' : cfg.cor + '99',
                          opacity: done ? 1 : 0.65,
                        },
                      ]}
                    >
                      <View style={[
                        styles.rarityBadge,
                        { backgroundColor: badgeColor + '22', borderColor: badgeColor },
                      ]}>
                        <Text style={[styles.rarityBadgeText, { color: badgeColor }]}>
                          {badgeLabel}
                        </Text>
                      </View>
                      <Text style={styles.icon}>{displayIcon}</Text>
                      <Text style={styles.name}>{displayName}</Text>
                      <Text style={styles.desc} numberOfLines={2}>{displayDesc}</Text>
                      <View style={[styles.progressBar, done && styles.progressBarDone]}>
                        <Text style={[styles.progressLabel, done && styles.progressLabelDone]}>
                          {progressText}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}

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

  rarityHeader: {
    fontSize: 11, fontWeight: '800', letterSpacing: 1.5,
    marginTop: 20, marginBottom: 8,
  },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell: {
    width: '48%', backgroundColor: '#111a2e',
    borderRadius: 12, padding: 14,
    gap: 4,
  },
  rarityBadge: {
    position: 'absolute', top: 8, right: 8,
    borderWidth: 1, borderRadius: 4,
    paddingHorizontal: 4, paddingVertical: 2,
  },
  rarityBadgeText: { fontSize: 9, fontWeight: '700' },
  icon: { fontSize: 24 },
  name: { fontSize: 13, fontWeight: '800', color: '#fff' },
  desc: { fontSize: 11, color: '#4a5a7b', lineHeight: 16 },
  progressBar: {
    marginTop: 6, borderRadius: 4,
    backgroundColor: '#2a3a5a',
    paddingHorizontal: 8, paddingVertical: 4,
  },
  progressBarDone: { backgroundColor: 'rgba(16,185,129,0.15)' },
  progressLabel: { fontSize: 11, color: '#4a5a7b' },
  progressLabelDone: { color: '#10b981' },
});
