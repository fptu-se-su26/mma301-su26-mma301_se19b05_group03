import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChipSelect } from '@/components/ui/chip-select';
import { DetailHeader } from '@/components/ui/detail-header';
import { ScreenHeader } from '@/components/ui/screen-header';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { TextField } from '@/components/ui/text-field';
import { ANNOUNCEMENT_SCOPE_LABELS } from '@/constants/labels';
import { palette } from '@/constants/palette';
import { useAuth } from '@/context/auth';
import { useAsync } from '@/hooks/use-async';
import { announcementApi, courseApi } from '@/services/api';
import type { ApiError } from '@/services/api';
import { formatDateTime, formatRelative } from '@/utils/format';

type Announcement = {
  _id: string;
  title: string;
  content: string;
  scope: string;
  audience?: string;
  status?: string;
  createdAt: string;
  author?: { _id: string; name: string; role: string };
  course?: { _id: string; code: string; title: string };
};

type Course = { _id: string; code: string; title: string };

type Mode = { view: 'list' } | { view: 'detail'; item: Announcement } | { view: 'editor'; item: Announcement | null };

const AUDIENCE_OPTIONS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'students', label: 'Sinh viên' },
  { value: 'lecturers', label: 'Giảng viên' },
];

const SCOPE_OPTIONS = [
  { value: 'global', label: 'Toàn hệ thống' },
  { value: 'course', label: 'Theo học phần' },
];

const emptyForm = { title: '', content: '', scope: 'global', course: '', audience: 'all', broadcast: false };

