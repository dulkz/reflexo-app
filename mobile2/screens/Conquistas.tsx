import React, { useMemo, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Pressable,
  Platform, StatusBar as RNStatusBar,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { SessionRecord } from '../utils/storage';
import { UserProfile } from '../types/user';
import { saveUserProfile } from '../utils/userProfile';
import { buildUserStats } from '../config/archetypes';
import { ACHIEVEMENTS, Achievement, getUnlockedCount, RARITY_CONFIG, RarityKey } from '../config/achievements';
import { loadUnlockedAchievements, saveUnlockedAchievements } from '../utils/storage';
import { SvgXml } from 'react-native-svg';
import { ACHIEVEMENT_ICONS, RARITY_ICONS_SVG, UI_ICONS } from '../assets/icons';

const TOP = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 44;
const DAY = 86_400_000;

const RARITY_ORDER: RarityKey[] = ['lendario', 'epico', 'raro', 'dificil', 'medio', 'comum'];
const SECRET_COLOR = '#4a5a7b';
const RARITY_ICONS: Record<RarityKey, string> = {
  lendario: RARITY_ICONS_SVG.lendario,
  epico:    RARITY_ICONS_SVG.epico,
  raro:     RARITY_ICONS_SVG.raro,
  dificil:  RARITY_ICONS_SVG.dificil,
  medio:    RARITY_ICONS_SVG.medio,
  comum:    RARITY_ICONS_SVG.comum,
};

const GROUPED = (() => {
  const map = {} as Record<RarityKey, typeof ACHIEVEMENTS>;
  for (const r of RARITY_ORDER) map[r] = [];
  for (const a of ACHIEVEMENTS) map[a.rarity].push(a);
  return map;
})();

const SECRET_TOTAL = ACHIEVEMENTS.filter(a => !!a.secret).length;

function formatUnlockDate(iso: string, lang: string): string {
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'pt-BR', {
    day: 'numeric', month: 'short', year: 'numeric',
  }).format(new Date(iso));
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
  onUpdateProfile: (p: UserProfile) => void;
}

interface ContentProps {
  sessions: SessionRecord[];
  userProfile: UserProfile;
  onUpdateProfile: (p: UserProfile) => void;
  showHeader?: boolean;
}

