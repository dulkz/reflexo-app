import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, ActivityIndicator, RefreshControl, Modal,
} from 'react-native';
import { supabase } from '../lib/supabase';

type GameMode = 'partida' | 'radar' | 'sequencia' | 'alvo';

interface RankingEntry {
  position: number;
  user_id: string;
  username: string;
  archetype: string;
  avg_rt: number;
  session_count: number;
}

interface GlobalScreenProps {
  isGuest?: boolean;
}

const MODES: { key: GameMode; label: string }[] = [
  { key: 'partida',   label: 'PARTIDA' },
  { key: 'radar',     label: 'RADAR' },
  { key: 'sequencia', label: 'SEQUÊNCIA' },
  { key: 'alvo',      label: 'ALVO' },
];

const CROWN: Record<number, string> = { 1: '👑', 2: '🥈', 3: '🥉' };

function formatTime(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export default function GlobalScreen({ isGuest }: GlobalScreenProps) {
  const [mode, setMode] = useState<GameMode>('partida');
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<RankingEntry | null>(null);

  // Pega o user_id da sessão atual
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setCurrentUserId(data.session?.user?.id ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUserId(session?.user?.id ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const fetchRanking = useCallback(async (selectedMode: GameMode, silent = false) => {
    if (!silent) setLoading(true);
    try {
      // View `ranking` (Supabase): user_id, username, archetype, mode, avg_rt_global,
      // session_count, rank_position. O mínimo de 3 sessões já é filtrado na própria view.
      const { data, error } = await supabase
        .from('ranking')
        .select('user_id, username, archetype, avg_rt_global, session_count, rank_position')
        .eq('mode', selectedMode)
        .order('avg_rt_global', { ascending: true })
        .limit(50);

      if (error) throw error;

      const entries: RankingEntry[] = (data ?? []).map((row) => ({
        position: row.rank_position,
        user_id: row.user_id,
        username: row.username ?? 'Anônimo',
        archetype: row.archetype ?? '—',
        avg_rt: row.avg_rt_global,
        session_count: row.session_count,
      }));

      setRanking(entries);
    } catch (err) {
      console.error('[GlobalScreen] fetchRanking error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch inicial + ao mudar de modo
  useEffect(() => {
    if (!isGuest) fetchRanking(mode);
  }, [mode, isGuest, fetchRanking]);

  // Realtime: re-fetch quando a view `ranking` sofrer INSERT/UPDATE/DELETE
  useEffect(() => {
    if (isGuest) return;
    const channel = supabase
      .channel('ranking-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, () => {
        fetchRanking(mode, true); // silent refresh
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [mode, isGuest, fetchRanking]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRanking(mode, true);
  }, [mode, fetchRanking]);

  // ─── GUEST WALL ──────────────────────────────────────────────
  if (isGuest) {
    return (
      <View style={styles.container}>
        <Text style={styles.screenTitle}>GLOBAL</Text>
        <Text style={styles.globeEmoji}>🌐</Text>
        <Text style={styles.guestMessage}>
          Faça login para ver{'\n'}o ranking global
        </Text>
      </View>
    );
  }

  // ─── RANKING ─────────────────────────────────────────────────
  const renderItem = ({ item }: { item: RankingEntry }) => {
    const isMe = item.user_id === currentUserId;
    const crown = CROWN[item.position];
    return (
      <TouchableOpacity
        style={[styles.rankCard, isMe && styles.rankCardMe]}
        onPress={() => setSelectedUser(item)}
        activeOpacity={0.75}
      >
        <View style={styles.rankPosition}>
          {crown
            ? <Text style={styles.crown}>{crown}</Text>
            : <Text style={[styles.positionNumber, isMe && styles.positionNumberMe]}>
                {item.position}
              </Text>
          }
        </View>
        <View style={styles.rankInfo}>
          <Text style={[styles.rankUsername, isMe && styles.rankUsernameMe]} numberOfLines={1}>
            {item.username}{isMe ? ' (você)' : ''}
          </Text>
          <Text style={styles.rankArchetype}>{item.archetype}</Text>
        </View>
        <Text style={[styles.rankTime, isMe && styles.rankTimeMe]}>
          {formatTime(item.avg_rt)}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderProfileModal = () => {
    if (!selectedUser) return null;
    const isMe = selectedUser.user_id === currentUserId;
    return (
      <Modal
        visible={!!selectedUser}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedUser(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedUser(null)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.profileCard}>
            {/* Header */}
            <View style={styles.profileHeader}>
              <Text style={styles.profileUsername}>
                {selectedUser.username}{isMe ? ' (você)' : ''}
              </Text>
              <Text style={styles.profileArchetype}>{selectedUser.archetype}</Text>
            </View>

            {/* Stats */}
            <View style={styles.profileStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>#{selectedUser.position}</Text>
                <Text style={styles.statLabel}>POSIÇÃO</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatTime(selectedUser.avg_rt)}</Text>
                <Text style={styles.statLabel}>TEMPO MÉDIO</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{selectedUser.session_count}</Text>
                <Text style={styles.statLabel}>PARTIDAS</Text>
              </View>
            </View>

            {/* Modo atual */}
            <Text style={styles.profileMode}>
              modo: {MODES.find(m => m.key === mode)?.label ?? mode.toUpperCase()}
            </Text>

            {/* Fechar */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedUser(null)}
            >
              <Text style={styles.closeButtonText}>FECHAR</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  };

  return (
    <>
      {renderProfileModal()}
      <View style={styles.container}>
      {/* Header */}
      <Text style={styles.screenTitle}>GLOBAL</Text>

      {/* Seletor de modo */}
      <View style={styles.modeSelectorRow}>
        {MODES.map(m => (
          <TouchableOpacity
            key={m.key}
            style={[styles.modeChip, mode === m.key && styles.modeChipActive]}
            onPress={() => setMode(m.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.modeChipText, mode === m.key && styles.modeChipTextActive]}>
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lista */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#00E5CC" size="large" />
        </View>
      ) : (
        <FlatList
          data={ranking}
          keyExtractor={item => item.user_id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#00E5CC"
              colors={['#00E5CC']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                Nenhum resultado ainda.{'\n'}Jogue 3 partidas para aparecer!
              </Text>
            </View>
          }
        />
      )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1E',
    paddingTop: 16,
  },
  screenTitle: {
    fontSize: 32,
    color: '#00E5CC',
    fontFamily: 'BebasNeue_400Regular',
    letterSpacing: 4,
    textAlign: 'center',
    marginBottom: 16,
  },
  globeEmoji: {
    fontSize: 56,
    textAlign: 'center',
    marginBottom: 12,
  },
  guestMessage: {
    fontSize: 16,
    color: '#8899AA',
    fontFamily: 'DMSans_400Regular',
    textAlign: 'center',
    lineHeight: 26,
  },
  // Mode selector
  modeSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  modeChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1E2D4A',
    backgroundColor: '#0D1530',
  },
  modeChipActive: {
    borderColor: '#00E5CC',
    backgroundColor: '#00E5CC18',
  },
  modeChipText: {
    fontSize: 11,
    color: '#7a8aa0',
    fontFamily: 'DMSans_500Medium',
    letterSpacing: 1,
  },
  modeChipTextActive: {
    color: '#00E5CC',
  },
  // List
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 14,
    color: '#4A5568',
    fontFamily: 'DMSans_400Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
  // Rank card
  rankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D1530',
    borderWidth: 1,
    borderColor: '#1E2D4A',
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  rankCardMe: {
    borderColor: '#00E5CC',
    backgroundColor: '#00E5CC0D',
  },
  rankPosition: {
    width: 32,
    alignItems: 'center',
  },
  crown: {
    fontSize: 20,
  },
  positionNumber: {
    fontSize: 16,
    color: '#4A5568',
    fontFamily: 'SpaceMono_400Regular',
  },
  positionNumberMe: {
    color: '#00E5CC',
  },
  rankInfo: {
    flex: 1,
    gap: 2,
  },
  rankUsername: {
    fontSize: 15,
    color: '#E2E8F0',
    fontFamily: 'DMSans_500Medium',
  },
  rankUsernameMe: {
    color: '#00E5CC',
  },
  rankArchetype: {
    fontSize: 11,
    color: '#4A5568',
    fontFamily: 'DMSans_400Regular',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  rankTime: {
    fontSize: 16,
    color: '#8899AA',
    fontFamily: 'SpaceMono_400Regular',
  },
  rankTimeMe: {
    color: '#00E5CC',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  profileCard: {
    backgroundColor: '#0D1530',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1E2D4A',
    padding: 24,
    width: '100%',
    gap: 20,
  },
  profileHeader: {
    alignItems: 'center',
    gap: 4,
  },
  profileUsername: {
    fontSize: 22,
    color: '#00E5CC',
    fontFamily: 'BebasNeue_400Regular',
    letterSpacing: 3,
  },
  profileArchetype: {
    fontSize: 11,
    color: '#4A5568',
    fontFamily: 'DMSans_400Regular',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    color: '#E2E8F0',
    fontFamily: 'SpaceMono_400Regular',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#1E2D4A',
  },
  statLabel: {
    fontSize: 9,
    color: '#4A5568',
    fontFamily: 'DMSans_400Regular',
    letterSpacing: 1,
  },
  profileMode: {
    fontSize: 11,
    color: '#4A5568',
    fontFamily: 'DMSans_400Regular',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  closeButton: {
    borderWidth: 1,
    borderColor: '#1E2D4A',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 12,
    color: '#7a8aa0',
    fontFamily: 'DMSans_500Medium',
    letterSpacing: 1,
  },
});
