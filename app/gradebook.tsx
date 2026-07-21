import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScreenShell } from '@/components/ui/screen-shell';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { palette } from '@/constants/palette';
import { useAsync } from '@/hooks/use-async';
import { assignmentApi } from '@/services/api';

type CourseRef = { code: string; title: string } | null;
type AssignmentGrade = {
  assignmentId: string;
  title: string;
  course: CourseRef;
  maxScore: number;
  status: string;
  score: number | null;
  feedback: string;
};
type QuizGrade = {
  quizId: string;
  title: string;
  course: CourseRef;
  bestScore: number;
  totalQuestions: number;
  attempts: number;
};
type Gradebook = { assignments: AssignmentGrade[]; quizzes: QuizGrade[] };

export default function GradebookScreen() {
  const router = useRouter();
  const { data, loading, error, reload } = useAsync<{ data: Gradebook }>(() => assignmentApi.myGradebook(), []);
  const back = () => router.back();

  if (loading)
    return (
      <ScreenShell title="Điểm của tôi" onBack={back}>
        <LoadingState />
      </ScreenShell>
    );
  if (error)
    return (
      <ScreenShell title="Điểm của tôi" onBack={back}>
        <ErrorState message={error} onRetry={reload} />
      </ScreenShell>
    );

  const assignments = data?.data.assignments ?? [];
  const quizzes = data?.data.quizzes ?? [];
  const empty = assignments.length === 0 && quizzes.length === 0;

  return (
    <ScreenShell title="Điểm của tôi" onBack={back}>
      <ScrollView contentContainerStyle={styles.body}>
        {empty ? (
          <EmptyState title="Chưa có điểm" description="Bạn chưa có bài tập hoặc bài trắc nghiệm nào được ghi nhận." />
        ) : null}

        {assignments.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Bài tập</Text>
            {assignments.map((item) => (
              <Card key={item.assignmentId} style={styles.card}>
                <View style={styles.row}>
                  <View style={styles.flex}>
                    <Text style={styles.title}>{item.title}</Text>
                    {item.course ? <Text style={styles.meta}>{item.course.code}</Text> : null}
                  </View>
                  {item.status === 'graded' ? (
                    <Text style={styles.score}>
                      {item.score}/{item.maxScore}
                    </Text>
                  ) : (
                    <Badge label="Chờ chấm" tone="warning" />
                  )}
                </View>
                {item.feedback ? <Text style={styles.feedback}>Nhận xét: {item.feedback}</Text> : null}
              </Card>
            ))}
          </>
        ) : null}

        {quizzes.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Trắc nghiệm</Text>
            {quizzes.map((item) => (
              <Card key={item.quizId} style={styles.card}>
                <View style={styles.row}>
                  <View style={styles.flex}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.meta}>
                      {item.course ? `${item.course.code} · ` : ''}
                      {item.attempts} lượt làm
                    </Text>
                  </View>
                  <Text style={styles.score}>
                    {item.bestScore}/{item.totalQuestions}
                  </Text>
                </View>
              </Card>
            ))}
          </>
        ) : null}
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { padding: 16, gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: palette.text, marginTop: 4 },
  card: { gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: 15, fontWeight: '700', color: palette.text },
  meta: { fontSize: 12, color: palette.textFaint },
  score: { fontSize: 18, fontWeight: '800', color: palette.brand },
  feedback: { fontSize: 13, color: palette.textMuted, lineHeight: 19 },
});
