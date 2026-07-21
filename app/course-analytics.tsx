import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScreenShell } from '@/components/ui/screen-shell';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { palette } from '@/constants/palette';
import { useAsync } from '@/hooks/use-async';
import { courseApi } from '@/services/api';

type AnalyticsRow = {
  student: { _id: string; name: string; email?: string; avatarUrl?: string };
  submittedCount: number;
  totalAssignments: number;
  avgPercent: number | null;
  quizAttempts: number;
  lessonsCompleted: number;
  totalLessons: number;
  atRisk: boolean;
};
type Analytics = {
  course: { code: string; title: string };
  totals: { students: number; assignments: number; quizzes: number; lessons: number; atRisk: number };
  students: AnalyticsRow[];
};

export default function CourseAnalyticsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, loading, error, reload } = useAsync<{ data: Analytics }>(
    () => courseApi.analytics(String(id)),
    [id]
  );
  const back = () => router.back();

  if (loading)
    return (
      <ScreenShell title="Phân tích lớp" onBack={back}>
        <LoadingState />
      </ScreenShell>
    );
  if (error)
    return (
      <ScreenShell title="Phân tích lớp" onBack={back}>
        <ErrorState message={error} onRetry={reload} />
      </ScreenShell>
    );

  const analytics = data?.data;
  const totals = analytics?.totals;
  const students = analytics?.students ?? [];

  const cards = [
    { label: 'Sinh viên', value: totals?.students ?? 0, tone: palette.brand },
    { label: 'Bài tập', value: totals?.assignments ?? 0, tone: palette.brand },
    { label: 'Bài học', value: totals?.lessons ?? 0, tone: palette.brand },
    { label: 'Có nguy cơ', value: totals?.atRisk ?? 0, tone: palette.danger },
  ];

  return (
    <ScreenShell title={`Phân tích — ${analytics?.course.code ?? ''}`} onBack={back}>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.grid}>
          {cards.map((card) => (
            <Card key={card.label} style={styles.statCard}>
              <Text style={[styles.statValue, { color: card.tone }]}>{card.value}</Text>
              <Text style={styles.statLabel}>{card.label}</Text>
            </Card>
          ))}
        </View>

        {students.length === 0 ? (
          <EmptyState title="Chưa có sinh viên" description="Chưa có sinh viên nào ghi danh học phần này." />
        ) : (
          students.map((row) => (
            <Card key={row.student._id} style={styles.card}>
              <View style={styles.rowHeader}>
                <Avatar name={row.student.name} size={38} />
                <View style={styles.flex}>
                  <Text style={styles.name}>{row.student.name}</Text>
                  <Text style={styles.meta}>{row.student.email}</Text>
                </View>
                {row.atRisk ? <Badge label="Nguy cơ" tone="danger" /> : <Badge label="Ổn định" tone="success" />}
              </View>
              <View style={styles.metrics}>
                <Text style={styles.metric}>
                  Bài nộp: {row.submittedCount}/{row.totalAssignments}
                </Text>
                <Text style={styles.metric}>
                  Điểm TB: {row.avgPercent == null ? '—' : `${row.avgPercent}%`}
                </Text>
                <Text style={styles.metric}>Trắc nghiệm: {row.quizAttempts}</Text>
                <Text style={styles.metric}>
                  Bài học: {row.lessonsCompleted}/{row.totalLessons}
                </Text>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { padding: 16, gap: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { width: '47%', gap: 2 },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 13, color: palette.textMuted },
  card: { gap: 10 },
  rowHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { fontSize: 15, fontWeight: '700', color: palette.text },
  meta: { fontSize: 12, color: palette.textFaint },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metric: { fontSize: 13, color: palette.textMuted },
});