export function ConquistasContent({ sessions, userProfile, onUpdateProfile, showHeader = true }: ContentProps) {
  const { t } = useTranslation();
  const lang = i18n.language;
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

  const visibleTotal = ACHIEVEMENTS.filter(a => !a.secret || a.unlocked(stats) || !!unlockDates[a.id]).length;

  const [selectedForTitle, setSelectedForTitle] = useState<Achievement | null>(null);

  const persistProfile = async (updated: UserProfile) => {
    await saveUserProfile(updated);
    onUpdateProfile(updated);
  };

  const handleEquipTitle = () => {
    if (!selectedForTitle) return;
    persistProfile({ ...userProfile, equippedTitle: selectedForTitle.id });
    setSelectedForTitle(null);
  };

  const handleRemoveTitle = () => {
    const { equippedTitle: _removed, ...rest } = userProfile;
    persistProfile(rest);
    setSelectedForTitle(null);
  };

  return (
    <View>
      {showHeader && (
        <View style={styles.header}>
          <Text style={styles.kicker}>{t('achievements.title')}</Text>
          <Text style={styles.count}>
            {t('achievements.unlockedFraction', { count: unlockedCount, total: visibleTotal })}
          </Text>
        </View>
      )}
      {!showHeader && (
        <Text style={styles.embedCount}>
          {t('achievements.unlockedFraction', { count: unlockedCount, total: visibleTotal })}
        </Text>
      )}

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
                <View style={styles.accordionLabelRow}>
                  <SvgXml xml={RARITY_ICONS_SVG.desbloqueadas} width={18} height={18} />
                  <Text style={[styles.accordionLabel, { color: '#f59e0b' }]}>{t('achievements.unlocked')}</Text>
                </View>
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
                    const isEquipped = userProfile.equippedTitle === a.id;
                    return (
                      <TouchableOpacity
                        key={a.id}
                        style={[
                          styles.cell,
                          { borderWidth: isEquipped ? 2.5 : 1.5, borderColor: cfg.cor },
                        ]}
                        onPress={() => setSelectedForTitle(a)}
                        activeOpacity={0.85}
                      >
                        <View style={[styles.rarityBadge, { backgroundColor: cfg.cor + '22', borderColor: cfg.cor }]}>
                          <Text style={[styles.rarityBadgeText, { color: cfg.cor }]}>{t(`achievements.rarity.${a.rarity}` as any)}</Text>
                        </View>
                        <SvgXml xml={a.icon} width={28} height={28} />
                        <Text style={styles.name}>{a.name}</Text>
                        <Text style={styles.desc} numberOfLines={2}>{a.description}</Text>
                        <View style={[styles.progressBar, styles.progressBarDone]}>
                          <Text style={[styles.progressLabel, styles.progressLabelDone]}>
                            {unlockDate
                              ? t('achievements.unlockedOn', { date: formatUnlockDate(unlockDate, lang) })
                              : t('achievements.unlockedNone')}
                          </Text>
                        </View>
                      </TouchableOpacity>
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
                <View style={styles.accordionLabelRow}>
                  <SvgXml xml={RARITY_ICONS[r]} width={18} height={18} style={{ opacity: allDone ? 0.5 : 1 }} />
                  <Text style={[styles.accordionLabel, { color: allDone ? cfg.cor + '99' : cfg.cor }]}>
                    {t(`achievements.rarity.${r}` as any)}
                  </Text>
                </View>
                <View style={styles.accordionRight}>
                  <Text style={[styles.accordionCount, { color: allDone ? cfg.cor + '99' : cfg.cor }]}>
                    {allDone ? t('achievements.allUnlocked') : t('achievements.progress', { current: unlockedCount, total: nonSecretAll.length })}
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
                      <Text style={[styles.rarityBadgeText, { color: cfg.cor }]}>{t(`achievements.rarity.${r}` as any)}</Text>
                    </View>
                    <SvgXml xml={a.icon} width={28} height={28} />
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
                <View style={styles.accordionLabelRow}>
                  <SvgXml xml={RARITY_ICONS_SVG.secretas} width={18} height={18} />
                  <Text style={[styles.accordionLabel, { color: SECRET_COLOR }]}>{t('achievements.secret')}</Text>
                </View>
                <View style={styles.accordionRight}>
                  <Text style={[styles.accordionCount, { color: SECRET_COLOR }]}>
                    {t('achievements.secretSummary', { count: discoveredSecretsCount, total: SECRET_TOTAL })}
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
                      <Text style={styles.discoveredLabel}>{t('achievements.discovered')}</Text>
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
                                  <Text style={[styles.rarityBadgeText, { color: SECRET_COLOR }]}>{t('achievements.secret_badge')}</Text>
                                </View>
                                <View style={[styles.rarityBadge, { backgroundColor: cfg.cor + '22', borderColor: cfg.cor }]}>
                                  <Text style={[styles.rarityBadgeText, { color: cfg.cor }]}>{t(`achievements.rarity.${a.rarity}` as any)}</Text>
                                </View>
                              </View>
                              <SvgXml xml={a.icon} width={28} height={28} />
                              <Text style={styles.name}>{a.name}</Text>
                              <Text style={styles.desc} numberOfLines={2}>{a.description}</Text>
                              <View style={[styles.progressBar, styles.progressBarDone]}>
                                <Text style={[styles.progressLabel, styles.progressLabelDone]}>
                                  {unlockDate
                                    ? t('achievements.unlockedOn', { date: formatUnlockDate(unlockDate, lang) })
                                    : t('achievements.unlockedNone')}
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
                            <Text style={[styles.rarityBadgeText, { color: SECRET_COLOR }]}>{t('achievements.secret_badge')}</Text>
                          </View>
                          <SvgXml xml={ACHIEVEMENT_ICONS.streak100} width={28} height={28} />
                          <Text style={styles.name}>???</Text>
                          <Text style={styles.desc} numberOfLines={2}>{t('achievements.secretHint')}</Text>
                          <View style={styles.progressBar}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                              <SvgXml xml={UI_ICONS.lock} width={11} height={11} />
                              <Text style={styles.progressLabel}>{t('achievements.lockedState')}</Text>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : discoveredSecrets.length === 0 ? (
                    <View style={styles.secretHint}>
                      <Text style={styles.secretHintText}>{t('achievements.secretEmpty')}</Text>
                    </View>
                  ) : null}
                </View>
              )}
            </View>
          );
        })()}

      {/* ══ MODAL — Equipar título ══ */}
      <Modal
        visible={selectedForTitle !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedForTitle(null)}
      >
        <Pressable style={styles.titleModalOverlay} onPress={() => setSelectedForTitle(null)}>
          {selectedForTitle && (() => {
            const cfg = RARITY_CONFIG[selectedForTitle.rarity];
            const isEquipped = userProfile.equippedTitle === selectedForTitle.id;
            return (
              <Pressable style={styles.titleModalCard} onPress={() => {}}>
                <View style={styles.titleModalIconWrap}>
                  <SvgXml xml={selectedForTitle.icon} width={40} height={40} />
                </View>
                <Text style={styles.titleModalName}>{selectedForTitle.name}</Text>
                <Text
                  style={[
                    styles.titleModalPreview,
                    {
                      color: cfg.cor,
                      textShadowColor: cfg.cor,
                      textShadowOffset: { width: 0, height: 0 },
                      textShadowRadius: 8,
                    },
                  ]}
                  numberOfLines={1}
                >
                  ✦ {selectedForTitle.title} ✦
                </Text>
                <Text style={styles.titleModalHint}>{t('achievements.titleSubtitleHint')}</Text>
                {isEquipped ? (
                  <TouchableOpacity
                    style={[styles.titleModalBtnPrimary, { backgroundColor: '#ef4444' }]}
                    onPress={handleRemoveTitle}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.titleModalBtnPrimaryText}>{t('achievements.removeTitle')}</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.titleModalBtnPrimary, { backgroundColor: cfg.cor }]}
                    onPress={handleEquipTitle}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.titleModalBtnPrimaryText}>{t('achievements.equipTitle')}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.titleModalBtnGhost}
                  onPress={() => setSelectedForTitle(null)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.titleModalBtnGhostText}>{t('common.close')}</Text>
                </TouchableOpacity>
              </Pressable>
            );
          })()}
        </Pressable>
      </Modal>

    </View>
  );
}

