import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScreenHeader } from '@/components/ui/screen-header';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { TEAM_STATUS_LABELS } from '@/constants/labels';
import { palette } from '@/constants/palette';
import { useAuth } from '@/context/auth';
import { useAsync } from '@/hooks/use-async';
import { teamApi } from '@/services/api';
import { TextField } from '@/components/ui/text-field';

type Team = {
  _id: string;
  name: string;
  topic?: string;
  major?: string;
  status: string;
  skillsNeeded?: string[];
  members?: unknown[];
  maxMembers?: number;
};

const statusTone: Record<string, 'success' | 'warning' | 'neutral'> = {
  recruiting: 'success',
  full: 'warning',
  closed: 'neutral',
};

export default function TeamsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const [refreshing, setRefreshing] = useState(false);
  const [view, setView] = useState<'all' | 'recommended'>('all');
  const [query, setQuery] = useState('');
  const mine = useAsync<{ data: { teams: Team[] } }>(() => teamApi.mine(), []);
  const all = useAsync<{ data: Team[] }>(() => teamApi.list({ limit: 30 }), []);
  const recommended = useAsync<{ data: { recommendations: Team[] } }>(() => teamApi.recommended({ limit: 30 }), []);

  const myTeams = mine.data?.data.teams ?? [];
  const allTeams = all.data?.data ?? [];
  const recommendedTeams = recommended.data?.data.recommendations ?? [];
  const visibleTeams = (view === 'recommended' ? recommendedTeams : allTeams).filter((team) =>
    `${team.name} ${team.topic || ''} ${team.major || ''}`.toLowerCase().includes(query.toLowerCase())
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([mine.reload(), all.reload(), recommended.reload()]);
    setRefreshing(false);
  }, [mine, all, recommended]);

  useFocusEffect(
    useCallback(() => {
      mine.reload();
      all.reload();
      if (isStudent) recommended.reload();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const TeamCard = ({ team }: { team: Team }) => (
    <Pressable onPress={() => router.push(`/team/${team._id}`)}>
      <Card style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.name}>{team.name}</Text>
          <Badge label={TEAM_STATUS_LABELS[team.status] || team.status} tone={statusTone[team.status]} />
        </View>
        {team.topic ? <Text style={styles.topic}>{team.topic}</Text> : null}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={15} color={palette.textFaint} />
            <Text style={styles.meta}>
              {team.members?.length || 0}/{team.maxMembers || 0} thành viên
            </Text>
          </View>
          {team.major ? (
            <View style={styles.metaItem}>
              <Ionicons name="school-outline" size={15} color={palette.textFaint} />
              <Text style={styles.meta}>{team.major}</Text>
            </View>
          ) : null}
        </View>
      </Card>
    </Pressable>
  );

  const loading = mine.loading || all.loading || (isStudent && recommended.loading);
  const error = mine.error || all.error || recommended.error;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title="Nhóm"
        subtitle="Tìm và tham gia nhóm học tập, dự án"
        right={
          isStudent ? (
            <Pressable style={styles.addBtn} onPress={() => router.push('/team/form')}>
              <Ionicons name="add" size={22} color="#fff" />
            </Pressable>
          ) : undefined
        }
      />
      {loading && !refreshing ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={onRefresh} />
      ) : (
        <FlatList
           data={visibleTeams}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <TeamCard team={item} />}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListHeaderComponent={
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Nhóm của tôi</Text>
              {myTeams.length === 0 ? (
                <Text style={styles.emptyMine}>Bạn chưa tham gia nhóm nào.</Text>
              ) : (
                myTeams.map((team) => <TeamCard key={team._id} team={team} />)
              )}
              <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Khám phá nhóm</Text>
              <View style={styles.segmented}>
                <Pressable style={[styles.segment, view === 'all' && styles.segmentActive]} onPress={() => setView('all')}><Text style={view === 'all' ? styles.segmentTextActive : styles.segmentText}>Tất cả</Text></Pressable>
                {isStudent ? <Pressable style={[styles.segment, view === 'recommended' && styles.segmentActive]} onPress={() => setView('recommended')}><Text style={view === 'recommended' ? styles.segmentTextActive : styles.segmentText}>Gợi ý cho bạn</Text></Pressable> : null}
              </View>
              <TextField placeholder="Tìm nhóm theo tên, chủ đề, chuyên ngành" value={query} onChangeText={setQuery} />
            </View>
          }
          ListEmptyComponent={
            <EmptyState title="Chưa có nhóm" description="Chưa có nhóm nào đang hoạt động." />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.background },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: palette.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { padding: 16, gap: 12 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: palette.text },
  sectionSpacing: { marginTop: 8 },
  emptyMine: { fontSize: 14, color: palette.textMuted },
  card: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name: { fontSize: 16, fontWeight: '700', color: palette.text, flex: 1 },
  topic: { fontSize: 14, color: palette.textMuted },
  metaRow: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  meta: { fontSize: 13, color: palette.textFaint },
  segmented: { flexDirection: 'row', backgroundColor: palette.neutralSoft, borderRadius: 12, padding: 3, gap: 4 },
  segment: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 9 },
  segmentActive: { backgroundColor: palette.surface },
  segmentText: { color: palette.textMuted, fontSize: 13, fontWeight: '600' },
  segmentTextActive: { color: palette.brand, fontSize: 13, fontWeight: '700' },
});
