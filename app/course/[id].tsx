import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChipSelect } from '@/components/ui/chip-select';
import { ScreenShell } from '@/components/ui/screen-shell';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { TextField } from '@/components/ui/text-field';
import { palette } from '@/constants/palette';
import { useAuth } from '@/context/auth';
import { useAsync } from '@/hooks/use-async';
import { lessonApi, materialApi, quizApi } from '@/services/api';
import type { ApiError } from '@/services/api';
import { openProtectedFile } from '@/services/protected-file';

type LessonMaterial = { _id: string; title: string; fileUrl: string };
type Lesson = {
  _id: string;
  title: string;
  content?: string;
  order: number;
  completed: boolean;
  materials: LessonMaterial[];
  quiz?: { _id: string; title: string } | null;
};
type CourseMaterial = { _id: string; title: string };
type CourseQuiz = { _id: string; title: string };

const emptyForm = { title: '', content: '', order: '1', quiz: '', materials: [] as string[] };

export default function CourseLessonsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const canManage = user?.role === 'lecturer' || user?.role === 'admin';

  const { data, loading, error, reload } = useAsync<{
    data: { lessons: Lesson[]; completedCount: number };
  }>(() => lessonApi.list(String(id)), [id]);

  const [courseMaterials, setCourseMaterials] = useState<CourseMaterial[]>([]);
  const [courseQuizzes, setCourseQuizzes] = useState<CourseQuiz[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Lesson | 'new' | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!canManage) return;
    materialApi
      .list({ course: id, limit: 100 })
      .then((res: { data: CourseMaterial[] }) => setCourseMaterials(res.data))
      .catch(() => setCourseMaterials([]));
    quizApi
      .list({ course: id, limit: 100 })
      .then((res: { data: CourseQuiz[] }) => setCourseQuizzes(res.data))
      .catch(() => setCourseQuizzes([]));
  }, [id, canManage]);

  const lessons = data?.data.lessons ?? [];
  const completedCount = data?.data.completedCount ?? 0;
  const percent = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  const toggleComplete = async (lesson: Lesson) => {
    setBusyId(lesson._id);
    try {
      if (lesson.completed) await lessonApi.uncomplete(lesson._id);
      else await lessonApi.complete(lesson._id);
      await reload();
    } catch (err) {
      Alert.alert('Lỗi', (err as ApiError)?.message || 'Không thể cập nhật tiến độ.');
    } finally {
      setBusyId(null);
    }
  };

  const openMaterial = async (material: LessonMaterial) => {
    try {
      await openProtectedFile(material.fileUrl);
    } catch {
      Alert.alert('Không thể mở tệp', 'Tệp không tải được hoặc phiên đăng nhập đã hết hạn.');
    }
  };

  const openCreate = () => {
    setForm({ ...emptyForm, order: String(lessons.length + 1) });
    setFormError(null);
    setEditing('new');
  };

  const openEdit = (lesson: Lesson) => {
    setForm({
      title: lesson.title,
      content: lesson.content || '',
      order: String(lesson.order || 0),
      quiz: lesson.quiz?._id || '',
      materials: lesson.materials.map((m) => m._id),
    });
    setFormError(null);
    setEditing(lesson);
  };

  const toggleMaterialPick = (materialId: string) => {
    setForm((prev) => ({
      ...prev,
      materials: prev.materials.includes(materialId)
        ? prev.materials.filter((mid) => mid !== materialId)
        : [...prev.materials, materialId],
    }));
  };

  const submit = async () => {
    if (!form.title.trim()) {
      setFormError('Vui lòng nhập tiêu đề bài học.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        content: form.content.trim(),
        order: Number(form.order) || 0,
        quiz: form.quiz || null,
        materials: form.materials,
      };
      if (editing === 'new') {
        payload.course = id;
        await lessonApi.create(payload);
      } else if (editing) {
        await lessonApi.update(editing._id, payload);
      }
      await reload();
      setEditing(null);
    } catch (err) {
      setFormError((err as ApiError)?.message || 'Không thể lưu bài học.');
    } finally {
      setSaving(false);
    }
  };

  const remove = (lesson: Lesson) => {
    Alert.alert('Xóa bài học', `Xóa "${lesson.title}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await lessonApi.remove(lesson._id);
            await reload();
          } catch (err) {
            Alert.alert('Lỗi', (err as ApiError)?.message || 'Không thể xóa.');
          }
        },
      },
    ]);
  };

  if (editing) {
    const isNew = editing === 'new';
    return (
      <ScreenShell title={isNew ? 'Thêm bài học' : 'Sửa bài học'} onBack={() => setEditing(null)}>
        <ScrollView contentContainerStyle={styles.editorBody} keyboardShouldPersistTaps="handled">
          <TextField label="Tiêu đề bài học" value={form.title} onChangeText={(title) => setForm({ ...form, title })} />
          <TextField
            label="Nội dung"
            value={form.content}
            onChangeText={(content) => setForm({ ...form, content })}
            multiline
          />
          <TextField
            label="Thứ tự"
            keyboardType="number-pad"
            value={form.order}
            onChangeText={(order) => setForm({ ...form, order })}
          />
          {courseQuizzes.length > 0 ? (
            <ChipSelect
              label="Trắc nghiệm đính kèm"
              options={[{ value: '', label: 'Không gắn' }, ...courseQuizzes.map((q) => ({ value: q._id, label: q.title }))]}
              value={form.quiz}
              onChange={(quiz) => setForm({ ...form, quiz })}
            />
          ) : null}
          {courseMaterials.length > 0 ? (
            <View style={styles.pickBlock}>
              <Text style={styles.pickLabel}>Tài liệu đính kèm</Text>
              {courseMaterials.map((material) => {
                const picked = form.materials.includes(material._id);
                return (
                  <Pressable key={material._id} style={styles.pickRow} onPress={() => toggleMaterialPick(material._id)}>
                    <Ionicons
                      name={picked ? 'checkbox' : 'square-outline'}
                      size={22}
                      color={picked ? palette.brand : palette.textFaint}
                    />
                    <Text style={styles.pickText}>{material.title}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
          {formError ? <Text style={styles.error}>{formError}</Text> : null}
          <Button label={isNew ? 'Thêm bài học' : 'Lưu thay đổi'} loading={saving} onPress={submit} />
        </ScrollView>
      </ScreenShell>
    );
  }

  const back = () => router.back();

  return (
    <ScreenShell
      title="Nội dung học phần"
      onBack={back}
      right={
        canManage ? (
          <Pressable style={styles.addBtn} onPress={openCreate}>
            <Ionicons name="add" size={22} color="#fff" />
          </Pressable>
        ) : undefined
      }>
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          {isStudent && lessons.length > 0 ? (
            <Card style={styles.progressCard}>
              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>Tiến độ học tập</Text>
                <Text style={styles.progressValue}>
                  {completedCount}/{lessons.length} bài · {percent}%
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${percent}%` }]} />
              </View>
            </Card>
          ) : null}

          {lessons.length === 0 ? (
            <EmptyState
              title="Chưa có bài học"
              description={canManage ? 'Hãy thêm bài học đầu tiên.' : 'Giảng viên chưa đăng nội dung.'}
            />
          ) : (
            lessons.map((lesson, index) => {
              const isOpen = expanded === lesson._id;
              return (
                <Card key={lesson._id} style={styles.card}>
                  <View style={styles.lessonHeader}>
                    {isStudent ? (
                      <Pressable
                        hitSlop={8}
                        disabled={busyId === lesson._id}
                        onPress={() => toggleComplete(lesson)}>
                        <Ionicons
                          name={lesson.completed ? 'checkmark-circle' : 'ellipse-outline'}
                          size={26}
                          color={lesson.completed ? palette.success : palette.textFaint}
                        />
                      </Pressable>
                    ) : null}
                    <Pressable style={styles.flex} onPress={() => setExpanded(isOpen ? null : lesson._id)}>
                      <Text style={styles.lessonTitle}>
                        Bài {index + 1}. {lesson.title}
                      </Text>
                    </Pressable>
                    {lesson.completed ? <Badge label="Hoàn thành" tone="success" /> : null}
                    {canManage ? (
                      <View style={styles.manageRow}>
                        <Pressable hitSlop={8} onPress={() => openEdit(lesson)}>
                          <Ionicons name="create-outline" size={20} color={palette.textMuted} />
                        </Pressable>
                        <Pressable hitSlop={8} onPress={() => remove(lesson)}>
                          <Ionicons name="trash-outline" size={20} color={palette.danger} />
                        </Pressable>
                      </View>
                    ) : null}
                  </View>

                  {isOpen ? (
                    <View style={styles.lessonBody}>
                      {lesson.content ? <Text style={styles.content}>{lesson.content}</Text> : null}
                      {lesson.materials.map((material) => (
                        <Pressable key={material._id} style={styles.linkRow} onPress={() => openMaterial(material)}>
                          <Ionicons name="document-text-outline" size={18} color={palette.brand} />
                          <Text style={styles.linkText}>{material.title}</Text>
                        </Pressable>
                      ))}
                      {lesson.quiz ? (
                        <Pressable
                          style={styles.linkRow}
                          onPress={() => router.push(`/quizzes/${lesson.quiz?._id}`)}>
                          <Ionicons name="help-circle-outline" size={18} color={palette.brand} />
                          <Text style={styles.linkText}>Làm trắc nghiệm: {lesson.quiz.title}</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  ) : null}
                </Card>
              );
            })
          )}
        </ScrollView>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { padding: 16, gap: 12 },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: palette.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCard: { gap: 8 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontSize: 14, fontWeight: '600', color: palette.text },
  progressValue: { fontSize: 13, fontWeight: '700', color: palette.brand },
  progressTrack: { height: 8, borderRadius: 999, backgroundColor: palette.neutralSoft, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: palette.brand },
  card: { gap: 8 },
  lessonHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  lessonTitle: { fontSize: 15, fontWeight: '700', color: palette.text },
  manageRow: { flexDirection: 'row', gap: 12 },
  lessonBody: { gap: 8, borderTopWidth: 1, borderTopColor: palette.border, paddingTop: 10 },
  content: { fontSize: 14, color: palette.text, lineHeight: 21 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  linkText: { fontSize: 14, fontWeight: '600', color: palette.brand, flex: 1 },
  editorBody: { padding: 16, gap: 14 },
  pickBlock: { gap: 8 },
  pickLabel: { fontSize: 13, fontWeight: '600', color: palette.textMuted },
  pickRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  pickText: { fontSize: 14, color: palette.text, flex: 1 },
  error: { color: palette.danger, fontSize: 13 },
});
