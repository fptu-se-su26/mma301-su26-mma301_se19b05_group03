import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { ScreenShell } from '@/components/ui/screen-shell';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { palette } from '@/constants/palette';
import { useAsync } from '@/hooks/use-async';
import { courseApi } from '@/services/api';

type Grade = { status: string; score: number | null };
type Gradebook = {
  course: { code: string; title: string };
  assignments: { _id: string; title: string; maxScore: number }[];
  students: { student: { _id: string; name: string; email: string; avatarUrl?: string }; grades: Record<string, Grade> }[];
};

const cellText = (grade?: Grade) => {
  if (!grade || grade.status === 'missing') return '—';
  if (grade.status === 'graded') return String(grade.score ?? '—');
  return 'Đã nộp';
};

export default function CourseGradebookScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, loading, error, reload } = useAsync<{ data: Gradebook }>(
    () => courseApi.gradebook(id),
    [id]
  );
  const gradebook = data?.data;

  if (loading) return <ScreenShell title="Sổ điểm" onBack={() => router.back()}><LoadingState /></ScreenShell>;
  if (error) return <ScreenShell title="Sổ điểm" onBack={() => router.back()}><ErrorState message={error} onRetry={reload} /></ScreenShell>;

  return (
    <ScreenShell title={`Sổ điểm · ${gradebook?.course.code || ''}`} onBack={() => router.back()}>
      <ScrollView contentContainerStyle={styles.body} horizontal={false}>
        <Text style={styles.subtitle}>{gradebook?.course.title || ''}</Text>
        {!gradebook?.students.length ? <EmptyState title="Chưa có sinh viên" description="Chưa có sinh viên ghi danh học phần này." /> : null}
        {gradebook?.students.map((row) => (
          <Card key={row.student._id} style={styles.card}>
            <View style={styles.student}>
              <Avatar name={row.student.name} avatarUrl={row.student.avatarUrl} size={42} />
              <View style={styles.flex}>
                <Text style={styles.name}>{row.student.name}</Text>
                <Text style={styles.email}>{row.student.email}</Text>
              </View>
            </View>
            <View style={styles.grades}>
              {gradebook.assignments.map((assignment) => (
                <View key={assignment._id} style={styles.grade}>
                  <Text style={styles.assignment} numberOfLines={1}>{assignment.title}</Text>
                  <Text style={styles.score}>
                    {cellText(row.grades[assignment._id])}
                    {row.grades[assignment._id]?.status === 'graded' ? `/${assignment.maxScore}` : ''}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        ))}
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 12 },
  subtitle: { color: palette.textMuted, fontSize: 14 },
  card: { gap: 12 },
  student: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  flex: { flex: 1 },
  name: { color: palette.text, fontWeight: '700', fontSize: 15 },
  email: { color: palette.textFaint, fontSize: 12 },
  grades: { gap: 8 },
  grade: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderTopWidth: 1, borderTopColor: palette.border, paddingTop: 8 },
  assignment: { color: palette.textMuted, fontSize: 13, flex: 1 },
  score: { color: palette.brand, fontWeight: '800', fontSize: 14 },
});