export default function AnnouncementsScreen() {
  const { user } = useAuth();
  const canManage = ['lecturer', 'admin'].includes(user?.role || '');
  const isAdmin = user?.role === 'admin';
  const myId = user?.id || user?._id;
  const [query, setQuery] = useState('');

  const { data, loading, error, reload } = useAsync<{ data: Announcement[] }>(
    () => announcementApi.list({ limit: 50, search: query.trim() || undefined }),
    [query]
  );
  const [refreshing, setRefreshing] = useState(false);
  const [mode, setMode] = useState<Mode>({ view: 'list' });
  const [courses, setCourses] = useState<Course[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const items = data?.data ?? [];

  useEffect(() => {
    if (!canManage) return;
    courseApi
      .list({ limit: 100 })
      .then((res: { data: Course[] }) => setCourses(res.data))
      .catch(() => setCourses([]));
  }, [canManage]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }, [reload]);

  const canEdit = (item: Announcement) => isAdmin || item.author?._id === myId;

  const openCreate = () => {
    setForm(emptyForm);
    setFormError(null);
    setMode({ view: 'editor', item: null });
  };

  const openEdit = (item: Announcement) => {
    setForm({
      title: item.title,
      content: item.content,
      scope: item.scope,
      course: item.course?._id || '',
      audience: item.audience || 'all',
      broadcast: false,
    });
    setFormError(null);
    setMode({ view: 'editor', item });
  };

  const submit = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      setFormError('Vui lòng nhập tiêu đề và nội dung.');
      return;
    }
    const editing = mode.view === 'editor' ? mode.item : null;
    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        await announcementApi.update(editing._id, {
          title: form.title.trim(),
          content: form.content.trim(),
          audience: form.audience,
        });
      } else {
        const payload: Record<string, unknown> = {
          title: form.title.trim(),
          content: form.content.trim(),
          scope: form.scope,
          audience: form.audience,
        };
        if (form.scope === 'course') payload.course = form.course;
        if (isAdmin && form.broadcast) await announcementApi.broadcast(payload);
        else await announcementApi.create(payload);
      }
      await reload();
      setMode({ view: 'list' });
    } catch (err) {
      setFormError((err as ApiError)?.message || 'Không thể lưu thông báo.');
    } finally {
      setSaving(false);
    }
  };

  const remove = (item: Announcement) => {
    Alert.alert('Xóa thông báo', `Xóa "${item.title}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await announcementApi.remove(item._id);
            await reload();
            setMode({ view: 'list' });
          } catch (err) {
            Alert.alert('Lỗi', (err as ApiError)?.message || 'Không thể xóa.');
          }
        },
      },
    ]);
  };

  if (mode.view === 'editor') {
    const editing = mode.item;
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <DetailHeader
          title={editing ? 'Sửa thông báo' : 'Tạo thông báo'}
          onBack={() => setMode({ view: 'list' })}
        />
        <ScrollView contentContainerStyle={styles.detailBody} keyboardShouldPersistTaps="handled">
          <TextField
            label="Tiêu đề"
            value={form.title}
            onChangeText={(title) => setForm({ ...form, title })}
          />
          <TextField
            label="Nội dung"
            value={form.content}
            onChangeText={(content) => setForm({ ...form, content })}
            multiline
          />
          <ChipSelect
            label="Đối tượng"
            options={AUDIENCE_OPTIONS}
            value={form.audience}
            onChange={(audience) => setForm({ ...form, audience })}
          />
          {!editing ? (
            <>
              <ChipSelect
                label="Phạm vi"
                options={SCOPE_OPTIONS}
                value={form.scope}
                onChange={(scope) => setForm({ ...form, scope })}
              />
              {form.scope === 'course' ? (
                <ChipSelect
                  label="Học phần"
                  options={courses.map((c) => ({ value: c._id, label: c.code }))}
                  value={form.course}
                  onChange={(course) => setForm({ ...form, course })}
                />
              ) : null}
              {isAdmin ? (
                <Pressable
                  style={styles.checkRow}
                  onPress={() => setForm({ ...form, broadcast: !form.broadcast })}>
                  <Ionicons
                    name={form.broadcast ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={form.broadcast ? palette.brand : palette.textFaint}
                  />
                  <Text style={styles.checkLabel}>Gửi thông báo đẩy tới tất cả người dùng</Text>
                </Pressable>
              ) : null}
            </>
          ) : null}
          {formError ? <Text style={styles.error}>{formError}</Text> : null}
          <Button label={editing ? 'Lưu thay đổi' : 'Đăng thông báo'} loading={saving} onPress={submit} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (mode.view === 'detail') {
    const item = mode.item;
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <DetailHeader title="Chi tiết thông báo" onBack={() => setMode({ view: 'list' })} />
        <ScrollView contentContainerStyle={styles.detailBody}>
          <Card style={styles.detailCard}>
            <Badge
              label={
                item.course
                  ? `${item.course.code} — ${item.course.title}`
                  : ANNOUNCEMENT_SCOPE_LABELS[item.scope] || 'Thông báo'
              }
              tone={item.scope === 'course' ? 'brand' : 'success'}
            />
            <Text style={styles.detailTitle}>{item.title}</Text>
            <Text style={styles.meta}>
              {item.author?.name || 'Ban điều hành'} · {formatDateTime(item.createdAt)}
            </Text>
            <View style={styles.divider} />
            <Text style={styles.detailContent}>{item.content}</Text>
          </Card>
          {canEdit(item) ? (
            <View style={styles.actionRow}>
              <Button
                label="Sửa"
                variant="secondary"
                style={styles.flex}
                onPress={() => openEdit(item)}
              />
              <Button label="Xóa" variant="danger" style={styles.flex} onPress={() => remove(item)} />
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title="Thông báo"
        subtitle="Thông báo học vụ và toàn hệ thống"
        right={
          canManage ? (
            <Pressable style={styles.addBtn} onPress={openCreate}>
              <Ionicons name="add" size={22} color="#fff" />
            </Pressable>
          ) : undefined
        }
      />
      <TextField label="Tìm thông báo" value={query} onChangeText={setQuery} />
      {loading && !refreshing ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <Pressable onPress={() => setMode({ view: 'detail', item })}>
              <Card style={styles.card}>
                <View style={styles.row}>
                  <Badge
                    label={item.course ? item.course.code : ANNOUNCEMENT_SCOPE_LABELS[item.scope] || 'Thông báo'}
                    tone={item.scope === 'course' ? 'brand' : 'success'}
                  />
                  <Text style={styles.meta}>{formatRelative(item.createdAt)}</Text>
                </View>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.content} numberOfLines={2}>
                  {item.content}
                </Text>
                <Text style={styles.author}>{item.author?.name || 'Ban điều hành'}</Text>
              </Card>
            </Pressable>
          )}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <EmptyState title="Chưa có thông báo" description="Hiện chưa có thông báo nào." />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.background },
  flex: { flex: 1 },
  list: { padding: 16, gap: 12 },
  card: { gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  meta: { fontSize: 12, color: palette.textFaint },
  title: { fontSize: 16, fontWeight: '700', color: palette.text },
  content: { fontSize: 14, color: palette.textMuted, lineHeight: 20 },
  author: { fontSize: 12, color: palette.textFaint, marginTop: 2 },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: palette.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailBody: { padding: 16, gap: 14 },
  detailCard: { gap: 10 },
  detailTitle: { fontSize: 22, fontWeight: '800', color: palette.text, lineHeight: 30 },
  detailContent: { fontSize: 15, color: palette.text, lineHeight: 24 },
  divider: { height: 1, backgroundColor: palette.border, marginVertical: 2 },
  actionRow: { flexDirection: 'row', gap: 12 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkLabel: { flex: 1, fontSize: 14, color: palette.text },
  error: { color: palette.danger, fontSize: 13 },
});
