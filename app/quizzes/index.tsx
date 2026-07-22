import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScreenShell } from '@/components/ui/screen-shell';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { palette } from '@/constants/palette';
import { useAuth } from '@/context/auth';
import { useAsync } from '@/hooks/use-async';
import { quizApi } from '@/services/api';
import type { ApiError } from '@/services/api';

type Quiz = {
  _id: string;
  title: string;
  questionCount?: number;
  isPublished?: boolean;
  course?: { code: string; title: string };
  createdBy?: { _id: string; name: string };
};

export default function QuizzesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const canManage = ['lecturer', 'admin'].includes(user?.role || '');
  const myId = user?.id || user?._id;

  const { data, loading, error, reload } = useAsync<{ data: Quiz[] }>(
    () => quizApi.list({ limit: 50 }),
    []
  );

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  const [busyId, setBusyId] = useState<string | null>(null);
  const items = data?.data ?? [];

  const togglePublish = async (quiz: Quiz) => {
    setBusyId(quiz._id);
    try {
      await quizApi.update(quiz._id, { isPublished: !quiz.isPublished });
      await reload();
    } catch (err) {
      Alert.alert('Lỗi', (err as ApiError)?.message || 'Không thể cập nhật.');
    } finally {
      setBusyId(null);
    }
  };

  const remove = (quiz: Quiz) => {
    Alert.alert('Xóa bộ câu hỏi', `Xóa "${quiz.title}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await quizApi.remove(quiz._id);
            await reload();
          } catch (err) {
            Alert.alert('Lỗi', (err as ApiError)?.message || 'Không thể xóa.');
          }
        },
      },
    ]);
  };

  const back = () => router.back();

  if (loading)
    return (
      <ScreenShell title="Bộ câu hỏi" onBack={back}>
        <LoadingState />
      </ScreenShell>
    );
  if (error)
    return (
      <ScreenShell title="Bộ câu hỏi" onBack={back}>
        <ErrorState message={error} onRetry={reload} />
      </ScreenShell>
    );

  return (
    <ScreenShell title="Bộ câu hỏi" onBack={back}>
    <FlatList
      style={styles.screen}
      data={items}
      keyExtractor={(item) => item._id}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        canManage ? (
          <View style={styles.headerActions}><Button label="＋ Tạo bộ câu hỏi" onPress={() => router.push('/quizzes/builder')} /><Button label="Nhập Excel" variant="secondary" onPress={() => router.push('/quizzes/import')} /></View>
        ) : null
      }
      renderItem={({ item }) => (
        <Card style={styles.card}>
          <Pressable onPress={() => router.push(`/quizzes/${item._id}`)}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>{item.title}</Text>
              <Ionicons name="chevron-forward" size={18} color={palette.textFaint} />
            </View>
            <View style={styles.metaRow}>
              {item.course ? <Badge label={item.course.code} tone="brand" /> : null}
              <Badge label={`${item.questionCount || 0} câu hỏi`} tone="neutral" />
              {canManage && item.isPublished === false ? <Badge label="Nháp" tone="warning" /> : null}
            </View>
            {item.createdBy ? <Text style={styles.author}>Biên soạn: {item.createdBy.name}</Text> : null}
          </Pressable>
          {canManage && (user?.role === 'admin' || item.createdBy?._id === myId) ? (
            <View style={styles.actions}>
              <Button
                label="Sửa"
                variant="secondary"
                size="sm"
                style={styles.flex}
                onPress={() => router.push(`/quizzes/builder?id=${item._id}`)}
              />
              <Button
                label={item.isPublished ? 'Ẩn' : 'Công bố'}
                variant="secondary"
                size="sm"
                style={styles.flex}
                loading={busyId === item._id}
                onPress={() => togglePublish(item)}
              />
              <Pressable style={styles.iconBtn} onPress={() => remove(item)}>
                <Ionicons name="trash-outline" size={18} color={palette.danger} />
              </Pressable>
            </View>
          ) : null}
        </Card>
      )}
      ListEmptyComponent={
        <EmptyState title="Chưa có bộ câu hỏi" description="Giảng viên chưa công bố bộ câu hỏi nào." />
      }
    />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  flex: { flex: 1 },
  list: { padding: 16, gap: 12 },
  headerActions: { gap: 8 },
  card: { gap: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { fontSize: 16, fontWeight: '700', color: palette.text, flex: 1 },
  metaRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 6 },
  author: { fontSize: 12, color: palette.textFaint, marginTop: 6 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: palette.border, paddingTop: 10 },
  iconBtn: {
    width: 38,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
