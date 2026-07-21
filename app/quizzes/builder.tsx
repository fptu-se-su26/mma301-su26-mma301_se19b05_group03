import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChipSelect } from '@/components/ui/chip-select';
import { ScreenShell } from '@/components/ui/screen-shell';
import { LoadingState } from '@/components/ui/states';
import { TextField } from '@/components/ui/text-field';
import { palette } from '@/constants/palette';
import { courseApi, quizApi } from '@/services/api';
import type { ApiError } from '@/services/api';

type Question = { questionText: string; options: string[]; correctIndexes: number[] };
type Course = { _id: string; code: string };

const blankQuestion = (): Question => ({ questionText: '', options: ['', ''], correctIndexes: [0] });

export default function QuizBuilderScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [courses, setCourses] = useState<Course[]>([]);
  const [title, setTitle] = useState('');
  const [course, setCourse] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([blankQuestion()]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    courseApi
      .list({ limit: 100 })
      .then((res: { data: Course[] }) => setCourses(res.data))
      .catch(() => setCourses([]));
  }, []);

  useEffect(() => {
    if (!id) return;
    quizApi
      .get(id)
      .then((res: { data: { quiz: { title: string; course?: { _id: string }; isPublished?: boolean; questions: Question[] } } }) => {
        const quiz = res.data.quiz;
        setTitle(quiz.title);
        setCourse(quiz.course?._id || '');
        setIsPublished(quiz.isPublished ?? true);
        setQuestions(
          quiz.questions.length
            ? quiz.questions.map((q) => ({
                questionText: q.questionText,
                options: q.options,
                correctIndexes: q.correctIndexes?.length ? q.correctIndexes : [0],
              }))
            : [blankQuestion()]
        );
      })
      .catch(() => setFormError('Không thể tải bộ câu hỏi.'))
      .finally(() => setLoading(false));
  }, [id]);

  const updateQuestion = (index: number, patch: Partial<Question>) => {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIndex ? { ...q, options: q.options.map((o, j) => (j === oIndex ? value : o)) } : q
      )
    );
  };

  const addOption = (qIndex: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === qIndex && q.options.length < 6 ? { ...q, options: [...q.options, ''] } : q))
    );
  };

  const toggleCorrect = (qIndex: number, oIndex: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q;
        const has = q.correctIndexes.includes(oIndex);
        const correctIndexes = has
          ? q.correctIndexes.filter((idx) => idx !== oIndex)
          : [...q.correctIndexes, oIndex].sort((a, b) => a - b);
        return { ...q, correctIndexes };
      })
    );
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex || q.options.length <= 2) return q;
        const options = q.options.filter((_, j) => j !== oIndex);
        const correctIndexes = q.correctIndexes
          .filter((idx) => idx !== oIndex)
          .map((idx) => (idx > oIndex ? idx - 1 : idx));
        return { ...q, options, correctIndexes: correctIndexes.length ? correctIndexes : [0] };
      })
    );
  };

  const addQuestion = () => setQuestions((prev) => [...prev, blankQuestion()]);
  const removeQuestion = (index: number) =>
    setQuestions((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));

  const validate = () => {
    if (!title.trim()) return 'Vui lòng nhập tiêu đề bộ câu hỏi.';
    for (const [i, q] of questions.entries()) {
      if (!q.questionText.trim()) return `Câu hỏi ${i + 1} chưa có nội dung.`;
      if (q.options.some((o) => !o.trim())) return `Câu hỏi ${i + 1} còn lựa chọn trống.`;
      if (q.correctIndexes.length === 0) return `Câu hỏi ${i + 1} chưa chọn đáp án đúng.`;
    }
    return null;
  };

  const submit = async () => {
    const message = validate();
    if (message) {
      setFormError(message);
      return;
    }
    setSaving(true);
    setFormError(null);
    const payload: Record<string, unknown> = {
      title: title.trim(),
      course: course || null,
      questions: questions.map((q) => ({
        questionText: q.questionText.trim(),
        options: q.options.map((o) => o.trim()),
        correctIndexes: q.correctIndexes,
      })),
    };
    try {
      if (isEditing && id) {
        payload.isPublished = isPublished;
        await quizApi.update(id, payload);
      } else {
        await quizApi.create(payload);
      }
      router.back();
    } catch (err) {
      setFormError((err as ApiError)?.message || 'Không thể lưu bộ câu hỏi.');
    } finally {
      setSaving(false);
    }
  };

  const shellTitle = isEditing ? 'Sửa bộ câu hỏi' : 'Soạn bộ câu hỏi';

  if (loading)
    return (
      <ScreenShell title={shellTitle} onBack={() => router.back()}>
        <LoadingState />
      </ScreenShell>
    );

  return (
    <ScreenShell title={shellTitle} onBack={() => router.back()}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
      <TextField label="Tiêu đề bộ câu hỏi" value={title} onChangeText={setTitle} />
      <ChipSelect
        label="Học phần"
        options={[{ value: '', label: 'Không gắn' }, ...courses.map((c) => ({ value: c._id, label: c.code }))]}
        value={course}
        onChange={setCourse}
      />
      {isEditing ? (
        <ChipSelect
          label="Hiển thị"
          options={[
            { value: 'true', label: 'Công bố' },
            { value: 'false', label: 'Lưu nháp' },
          ]}
          value={String(isPublished)}
          onChange={(v) => setIsPublished(v === 'true')}
        />
      ) : null}

      {questions.map((question, qIndex) => (
        <Card key={qIndex} style={styles.qCard}>
          <View style={styles.qHeader}>
            <Text style={styles.qTitle}>Câu hỏi {qIndex + 1}</Text>
            {questions.length > 1 ? (
              <Pressable onPress={() => removeQuestion(qIndex)} hitSlop={8}>
                <Ionicons name="trash-outline" size={20} color={palette.danger} />
              </Pressable>
            ) : null}
          </View>
          <TextField
            placeholder="Nội dung câu hỏi"
            value={question.questionText}
            onChangeText={(text) => updateQuestion(qIndex, { questionText: text })}
            multiline
          />
          <Text style={styles.hint}>Chạm để chọn một hoặc nhiều đáp án đúng</Text>
          {question.options.map((option, oIndex) => {
            const correct = question.correctIndexes.includes(oIndex);
            return (
              <View key={oIndex} style={styles.optionRow}>
                <Pressable onPress={() => toggleCorrect(qIndex, oIndex)} hitSlop={8}>
                  <Ionicons
                    name={correct ? 'checkbox' : 'square-outline'}
                    size={24}
                    color={correct ? palette.success : palette.textFaint}
                  />
                </Pressable>
                <TextField
                  containerStyle={styles.flex}
                  placeholder={`Lựa chọn ${oIndex + 1}`}
                  value={option}
                  onChangeText={(value) => updateOption(qIndex, oIndex, value)}
                />
                {question.options.length > 2 ? (
                  <Pressable onPress={() => removeOption(qIndex, oIndex)} hitSlop={8}>
                    <Ionicons name="close-circle" size={22} color={palette.textFaint} />
                  </Pressable>
                ) : null}
              </View>
            );
          })}
          {question.options.length < 6 ? (
            <Pressable style={styles.addOption} onPress={() => addOption(qIndex)}>
              <Ionicons name="add" size={18} color={palette.brand} />
              <Text style={styles.addOptionText}>Thêm lựa chọn</Text>
            </Pressable>
          ) : null}
        </Card>
      ))}

      <Button label="＋ Thêm câu hỏi" variant="secondary" onPress={addQuestion} />
        {formError ? <Text style={styles.error}>{formError}</Text> : null}
        <Button label={isEditing ? 'Lưu thay đổi' : 'Tạo bộ câu hỏi'} loading={saving} onPress={submit} />
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  flex: { flex: 1 },
  body: { padding: 16, gap: 14 },
  qCard: { gap: 10 },
  qHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  qTitle: { fontSize: 15, fontWeight: '800', color: palette.text },
  hint: { fontSize: 12, color: palette.textFaint },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addOption: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  addOptionText: { fontSize: 14, fontWeight: '600', color: palette.brand },
  error: { color: palette.danger, fontSize: 13 },
});
