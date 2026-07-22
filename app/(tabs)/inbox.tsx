import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/card';
import { ScreenHeader } from '@/components/ui/screen-header';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { palette } from '@/constants/palette';
import { invitationApi, notificationApi, type ApiError } from '@/services/api';
import { formatRelative } from '@/utils/format';

type NotificationItem = { _id: string; message: string; link?: string; isRead: boolean; createdAt: string };
type Invitation = { _id: string; message?: string; status: string; createdAt: string; team?: { _id: string; name: string }; invitedBy?: { name: string } };

export default function InboxScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [notificationResponse, invitationResponse] = await Promise.all([
        notificationApi.list({ limit: 30 }),
        invitationApi.mine({ limit: 30 }),
      ]);
      setNotifications(notificationResponse.data || []);
      setInvitations(invitationResponse.data || []);
    } catch (requestError) {
      setError((requestError as ApiError).message || 'Không thể tải hộp thư.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const refresh = () => {
    setRefreshing(true);
    load();
  };

  const markRead = async (item: NotificationItem) => {
    if (!item.isRead) await notificationApi.markRead(item._id);
    setNotifications((items) => items.map((current) => current._id === item._id ? { ...current, isRead: true } : current));
    const teamId = item.link?.match(/^\/teams?\/(.+)$/)?.[1];
    if (teamId) router.push(`/team/${teamId}`);
  };

  const decideInvitation = async (item: Invitation, decision: 'accept' | 'reject') => {
    await (decision === 'accept' ? invitationApi.accept(item._id) : invitationApi.reject(item._id));
    setInvitations((items) => items.filter((current) => current._id !== item._id));
  };

  if (loading) return <SafeAreaView style={styles.safe}><LoadingState /></SafeAreaView>;
  if (error) return <SafeAreaView style={styles.safe}><ErrorState message={error} onRetry={load} /></SafeAreaView>;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Hộp thư" subtitle="Thông báo và lời mời của bạn" />
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
        <Text style={styles.sectionTitle}>Lời mời tham gia nhóm</Text>
        {invitations.length === 0 ? <Text style={styles.muted}>Bạn không có lời mời đang chờ.</Text> : invitations.map((item) => (
          <Card key={item._id} style={styles.card}>
            <Text style={styles.title}>{item.team?.name || 'Nhóm học tập'}</Text>
            <Text style={styles.muted}>{item.invitedBy?.name || 'Một thành viên'} đã mời bạn tham gia.</Text>
            <View style={styles.actions}>
              <Pressable accessibilityRole="button" accessibilityLabel="Chấp nhận lời mời" onPress={() => decideInvitation(item, 'accept')}><Text style={styles.accept}>Chấp nhận</Text></Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Từ chối lời mời" onPress={() => decideInvitation(item, 'reject')}><Text style={styles.reject}>Từ chối</Text></Pressable>
            </View>
          </Card>
        ))}
        <Text style={styles.sectionTitle}>Thông báo</Text>
        {notifications.length === 0 ? <EmptyState title="Chưa có thông báo" description="Các cập nhật mới sẽ xuất hiện ở đây." /> : notifications.map((item) => (
          <Pressable key={item._id} accessibilityRole="button" accessibilityLabel={item.message} onPress={() => markRead(item)}>
            <Card style={[styles.card, !item.isRead && styles.unread]}>
              <Text style={styles.title}>{item.message}</Text>
              <Text style={styles.muted}>{formatRelative(item.createdAt)}</Text>
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.background },
  content: { padding: 16, gap: 10 },
  sectionTitle: { marginTop: 8, fontSize: 16, fontWeight: '800', color: palette.text },
  card: { gap: 6 },
  unread: { borderColor: palette.brand, borderWidth: 1 },
  title: { fontSize: 15, fontWeight: '700', color: palette.text },
  muted: { color: palette.textMuted, fontSize: 13 },
  actions: { flexDirection: 'row', gap: 20, marginTop: 6 },
  accept: { color: palette.brand, fontWeight: '800' },
  reject: { color: palette.danger, fontWeight: '800' },
});
