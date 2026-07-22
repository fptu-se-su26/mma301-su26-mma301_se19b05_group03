import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChipSelect } from '@/components/ui/chip-select';
import { DetailHeader } from '@/components/ui/detail-header';
import { ScreenHeader } from '@/components/ui/screen-header';
import { TextField } from '@/components/ui/text-field';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { palette } from '@/constants/palette';
import { useAuth } from '@/context/auth';
import { useAsync } from '@/hooks/use-async';
import { courseApi, materialApi } from '@/services/api';
import type { ApiError } from '@/services/api';
import { formatFileSize, formatRelative } from '@/utils/format';
import { openProtectedFile } from '@/services/protected-file';

type Course = { _id: string; code: string; title: string };
type Material = {
  _id: string;
  title: string;
  description?: string;
  fileUrl: string;
  size?: number;
  downloadCount?: number;
  createdAt: string;
  course?: { _id: string; code: string; title: string };
};
type PickedFile = { uri: string; name: string; mimeType?: string };

export default function MaterialsScreen() {
  const { user } = useAuth();
  const canManage = ['lecturer', 'admin'].includes(user?.role || '');
  const isAdmin = user?.role === 'admin';

  const [courseFilter, setCourseFilter] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Material | null | 'new'>(null);
  const [form, setForm] = useState({ course: '', title: '', description: '' });
  const [file, setFile] = useState<PickedFile | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const courses = useAsync<{ data: Course[] }>(
    () => courseApi.list({ limit: 100, mine: user?.role === 'lecturer' ? 'true' : undefined }),
    [user?.role]
  );
  const materials = useAsync<{ data: Material[] }>(
    () => materialApi.list({ limit: 50, course: courseFilter || undefined, search: query || undefined }),
    [courseFilter, query]
  );

  const items = materials.data?.data ?? [];
  const courseList = useMemo(() => courses.data?.data ?? [], [courses.data]);
  const manageableCourseIds = useMemo(() => new Set(courseList.map((course) => course._id)), [courseList]);

  const chips = useMemo(
    () => [{ _id: '', code: 'Tất cả', title: '' } as Course, ...courseList],
    [courseList]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await materials.reload();
    setRefreshing(false);
  }, [materials]);

  const openFile = async (material: Material) => {
    setOpeningId(material._id);
    try {
      await openProtectedFile(material.fileUrl, material.title);
    } catch (requestError) {
      Alert.alert('Không thể mở tệp', (requestError as Error).message || 'Tệp không tải được hoặc phiên đăng nhập đã hết hạn.');
    }
    setOpeningId(null);
    materials.reload();
  };

  const openCreate = () => {
    setForm({ course: courseList[0]?._id || '', title: '', description: '' });
    setFile(null);
    setFormError(null);
    setEditing('new');
  };

  const openEdit = (material: Material) => {
    setForm({
      course: material.course?._id || '',
      title: material.title,
      description: material.description || '',
    });
    setFile(null);
    setFormError(null);
    setEditing(material);
  };

  const pickFile = async () => {
    const res = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (res.canceled || !res.assets?.length) return;
    const asset = res.assets[0];
    setFile({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType });
  };

  const submit = async () => {
    if (!form.course || !form.title.trim()) {
      setFormError('Vui lòng chọn học phần và nhập tiêu đề.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      if (editing === 'new') {
        if (!file) {
          setFormError('Vui lòng chọn tệp tài liệu.');
          setSaving(false);
          return;
        }
        const formData = new FormData();
        formData.append('course', form.course);
        formData.append('title', form.title.trim());
        formData.append('description', form.description.trim());
        formData.append('file', {
          uri: file.uri,
          name: file.name,
          type: file.mimeType || 'application/octet-stream',
        } as unknown as Blob);
        await materialApi.upload(formData);
      } else if (editing) {
        await materialApi.update(editing._id, {
          course: form.course,
          title: form.title.trim(),
          description: form.description.trim(),
        });
      }
      await materials.reload();
      setEditing(null);
    } catch (err) {
      setFormError((err as ApiError)?.message || 'Không thể lưu tài liệu.');
    } finally {
      setSaving(false);
    }
  };

  const remove = (material: Material) => {
    Alert.alert('Xóa tài liệu', `Xóa "${material.title}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await materialApi.remove(material._id);
            await materials.reload();
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
      <SafeAreaView style={styles.safe} edges={['top']}>
        <DetailHeader title={isNew ? 'Tải tài liệu lên' : 'Sửa tài liệu'} onBack={() => setEditing(null)} />
        <ScrollView contentContainerStyle={styles.editorBody} keyboardShouldPersistTaps="handled">
          <ChipSelect
            label="Học phần"
            options={courseList.map((c) => ({ value: c._id, label: c.code }))}
            value={form.course}
            onChange={(course) => setForm({ ...form, course })}
          />
          <TextField label="Tiêu đề" value={form.title} onChangeText={(title) => setForm({ ...form, title })} />
          <TextField
            label="Mô tả"
            value={form.description}
            onChangeText={(description) => setForm({ ...form, description })}
            multiline
          />
          {isNew ? (
            <View style={styles.fileBlock}>
              <Text style={styles.label}>Tệp tài liệu</Text>
              <Button
                label={file ? file.name : 'Chọn tệp (PDF, DOCX, PPTX...)'}
                variant="secondary"
                onPress={pickFile}
              />
            </View>
          ) : null}
          {formError ? <Text style={styles.error}>{formError}</Text> : null}
          <Button label={isNew ? 'Tải lên' : 'Lưu thay đổi'} loading={saving} onPress={submit} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const renderItem = ({ item }: { item: Material }) => (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconBox}>
          <Ionicons name="document-text-outline" size={22} color={palette.brand} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.title}>{item.title}</Text>
          {item.course ? <Badge label={item.course.code} tone="neutral" /> : null}
        </View>
      </View>
      {item.description ? (
        <Text style={styles.desc} numberOfLines={2}>
          {item.description}
        </Text>
      ) : null}
      <Text style={styles.meta}>
        {formatFileSize(item.size)} · {item.downloadCount || 0} lượt tải · {formatRelative(item.createdAt)}
      </Text>
      <View style={styles.cardActions}>
        <Button
          label="Mở tài liệu"
          variant="secondary"
          size="sm"
          style={styles.flex}
          loading={openingId === item._id}
          onPress={() => openFile(item)}
        />
        {canManage && (isAdmin || Boolean(item.course?._id && manageableCourseIds.has(item.course._id))) ? (
          <>
            <Pressable style={styles.iconBtn} onPress={() => openEdit(item)}>
              <Ionicons name="create-outline" size={20} color={palette.textMuted} />
            </Pressable>
            <Pressable style={styles.iconBtn} onPress={() => remove(item)}>
              <Ionicons name="trash-outline" size={20} color={palette.danger} />
            </Pressable>
          </>
        ) : null}
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title="Tài liệu"
        subtitle="Kho tài liệu học tập do giảng viên biên soạn"
        right={
          canManage ? (
            <Pressable style={styles.addBtn} onPress={openCreate}>
              <Ionicons name="add" size={22} color="#fff" />
            </Pressable>
          ) : undefined
        }
      />

      <View style={styles.filters}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {chips.map((course) => {
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
        <View style={styles.searchRow}>
          <TextField
            containerStyle={styles.searchInput}
            placeholder="Tìm tài liệu..."
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            onSubmitEditing={() => setQuery(search.trim())}
          />
          <Button label="Tìm" variant="secondary" onPress={() => setQuery(search.trim())} />
        </View>
      </View>

      {materials.loading && !refreshing ? (
        <LoadingState />
      ) : materials.error ? (
        <ErrorState message={materials.error} onRetry={materials.reload} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <EmptyState title="Chưa có tài liệu" description="Không có tài liệu cho bộ lọc hiện tại." />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.background },
  flex: { flex: 1 },
  filters: { paddingHorizontal: 16, gap: 10, paddingBottom: 4 },
  chipsRow: { gap: 8, paddingVertical: 4 },
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
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchInput: { flex: 1 },
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
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: palette.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 15, fontWeight: '700', color: palette.text, marginBottom: 4 },
  desc: { fontSize: 14, color: palette.textMuted, lineHeight: 20 },
  meta: { fontSize: 12, color: palette.textFaint },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
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
  label: { fontSize: 13, fontWeight: '600', color: palette.textMuted, marginBottom: 6 },
  fileBlock: { gap: 0 },
  error: { color: palette.danger, fontSize: 13 },
});
