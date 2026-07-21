import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
import { courseApi, userApi } from '@/services/api';
import type { ApiError } from '@/services/api';

type Course = {
  _id: string;
  code: string;
  title: string;
  description?: string;
  semester?: string;
  isActive?: boolean;
  isEnrolled?: boolean;
  enrollmentCount?: number;
  lecturer?: { _id: string; name: string } | string;
};
type Lecturer = { _id: string; name: string };

const emptyForm = { code: '', title: '', description: '', semester: '', lecturer: '', isActive: true };

function ManageCourses() {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const { data, loading, error, reload } = useAsync<{ data: Course[] }>(
    () => courseApi.list({ limit: 100, mine: isAdmin ? undefined : 'true' }),
    []
  );
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [editing, setEditing] = useState<Course | null | 'new'>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const items = data?.data ?? [];

  useEffect(() => {
    if (!isAdmin) return;
    userApi
      .list({ role: 'lecturer', limit: 100 })
      .then((res: { data: Lecturer[] }) => setLecturers(res.data))
      .catch(() => setLecturers([]));
  }, [isAdmin]);

  const openCreate = () => {
    setForm(emptyForm);
    setFormError(null);
    setEditing('new');
  };

  const openEdit = (course: Course) => {
    const lecturerId = typeof course.lecturer === 'string' ? course.lecturer : course.lecturer?._id || '';
    setForm({
      code: course.code,
      title: course.title,
      description: course.description || '',
      semester: course.semester || '',
      lecturer: lecturerId,
      isActive: course.isActive ?? true,
    });
    setFormError(null);
    setEditing(course);
  };

  const submit = async () => {
    if (!form.code.trim() || !form.title.trim()) {
      setFormError('Vui lòng nhập mã và tên học phần.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const payload: Record<string, unknown> = {
        code: form.code.trim(),
        title: form.title.trim(),
        description: form.description.trim(),
        semester: form.semester.trim(),
      };
      if (isAdmin && form.lecturer) payload.lecturer = form.lecturer;
      if (editing === 'new') {
        await courseApi.create(payload);
      } else if (editing) {
        payload.isActive = form.isActive;
        await courseApi.update(editing._id, payload);
      }
      await reload();
      setEditing(null);
    } catch (err) {
      setFormError((err as ApiError)?.message || 'Không thể lưu học phần.');
    } finally {
      setSaving(false);
    }
  };

  const remove = (course: Course) => {
    Alert.alert('Xóa học phần', `Xóa "${course.code} — ${course.title}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await courseApi.remove(course._id);
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
      <ScreenShell title={isNew ? 'Thêm học phần' : 'Sửa học phần'} onBack={() => setEditing(null)}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.editorBody} keyboardShouldPersistTaps="handled">
        <TextField label="Mã học phần" value={form.code} onChangeText={(code) => setForm({ ...form, code })} />
        <TextField label="Tên học phần" value={form.title} onChangeText={(title) => setForm({ ...form, title })} />
        <TextField
          label="Mô tả"
          value={form.description}
          onChangeText={(description) => setForm({ ...form, description })}
          multiline
        />
        <TextField
          label="Học kỳ"
          placeholder="SU26"
          value={form.semester}
          onChangeText={(semester) => setForm({ ...form, semester })}
        />
        {isAdmin ? (
          <ChipSelect
            label="Giảng viên phụ trách"
            options={lecturers.map((l) => ({ value: l._id, label: l.name }))}
            value={form.lecturer}
            onChange={(lecturer) => setForm({ ...form, lecturer })}
          />
        ) : null}
        {!isNew ? (
          <ChipSelect
            label="Trạng thái"
            options={[
              { value: 'true', label: 'Đang mở' },
              { value: 'false', label: 'Đã đóng' },
            ]}
            value={String(form.isActive)}
            onChange={(v) => setForm({ ...form, isActive: v === 'true' })}
          />
        ) : null}
        {formError ? <Text style={styles.error}>{formError}</Text> : null}
        <View style={styles.actionRow}>
          <Button label="Hủy" variant="secondary" style={styles.flex} onPress={() => setEditing(null)} />
          <Button label={isNew ? 'Tạo' : 'Lưu'} style={styles.flex} loading={saving} onPress={submit} />
        </View>
      </ScrollView>
      </ScreenShell>
    );
  }

  const back = () => router.back();

  if (loading)
    return (
      <ScreenShell title="Quản lý học phần" onBack={back}>
        <LoadingState />
      </ScreenShell>
    );
  if (error)
    return (
      <ScreenShell title="Quản lý học phần" onBack={back}>
        <ErrorState message={error} onRetry={reload} />
      </ScreenShell>
    );

  return (
    <ScreenShell title="Quản lý học phần" onBack={back}>
    <ScrollView style={styles.screen} contentContainerStyle={styles.list}>
      <Button label="＋ Thêm học phần" onPress={openCreate} />
      {items.length === 0 ? (
        <EmptyState title="Chưa có học phần" description="Hãy tạo học phần đầu tiên." />
      ) : (
        items.map((course) => (
          <Card key={course._id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.flex}>
                <View style={styles.titleRow}>
                  <Text style={styles.code}>{course.code}</Text>
                  <Badge
                    label={course.isActive === false ? 'Đã đóng' : 'Đang mở'}
                    tone={course.isActive === false ? 'neutral' : 'success'}
                  />
                </View>
                <Text style={styles.title}>{course.title}</Text>
                {typeof course.lecturer !== 'string' && course.lecturer ? (
                  <Text style={styles.meta}>GV: {course.lecturer.name}</Text>
                ) : null}
              </View>
            </View>
            {course.description ? (
              <Text style={styles.desc} numberOfLines={2}>
                {course.description}
              </Text>
            ) : null}
            <View style={styles.manageLinks}>
              <Button
                label="Bài học"
                variant="secondary"
                size="sm"
                style={styles.flex}
                onPress={() => router.push(`/course/${course._id}`)}
              />
              <Button
                label="Phân tích"
                variant="secondary"
                size="sm"
                style={styles.flex}
                onPress={() => router.push(`/course-analytics?id=${course._id}`)}
              />
            </View>
            <View style={styles.cardActions}>
              <Pressable style={styles.iconBtn} onPress={() => openEdit(course)}>
                <Ionicons name="create-outline" size={20} color={palette.textMuted} />
              </Pressable>
              <Pressable style={styles.iconBtn} onPress={() => remove(course)}>
                <Ionicons name="trash-outline" size={20} color={palette.danger} />
              </Pressable>
            </View>
          </Card>
        ))
      )}
    </ScrollView>
    </ScreenShell>
  );
}

function StudentCourses() {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'enrolled'>('all');
  const { data, loading, error, reload } = useAsync<{ data: Course[] }>(
    () => courseApi.list({ limit: 100, enrolled: filter === 'enrolled' ? 'true' : undefined }),
    [filter]
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const items = data?.data ?? [];

  const toggle = async (course: Course) => {
    setBusyId(course._id);
    try {
      if (course.isEnrolled) await courseApi.unenroll(course._id);
      else await courseApi.enroll(course._id);
      await reload();
    } catch (err) {
      Alert.alert('Lỗi', (err as ApiError)?.message || 'Không thể cập nhật ghi danh.');
    } finally {
      setBusyId(null);
    }
  };

  const back = () => router.back();

  return (
    <ScreenShell title="Học phần" onBack={back}>
      <View style={styles.studentFilter}>
        {(['all', 'enrolled'] as const).map((key) => (
          <Pressable
            key={key}
            onPress={() => setFilter(key)}
            style={[styles.filterChip, filter === key && styles.filterChipActive]}>
            <Text style={[styles.filterText, filter === key && styles.filterTextActive]}>
              {key === 'all' ? 'Tất cả' : 'Đã ghi danh'}
            </Text>
          </Pressable>
        ))}
      </View>
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : items.length === 0 ? (
        <EmptyState title="Chưa có học phần" description="Không có học phần phù hợp." />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {items.map((course) => (
            <Card key={course._id} style={styles.card}>
              <View style={styles.titleRow}>
                <Text style={styles.code}>{course.code}</Text>
                {course.isEnrolled ? <Badge label="Đã ghi danh" tone="success" /> : null}
              </View>
              <Text style={styles.title}>{course.title}</Text>
              {typeof course.lecturer !== 'string' && course.lecturer ? (
                <Text style={styles.meta}>GV: {course.lecturer.name}</Text>
              ) : null}
              <Text style={styles.meta}>{course.enrollmentCount || 0} sinh viên đã ghi danh</Text>
              {course.isEnrolled ? (
                <Button
                  label="Nội dung bài học"
                  size="sm"
                  onPress={() => router.push(`/course/${course._id}`)}
                />
              ) : null}
              <Button
                label={course.isEnrolled ? 'Hủy ghi danh' : 'Ghi danh'}
                variant={course.isEnrolled ? 'secondary' : 'primary'}
                size="sm"
                loading={busyId === course._id}
                onPress={() => toggle(course)}
              />
            </Card>
          ))}
        </ScrollView>
      )}
    </ScreenShell>
  );
}

export default function CoursesScreen() {
  const { user } = useAuth();
  if (user?.role === 'student') return <StudentCourses />;
  return <ManageCourses />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  flex: { flex: 1 },
  list: { padding: 16, gap: 12 },
  studentFilter: { flexDirection: 'row', gap: 8, padding: 16, paddingBottom: 4 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  filterChipActive: { backgroundColor: palette.brand, borderColor: palette.brand },
  filterText: { fontSize: 13, fontWeight: '600', color: palette.textMuted },
  filterTextActive: { color: '#fff' },
  card: { gap: 8 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  code: { fontSize: 16, fontWeight: '800', color: palette.text },
  title: { fontSize: 14, color: palette.textMuted, marginTop: 2 },
  desc: { fontSize: 13, color: palette.textMuted, lineHeight: 19 },
  meta: { fontSize: 12, color: palette.textFaint, marginTop: 2 },
  manageLinks: { flexDirection: 'row', gap: 8 },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editorBody: { padding: 16, gap: 14 },
  editorTitle: { fontSize: 18, fontWeight: '800', color: palette.text },
  actionRow: { flexDirection: 'row', gap: 12 },
  error: { color: palette.danger, fontSize: 13 },
});
