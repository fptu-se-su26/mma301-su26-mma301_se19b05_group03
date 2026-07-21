import { useRouter } from 'expo-router';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScreenShell } from '@/components/ui/screen-shell';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { JOIN_STATUS_LABELS } from '@/constants/labels';
import { palette } from '@/constants/palette';
import { useAsync } from '@/hooks/use-async';
import { joinRequestApi } from '@/services/api';
import type { ApiError } from '@/services/api';
import { formatRelative } from '@/utils/format';

type JoinRequest = {
  _id: string;
  status: string;
  message?: string;
  createdAt: string;
  team?: { _id: string; name: string; status: string; major?: string; topic?: string };
};

const statusTone: Record<string, 'warning' | 'success' | 'danger' | 'neutral'> = {
  pending: 'warning',
  accepted: 'success',
  rejected: 'danger',
  cancelled: 'neutral',
};

export default function MyRequestsScreen() {
  const router = useRouter();
  const { data, loading, error, reload } = useAsync<{ data: JoinRequest[] }>(
    () => joinRequestApi.mine({ limit: 50 }),
    []
  );
  const items = data?.data ?? [];

  const cancel = (request: JoinRequest) => {
    Alert.alert('Hủy yêu cầu', `Hủy yêu cầu tham gia nhóm "${request.team?.name}"?`, [
      { text: 'Không', style: 'cancel' },
      {
        text: 'Hủy yêu cầu',
        style: 'destructive',
        onPress: async () => {
          try {
            await joinRequestApi.cancel(request._id);
            await reload();
          } catch (err) {
            Alert.alert('Lỗi', (err as ApiError)?.message || 'Không thể hủy.');
          }
        },
      },
    ]);
  };

  const back = () => router.back();

  if (loading)
    return (
      <ScreenShell title="Yêu cầu của tôi" onBack={back}>
        <LoadingState />
      </ScreenShell>
    );
  if (error)
    return (
      <ScreenShell title="Yêu cầu của tôi" onBack={back}>
        <ErrorState message={error} onRetry={reload} />
      </ScreenShell>
    );

  return (
    <ScreenShell title="Yêu cầu của tôi" onBack={back}>
    <FlatList
      style={styles.screen}
      data={items}
      keyExtractor={(item) => item._id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <Card style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.name}>{item.team?.name || 'Nhóm'}</Text>
            <Badge label={JOIN_STATUS_LABELS[item.status] || item.status} tone={statusTone[item.status]} />
          </View>
          {item.team?.topic ? <Text style={styles.meta}>{item.team.topic}</Text> : null}
          {item.message ? <Text style={styles.message}>“{item.message}”</Text> : null}
          <Text style={styles.time}>{formatRelative(item.createdAt)}</Text>
          {item.status === 'pending' ? (
            <Button label="Hủy yêu cầu" variant="secondary" size="sm" onPress={() => cancel(item)} />
          ) : null}
        </Card>
      )}
      ListEmptyComponent={
        <EmptyState title="Chưa có yêu cầu" description="Bạn chưa gửi yêu cầu tham gia nhóm nào." />
      }
    />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  list: { padding: 16, gap: 12 },
  card: { gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name: { fontSize: 16, fontWeight: '700', color: palette.text, flex: 1 },
  meta: { fontSize: 13, color: palette.textMuted },
  message: { fontSize: 13, color: palette.textMuted, fontStyle: 'italic' },
  time: { fontSize: 12, color: palette.textFaint },
});
