import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
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
import { assignmentApi, courseApi } from '@/services/api';
import type { ApiError } from '@/services/api';
import { formatDateTime } from '@/utils/format';

type Course = { _id: string; code: string; title: string };
type MySubmission = { status: string; score: number | null } | null;
type Assignment = {
  _id: string;
  title: string;
  description?: string;
  dueDate?: string | null;
  maxScore: number;
  isPublished: boolean;
  course?: { _id: string; code: string; title: string };
  mySubmission?: MySubmission;
  submissionCount?: number;
  gradedCount?: number;
};

const emptyForm = { course: '', title: '', description: '', dueDate: '', maxScore: '10', isPublished: true };

const statusTone = (status?: string): 'success' | 'warning' | 'neutral' => {
  if (status === 'graded') return 'success';
  if (status === 'submitted') return 'warning';
  return 'neutral';
};
const statusLabel = (status?: string) => {
  if (status === 'graded') return 'Đã chấm';
  if (status === 'submitted') return 'Đã nộp';
  return 'Chưa nộp';
};

export default function AssignmentsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const canManage = user?.role === 'lecturer' || user?.role === 'admin';

  const [courseFilter, setCourseFilter] = useState('');
  const courses = useAsync<{ data: Course[] }>(
    () => courseApi.list({ limit: 100, ...(isStudent ? { enrolled: 'true' } : { mine: 'true' }) }),
    []
  );
  const list = useAsync<{ data: Assignment[] }>(
    () => assignmentApi.list({ course: courseFilter || undefined }),
    [courseFilter]
  );

  const items = list.data?.data ?? [];
  const courseList = useMemo(() => courses.data?.data ?? [], [courses.data]);

  const [editing, setEditing] = useState<Assignment | 'new' | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      list.reload();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [courseFilter])
  );

  const openCreate = () => {
    setForm({ ...emptyForm, course: courseList[0]?._id || '' });
    setFormError(null);
    setEditing('new');
  };

  const openEdit = (assignment: Assignment) => {
    setForm({
      course: assignment.course?._id || '',
      title: assignment.title,
      description: assignment.description || '',
      dueDate: assignment.dueDate ? assignment.dueDate.slice(0, 10) : '',
      maxScore: String(assignment.maxScore),
      isPublished: assignment.isPublished,
    });
    setFormError(null);
    setEditing(assignment);
  };

  const submit = async () => {
    if (!form.title.trim() || (editing === 'new' && !form.course)) {
      setFormError('Vui lòng chọn học phần và nhập tiêu đề.');
      return;
    }
    let dueDate: string | null = null;
    if (form.dueDate.trim()) {
      const parsed = new Date(form.dueDate.trim());
      if (Number.isNaN(parsed.getTime())) {
        setFormError('Hạn nộp không hợp lệ (định dạng YYYY-MM-DD).');
        return;
      }
      dueDate = parsed.toISOString();
    }
    setSaving(true);
    setFormError(null);
    try {
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        description: form.description.trim(),
        dueDate,
        maxScore: Number(form.maxScore) || 10,
        isPublished: form.isPublished,
      };
      if (editing === 'new') {
        payload.course = form.course;
        await assignmentApi.create(payload);
      } else if (editing) {
        await assignmentApi.update(editing._id, payload);
      }
      await list.reload();
      setEditing(null);
    } catch (err) {
      setFormError((err as ApiError)?.message || 'Không thể lưu bài tập.');
    } finally {
      setSaving(false);
    }
  };

  const remove = (assignment: Assignment) => {
    Alert.alert('Xóa bài tập', `Xóa "${assignment.title}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await assignmentApi.remove(assignment._id);
            await list.reload();
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
      <ScreenShell title={isNew ? 'Tạo bài tập' : 'Sửa bài tập'} onBack={() => setEditing(null)}>
        <ScrollView contentContainerStyle={styles.editorBody} keyboardShouldPersistTaps="handled">
          {isNew ? (
            <ChipSelect
              label="Học phần"
              options={courseList.map((c) => ({ value: c._id, label: c.code }))}
              value={form.course}
              onChange={(course) => setForm({ ...form, course })}
            />
          ) : null}
          <TextField label="Tiêu đề" value={form.title} onChangeText={(title) => setForm({ ...form, title })} />
          <TextField
            label="Mô tả / yêu cầu"
            value={form.description}
            onChangeText={(description) => setForm({ ...form, description })}
            multiline
          />
          <TextField
            label="Hạn nộp (YYYY-MM-DD, để trống nếu không có)"
            placeholder="2026-07-31"
            value={form.dueDate}
            onChangeText={(dueDate) => setForm({ ...form, dueDate })}
          />
          <TextField
            label="Điểm tối đa"
            keyboardType="number-pad"
            value={form.maxScore}
            onChangeText={(maxScore) => setForm({ ...form, maxScore })}
          />
          <ChipSelect
            label="Hiển thị"
            options={[
              { value: 'true', label: 'Công bố' },
              { value: 'false', label: 'Lưu nháp' },
            ]}
            value={String(form.isPublished)}
            onChange={(v) => setForm({ ...form, isPublished: v === 'true' })}
          />
          {formError ? <Text style={styles.error}>{formError}</Text> : null}
          <Button label={isNew ? 'Tạo bài tập' : 'Lưu thay đổi'} loading={saving} onPress={submit} />
        </ScrollView>
      </ScreenShell>
    );
  }

  const back = () => router.back();

  return (
    <ScreenShell
      title="Bài tập"
      onBack={back}
      right={
        canManage ? (
          <Pressable style={styles.addBtn} onPress={openCreate}>
            <Ionicons name="add" size={22} color="#fff" />
          </Pressable>
        ) : undefined
      }>
      <View style={styles.filters}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {[{ _id: '', code: 'Tất cả' } as Course, ...courseList].map((course) => {
            const active = courseFilter === course._id;
            return (
              <Pressable
                key={course._id || 'all'}
                onPress={() => setCourseFilter(course._id)}
                style={[styles.chip, active && styles.chipActive]}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{course.code}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {list.loading ? (
        <LoadingState />
      ) : list.error ? (
        <ErrorState message={list.error} onRetry={list.reload} />
      ) : items.length === 0 ? (
        <EmptyState
          title="Chưa có bài tập"
          description={isStudent ? 'Chưa có bài tập trong học phần bạn đã ghi danh.' : 'Hãy tạo bài tập đầu tiên.'}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {items.map((item) => (
            <Pressable
              key={item._id}
              onPress={() => router.push({ pathname: '/assignment/[id]', params: { id: item._id } })}>
              <Card style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.flex}>
                    <Text style={styles.title}>{item.title}</Text>
                    <View style={styles.metaRow}>
                      {item.course ? <Badge label={item.course.code} tone="neutral" /> : null}
                      {!item.isPublished ? <Badge label="Nháp" tone="warning" /> : null}
                    </View>
                  </View>
                  {isStudent ? (
                    <Badge label={statusLabel(item.mySubmission?.status)} tone={statusTone(item.mySubmission?.status)} />
                  ) : (
                    <Badge label={`${item.gradedCount || 0}/${item.submissionCount || 0} đã chấm`} tone="brand" />
                  )}
                </View>
                <Text style={styles.meta}>
                  {item.dueDate ? `Hạn nộp: ${formatDateTime(item.dueDate)}` : 'Không có hạn nộp'} · Tối đa {item.maxScore} điểm
                </Text>
                {isStudent && item.mySubmission?.status === 'graded' ? (
                  <Text style={styles.score}>
                    Điểm: {item.mySubmission.score}/{item.maxScore}
                  </Text>
                ) : null}
                {canManage ? (
                  <View style={styles.cardActions}>
                    <Pressable style={styles.iconBtn} onPress={() => openEdit(item)}>
                      <Ionicons name="create-outline" size={20} color={palette.textMuted} />
                    </Pressable>
                    <Pressable style={styles.iconBtn} onPress={() => remove(item)}>
                      <Ionicons name="trash-outline" size={20} color={palette.danger} />
                    </Pressable>
                  </View>
                ) : null}
              </Card>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  filters: { paddingHorizontal: 16 },
  chipsRow: { gap: 8, paddingVertical: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  chipActive: { backgroundColor: palette.brand, borderColor: palette.brand },
  chipText: { fontSize: 13, fontWeight: '600', color: palette.textMuted },
  chipTextActive: { color: '#fff' },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: palette.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { padding: 16, gap: 12 },
  card: { gap: 8 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  title: { fontSize: 15, fontWeight: '700', color: palette.text, marginBottom: 4 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  meta: { fontSize: 12, color: palette.textFaint },
  score: { fontSize: 14, fontWeight: '700', color: palette.success },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editorBody: { padding: 16, gap: 14 },
  error: { color: palette.danger, fontSize: 13 },
});
