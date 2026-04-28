import React, { useMemo, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
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

const SECRET_TOTAL = ACHIEVEMENTS.filter(a => !!a.secret).length;

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

  const unlockedSorted = useMemo(
    () => ACHIEVEMENTS
      .filter(a => a.unlocked(stats))
      .sort((a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity)),
    [stats],
  );

  const [expanded, setExpanded] = useState<Record<string, boolean>>({ unlocked: true });
  // unlockDates must be declared before the useMemos that reference it (inline execution order)
  const [unlockDates, setUnlockDates] = useState<Record<string, string>>({});

  // A secret is "discovered" if the live stats check OR the persisted unlockDates record say so.
  // unlockDates is the definitive truth for achievements that were ever unlocked — guards against
  // edge cases where a.unlocked(stats) returns false after a session recompute.
  const lockedSecrets = useMemo(
    () => ACHIEVEMENTS.filter(a => !!a.secret && !a.unlocked(stats) && !unlockDates[a.id]),
    [stats, unlockDates],
  );
  const discoveredSecrets = useMemo(
    () => ACHIEVEMENTS
      .filter(a => !!a.secret && (a.unlocked(stats) || !!unlockDates[a.id]))
      .sort((a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity)),
    [stats, unlockDates],
  );
  const discoveredSecretsCount = discoveredSecrets.length;

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
            {unlockedCount}/{ACHIEVEMENTS.filter(a => !a.secret || a.unlocked(stats) || !!unlockDates[a.id]).length} desbloqueadas
          </Text>
        </View>

        {unlockedSorted.length > 0 && (() => {
          const isExpanded = expanded['unlocked'] !== false;
          return (
            <View>
              <TouchableOpacity
                style={[
                  styles.accordionHeader,
                  { backgroundColor: '#f59e0b' + (isExpanded ? '26' : '14') },
                ]}
                onPress={() => setExpanded(prev => ({ ...prev, unlocked: !(prev['unlocked'] !== false) }))}
                activeOpacity={0.8}
              >
                <Text style={[styles.accordionLabel, { color: '#f59e0b' }]}>🏆 DESBLOQUEADAS</Text>
                <View style={styles.accordionRight}>
                  <Text style={[styles.accordionCount, { color: '#f59e0b' }]}>
                    {unlockedSorted.length}
                  </Text>
                  <Text style={[styles.accordionArrow, { color: '#f59e0b' }]}>
                    {isExpanded ? '▼' : '▶'}
                  </Text>
                </View>
              </TouchableOpacity>
              {isExpanded && (
                <View style={styles.grid}>
                  {unlockedSorted.map(a => {
                    const cfg = RARITY_CONFIG[a.rarity];
                    const unlockDate = unlockDates[a.id];
                    return (
                      <View
                        key={a.id}
                        style={[styles.cell, { borderWidth: 1.5, borderColor: cfg.cor }]}
                      >
                        <View style={[styles.rarityBadge, { backgroundColor: cfg.cor + '22', borderColor: cfg.cor }]}>
                          <Text style={[styles.rarityBadgeText, { color: cfg.cor }]}>{cfg.label}</Text>
                        </View>
                        <Text style={styles.icon}>{a.icon}</Text>
                        <Text style={styles.name}>{a.name}</Text>
                        <Text style={styles.desc} numberOfLines={2}>{a.description}</Text>
                        <View style={[styles.progressBar, styles.progressBarDone]}>
                          <Text style={[styles.progressLabel, styles.progressLabelDone]}>
                            {`✓ Desbloqueada${unlockDate ? ` em ${formatUnlockDate(unlockDate)}` : ''}`}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })()}

        {RARITY_ORDER.map(r => {
          // Count only non-secret achievements for display — secrets live in their own section
          const nonSecretAll  = GROUPED[r].filter(a => !a.secret);
          if (nonSecretAll.length === 0) return null;
          const group = nonSecretAll.filter(a => !a.unlocked(stats));
          const cfg = RARITY_CONFIG[r];
          const unlockedCount = nonSecretAll.length - group.length;
          const allDone = group.length === 0;
          const isExpanded = expanded[r] === true;
          return (
            <View key={r}>
              <TouchableOpacity
                style={[
                  styles.accordionHeader,
                  { backgroundColor: cfg.cor + (isExpanded ? '26' : '14') },
                ]}
                onPress={() => !allDone && setExpanded(prev => ({ ...prev, [r]: !prev[r] }))}
                activeOpacity={allDone ? 1 : 0.8}
              >
                <Text style={[styles.accordionLabel, { color: allDone ? cfg.cor + '99' : cfg.cor }]}>
                  {RARITY_ICONS[r]} {cfg.label}
                </Text>
                <View style={styles.accordionRight}>
                  <Text style={[styles.accordionCount, { color: allDone ? cfg.cor + '99' : cfg.cor }]}>
                    {allDone ? '✓ Todas conquistadas' : `${unlockedCount}/${nonSecretAll.length}`}
                  </Text>
                  {!allDone && (
                    <Text style={[styles.accordionArrow, { color: cfg.cor }]}>
                      {isExpanded ? '▼' : '▶'}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
              {isExpanded && !allDone && (
              <View style={styles.grid}>
                {group.map(a => (
                  <View
                    key={a.id}
                    style={[styles.cell, { borderWidth: 1.5, borderColor: cfg.cor + '99', opacity: 0.65 }]}
                  >
                    <View style={[styles.rarityBadge, { backgroundColor: cfg.cor + '22', borderColor: cfg.cor }]}>
                      <Text style={[styles.rarityBadgeText, { color: cfg.cor }]}>{cfg.label}</Text>
                    </View>
                    <Text style={styles.icon}>{a.icon}</Text>
                    <Text style={styles.name}>{a.name}</Text>
                    <Text style={styles.desc} numberOfLines={2}>{a.description}</Text>
                    <View style={styles.progressBar}>
                      <Text style={styles.progressLabel}>{a.progress(stats)}</Text>
                    </View>
                  </View>
                ))}
              </View>
              )}
            </View>
          );
        })}

        {/* ══ SEÇÃO SECRETAS ══ */}
        {(() => {
          const isExpanded = expanded['secret'] === true;
          return (
            <View>
              <TouchableOpacity
                style={[
                  styles.accordionHeader,
                  { backgroundColor: SECRET_COLOR + (isExpanded ? '26' : '14') },
                ]}
                onPress={() => setExpanded(prev => ({ ...prev, secret: !prev['secret'] }))}
                activeOpacity={0.8}
              >
                <Text style={[styles.accordionLabel, { color: SECRET_COLOR }]}>
                  🔒 SECRETAS
                </Text>
                <View style={styles.accordionRight}>
                  <Text style={[styles.accordionCount, { color: SECRET_COLOR }]}>
                    {`${discoveredSecretsCount} descoberta${discoveredSecretsCount !== 1 ? 's' : ''} / ${SECRET_TOTAL} existem`}
                  </Text>
                  <Text style={[styles.accordionArrow, { color: SECRET_COLOR }]}>
                    {isExpanded ? '▼' : '▶'}
                  </Text>
                </View>
              </TouchableOpacity>
              {isExpanded && (
                <View>
                  {/* Descobertas — mostrar com nome e descrição reais */}
                  {discoveredSecrets.length > 0 && (
                    <View>
                      <Text style={styles.discoveredLabel}>✓ DESCOBERTAS</Text>
                      <View style={styles.grid}>
                        {discoveredSecrets.map(a => {
                          const cfg = RARITY_CONFIG[a.rarity];
                          const unlockDate = unlockDates[a.id];
                          return (
                            <View
                              key={a.id}
                              style={[styles.cell, { borderWidth: 1.5, borderColor: cfg.cor }]}
                            >
                              <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 2 }}>
                                <View style={[styles.rarityBadge, { backgroundColor: SECRET_COLOR + '22', borderColor: SECRET_COLOR }]}>
                                  <Text style={[styles.rarityBadgeText, { color: SECRET_COLOR }]}>SECRETA</Text>
                                </View>
                                <View style={[styles.rarityBadge, { backgroundColor: cfg.cor + '22', borderColor: cfg.cor }]}>
                                  <Text style={[styles.rarityBadgeText, { color: cfg.cor }]}>{cfg.label}</Text>
                                </View>
                              </View>
                              <Text style={styles.icon}>{a.icon}</Text>
                              <Text style={styles.name}>{a.name}</Text>
                              <Text style={styles.desc} numberOfLines={2}>{a.description}</Text>
                              <View style={[styles.progressBar, styles.progressBarDone]}>
                                <Text style={[styles.progressLabel, styles.progressLabelDone]}>
                                  {`✓ Desbloqueada${unlockDate ? ` em ${formatUnlockDate(unlockDate)}` : ''}`}
                                </Text>
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  )}
                  {/* Bloqueadas — ainda anônimas */}
                  {lockedSecrets.length > 0 ? (
                    <View style={styles.grid}>
                      {lockedSecrets.map(a => (
                        <View
                          key={a.id}
                          style={[styles.cell, { borderWidth: 1.5, borderColor: SECRET_COLOR + '66', opacity: 0.65 }]}
                        >
                          <View style={[styles.rarityBadge, { backgroundColor: SECRET_COLOR + '22', borderColor: SECRET_COLOR }]}>
                            <Text style={[styles.rarityBadgeText, { color: SECRET_COLOR }]}>SECRETA</Text>
                          </View>
                          <Text style={styles.icon}>🔒</Text>
                          <Text style={styles.name}>???</Text>
                          <Text style={styles.desc} numberOfLines={2}>Conquista secreta — descubra jogando</Text>
                          <View style={styles.progressBar}>
                            <Text style={styles.progressLabel}>🔒 Bloqueada</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : discoveredSecrets.length === 0 ? (
                    <View style={styles.secretHint}>
                      <Text style={styles.secretHintText}>
                        Jogue e descubra — algumas conquistas só aparecem quando você menos espera
                      </Text>
                    </View>
                  ) : null}
                </View>
              )}
            </View>
          );
        })()}

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

  accordionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 10, padding: 12, marginBottom: 8, marginTop: 8,
  },
  accordionLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
  accordionRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  accordionCount: { fontSize: 11, fontWeight: '700' },
  accordionArrow: { fontSize: 11, fontWeight: '700' },

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

  discoveredLabel: {
    fontSize: 10, fontWeight: '800', color: '#10b981', letterSpacing: 2,
    marginTop: 4, marginBottom: 8,
  },
  secretHint: {
    backgroundColor: '#111a2e', borderRadius: 10, borderWidth: 1,
    borderColor: SECRET_COLOR + '33', padding: 16, marginBottom: 8,
  },
  secretHintText: { fontSize: 13, color: SECRET_COLOR, textAlign: 'center', lineHeight: 20 },
});
