import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScreenShell } from '@/components/ui/screen-shell';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { TextField } from '@/components/ui/text-field';
import { TEAM_STATUS_LABELS } from '@/constants/labels';
import { palette } from '@/constants/palette';
import { useAsync } from '@/hooks/use-async';
import { teamApi } from '@/services/api';

type Team = { _id: string; name: string; topic?: string; major?: string; status: string; members?: unknown[]; maxMembers?: number; leader?: { name: string } };

export default function MonitorScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const { data, loading, error, reload } = useAsync<{ data: Team[] }>(() => teamApi.list({ limit: 100 }), []);
  const teams = (data?.data || []).filter((team) => `${team.name} ${team.topic || ''} ${team.major || ''}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <ScreenShell title="Giám sát nhóm dự án" onBack={() => router.back()}>
      <TextField containerStyle={styles.search} placeholder="Tìm nhóm theo tên, chủ đề..." value={query} onChangeText={setQuery} />
      {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={reload} /> : (
        <FlatList
          data={teams}
          keyExtractor={(team) => team._id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/team/${item._id}`)}>
              <Card style={styles.card}>
                <View style={styles.row}><Text style={styles.name}>{item.name}</Text><Badge label={TEAM_STATUS_LABELS[item.status] || item.status} tone={item.status === 'recruiting' ? 'success' : item.status === 'full' ? 'warning' : 'neutral'} /></View>
                <Text style={styles.meta}>{item.topic || item.major || 'Chưa cập nhật chủ đề'}</Text>
                <Text style={styles.meta}>Trưởng nhóm: {item.leader?.name || 'Chưa cập nhật'} · {item.members?.length || 0}/{item.maxMembers || 0} thành viên</Text>
              </Card>
            </Pressable>
          )}
          ListEmptyComponent={<EmptyState title="Không có nhóm nào" />}
        />
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  search: { paddingHorizontal: 16, paddingTop: 16 },
  list: { padding: 16, gap: 12 },
  card: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name: { flex: 1, color: palette.text, fontSize: 16, fontWeight: '700' },
  meta: { color: palette.textMuted, fontSize: 13 },
});