export default function Conquistas({ sessions, userProfile, onUpdateProfile }: Props) {
  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ConquistasContent
          sessions={sessions}
          userProfile={userProfile}
          onUpdateProfile={onUpdateProfile}
          showHeader
        />
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
  embedCount: { fontSize: 11, color: '#3a4a6b', marginBottom: 8, textAlign: 'right' },

  rarityHeader: {
    fontSize: 11, fontWeight: '800', letterSpacing: 1.5,
    marginTop: 20, marginBottom: 8,
  },

  accordionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 10, padding: 12, marginBottom: 8, marginTop: 8,
  },
  accordionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
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

  // ── Modal: equipar título ──────────────────────────────────────────────────
  titleModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  titleModalCard: {
    backgroundColor: '#111a2e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: 'center',
    gap: 10,
  },
  titleModalIconWrap: {
    width: 56, height: 56,
    borderRadius: 28,
    backgroundColor: '#1a2540',
    alignItems: 'center', justifyContent: 'center',
  },
  titleModalName: { fontSize: 18, fontWeight: '900', color: '#fff', textAlign: 'center' },
  titleModalPreview: { fontSize: 16, fontWeight: '800', letterSpacing: 1, textAlign: 'center' },
  titleModalHint: {
    fontSize: 12, color: '#4a5a7b', textAlign: 'center',
    marginTop: 2, marginBottom: 10,
  },
  titleModalBtnPrimary: {
    alignSelf: 'stretch',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  titleModalBtnPrimaryText: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 1 },
  titleModalBtnGhost: {
    alignSelf: 'stretch',
    paddingVertical: 12,
    alignItems: 'center',
  },
  titleModalBtnGhostText: { color: '#4a5a7b', fontSize: 13, fontWeight: '700' },
});
