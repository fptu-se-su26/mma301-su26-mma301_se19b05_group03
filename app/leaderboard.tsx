import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScreenShell } from '@/components/ui/screen-shell';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { palette } from '@/constants/palette';
import { useAuth } from '@/context/auth';
import { useAsync } from '@/hooks/use-async';
import { gamificationApi } from '@/services/api';

type RankedStudent = {
  rank: number;
  points: number;
  student: { _id: string; name: string; avatarUrl?: string; major?: string };
};
type MyStats = {
  rank: number;
  points: number;
  stats: {
    submissionCount: number;
    quizAttempts: number;
    lessonsCompleted: number;
    comments: number;
  };
  badges: { key: string; label: string; description: string; earned: boolean }[];
};
type Leaderboard = { top: RankedStudent[]; me: MyStats | null; totalStudents: number };

const rankColor = (rank: number) => {
  if (rank === 1) return '#D97706';
  if (rank === 2) return '#64748B';
  if (rank === 3) return '#EA580C';
  return palette.textFaint;
};

export default function LeaderboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const myId = user?.id || user?._id;
  const { data, loading, error, reload } = useAsync<{ data: Leaderboard }>(
    () => gamificationApi.leaderboard(),
    []
  );
  const back = () => router.back();

  if (loading)
    return (
      <ScreenShell title="Bảng xếp hạng" onBack={back}>
        <LoadingState />
      </ScreenShell>
    );
  if (error)
    return (
      <ScreenShell title="Bảng xếp hạng" onBack={back}>
        <ErrorState message={error} onRetry={reload} />
      </ScreenShell>
    );

  const top = data?.data.top ?? [];
  const me = data?.data.me;

  return (
    <ScreenShell title="Bảng xếp hạng" onBack={back}>
      <ScrollView contentContainerStyle={styles.body}>
        {me ? (
          <Card style={styles.meCard}>
            <View style={styles.meHeader}>
              <View style={styles.rankCircle}>
                <Text style={styles.rankCircleText}>#{me.rank}</Text>
              </View>
              <View style={styles.flex}>
                <Text style={styles.mePoints}>{me.points} điểm hoạt động</Text>
                <Text style={styles.meStats}>
                  {me.stats.submissionCount} bài nộp · {me.stats.quizAttempts} trắc nghiệm ·{' '}
                  {me.stats.lessonsCompleted} bài học · {me.stats.comments} bình luận
                </Text>
              </View>
            </View>
            <View style={styles.badgeWrap}>
              {me.badges.map((badge) => (
                <View key={badge.key} style={[styles.badgePill, badge.earned && styles.badgePillEarned]}>
                  <Text style={[styles.badgeText, badge.earned && styles.badgeTextEarned]}>
                    {badge.earned ? '🏅' : '🔒'} {badge.label}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        ) : null}

        {top.length === 0 ? (
          <EmptyState title="Chưa có dữ liệu" description="Chưa có sinh viên nào có hoạt động." />
        ) : (
          top.map((row) => {
            const isMe = row.student._id === myId;
            return (
              <Card key={row.student._id} style={[styles.row, isMe && styles.rowMine]}>
                <Text style={[styles.rank, { color: rankColor(row.rank) }]}>{row.rank}</Text>
                <Avatar name={row.student.name} size={36} />
                <View style={styles.flex}>
                  <Text style={styles.name}>
                    {row.student.name}
                    {isMe ? ' (Bạn)' : ''}
                  </Text>
                  {row.student.major ? <Text style={styles.meta}>{row.student.major}</Text> : null}
                </View>
                <Badge label={`${row.points} điểm`} tone="brand" />
              </Card>
            );
          })
        )}
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { padding: 16, gap: 10 },
  meCard: { gap: 12, borderWidth: 1, borderColor: palette.brandSoft },
  meHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rankCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: palette.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankCircleText: { fontSize: 16, fontWeight: '800', color: palette.brand },
  mePoints: { fontSize: 16, fontWeight: '800', color: palette.text },
  meStats: { fontSize: 12, color: palette.textMuted, marginTop: 2 },
  badgeWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badgePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: palette.neutralSoft,
  },
  badgePillEarned: { backgroundColor: palette.successSoft },
  badgeText: { fontSize: 12, fontWeight: '600', color: palette.textFaint },
  badgeTextEarned: { color: palette.success },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowMine: { borderWidth: 1, borderColor: palette.brand },
  rank: { width: 26, fontSize: 16, fontWeight: '800', textAlign: 'center' },
  name: { fontSize: 14, fontWeight: '700', color: palette.text },
  meta: { fontSize: 12, color: palette.textFaint },
});
