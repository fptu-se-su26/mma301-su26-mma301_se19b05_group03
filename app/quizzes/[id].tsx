import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScreenShell } from '@/components/ui/screen-shell';
import { ErrorState, LoadingState } from '@/components/ui/states';
import { palette } from '@/constants/palette';
import { useAuth } from '@/context/auth';
import { useAsync } from '@/hooks/use-async';
import { quizApi } from '@/services/api';
import type { ApiError } from '@/services/api';

type Question = { questionText: string; options: string[]; correctIndexes?: number[] };
type Quiz = { _id: string; title: string; questions: Question[]; course?: { code: string } };
type ReviewItem = {
  questionText: string;
  options: string[];
  selectedIndexes: number[];
  correctIndexes: number[];
  isCorrect: boolean;
};
type Result = { score: number; totalQuestions: number; review: ReviewItem[] };

export default function QuizTakingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const canTakeQuiz = user?.role === 'student';
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, loading, error, reload } = useAsync<{ data: { quiz: Quiz } }>(
    () => quizApi.get(String(id)),
    [id]
  );
  const [answers, setAnswers] = useState<Record<number, number[]>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const quiz = data?.data.quiz;
  const questions = quiz?.questions ?? [];
  const allAnswered =
    questions.length > 0 && questions.every((_, index) => (answers[index]?.length ?? 0) > 0);

  const select = (qIndex: number, oIndex: number) => {
    if (result || !canTakeQuiz) return;
    setAnswers((prev) => {
      const current = prev[qIndex] ?? [];
      const next = current.includes(oIndex)
        ? current.filter((idx) => idx !== oIndex)
        : [...current, oIndex].sort((a, b) => a - b);
      return { ...prev, [qIndex]: next };
    });
  };

  const submit = async () => {
    if (!quiz || !allAnswered) {
      setSubmitError('Vui lòng trả lời tất cả câu hỏi trước khi nộp.');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const orderedAnswers = questions.map((_, index) => answers[index] ?? []);
      const res = await quizApi.submit(quiz._id, { answers: orderedAnswers });
      setResult(res.data);
    } catch (err) {
      setSubmitError((err as ApiError)?.message || 'Không thể nộp bài.');
    } finally {
      setSubmitting(false);
    }
  };

  const retake = () => {
    setResult(null);
    setAnswers({});
    setSubmitError(null);
  };

  const back = () => router.back();

  if (loading)
    return (
      <ScreenShell title="Làm bài" onBack={back}>
        <LoadingState />
      </ScreenShell>
    );
  if (error || !quiz)
    return (
      <ScreenShell title="Làm bài" onBack={back}>
        <ErrorState message={error || 'Không tìm thấy bộ câu hỏi'} onRetry={reload} />
      </ScreenShell>
    );

  const optionState = (qIndex: number, oIndex: number) => {
    if (!canTakeQuiz && questions[qIndex]?.correctIndexes?.includes(oIndex)) return 'correct';
    if (result) {
      const review = result.review[qIndex];
      if (review.correctIndexes.includes(oIndex)) return 'correct';
      if (review.selectedIndexes.includes(oIndex)) return 'wrong';
      return 'idle';
    }
    return answers[qIndex]?.includes(oIndex) ? 'selected' : 'idle';
  };

  return (
    <ScreenShell title={canTakeQuiz ? 'Làm bài' : 'Xem bộ câu hỏi'} onBack={back}>
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.heading}>
        <Text style={styles.title}>{quiz.title}</Text>
        <Text style={styles.subtitle}>
          {questions.length} câu hỏi · {canTakeQuiz ? 'có thể chọn nhiều đáp án' : 'đáp án đúng được tô màu'}
        </Text>
      </View>

      {canTakeQuiz && result ? (
        <Card style={styles.resultCard}>
          <Text style={styles.resultScore}>
            {result.score}/{result.totalQuestions}
          </Text>
          <Text style={styles.resultLabel}>Số câu trả lời đúng</Text>
        </Card>
      ) : null}

      {questions.map((question, qIndex) => (
        <Card key={qIndex} style={styles.card}>
          <Text style={styles.question}>
            {qIndex + 1}. {question.questionText}
          </Text>
          {question.options.map((option, oIndex) => {
            const state = optionState(qIndex, oIndex);
            return (
              <Pressable
                key={oIndex}
                onPress={() => select(qIndex, oIndex)}
                style={[styles.option, optionStyles[state]]}>
                <Text style={[styles.optionText, state === 'selected' && styles.optionTextActive]}>
                  {option}
                </Text>
                {state === 'correct' ? (
                  <Ionicons name="checkmark-circle" size={18} color={palette.success} />
                ) : null}
                {state === 'wrong' ? (
                  <Ionicons name="close-circle" size={18} color={palette.danger} />
                ) : null}
              </Pressable>
            );
          })}
        </Card>
      ))}

      {canTakeQuiz && submitError ? <Text style={styles.error}>{submitError}</Text> : null}

      {canTakeQuiz && result ? (
        <Button label="Làm lại" variant="secondary" onPress={retake} />
      ) : canTakeQuiz ? (
        <Button label="Nộp bài" loading={submitting} disabled={!allAnswered} onPress={submit} />
      ) : null}
    </ScrollView>
    </ScreenShell>
  );
}

const optionStyles = StyleSheet.create({
  idle: { borderColor: palette.border, backgroundColor: palette.surface },
  selected: { borderColor: palette.brand, backgroundColor: palette.brandSoft },
  correct: { borderColor: palette.success, backgroundColor: palette.successSoft },
  wrong: { borderColor: palette.danger, backgroundColor: palette.dangerSoft },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  content: { padding: 16, gap: 12 },
  heading: { gap: 2 },
  title: { fontSize: 20, fontWeight: '800', color: palette.text },
  subtitle: { fontSize: 13, color: palette.textMuted },
  card: { gap: 8 },
  question: { fontSize: 15, fontWeight: '700', color: palette.text, marginBottom: 4 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  optionText: { fontSize: 14, color: palette.text, flex: 1 },
  optionTextActive: { fontWeight: '700', color: palette.brandText },
  error: { color: palette.danger, fontSize: 13, textAlign: 'center' },
  resultCard: { alignItems: 'center', gap: 4, paddingVertical: 20 },
  resultScore: { fontSize: 32, fontWeight: '800', color: palette.brand },
  resultLabel: { fontSize: 14, color: palette.textMuted },
});
