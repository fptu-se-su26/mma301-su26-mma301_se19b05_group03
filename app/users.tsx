import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChipSelect } from '@/components/ui/chip-select';
import { ScreenShell } from '@/components/ui/screen-shell';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { TextField } from '@/components/ui/text-field';
import { ROLE_LABELS } from '@/constants/labels';
import { palette } from '@/constants/palette';
import { useAsync } from '@/hooks/use-async';
import { userApi } from '@/services/api';
import type { ApiError } from '@/services/api';

type AppUser = {
  _id: string;
  name: string;
  email: string;
  role: string;
  major?: string;
  gpa?: number | null;
  skills?: string[];
  interests?: string[];
  description?: string;
  isActive?: boolean;
};

const ROLE_OPTIONS = [
  { value: 'student', label: 'Sinh viên' },
  { value: 'lecturer', label: 'Giảng viên' },
  { value: 'admin', label: 'Quản trị viên' },
  { value: 'club_leader', label: 'Chủ nhiệm CLB' },
];

const roleTone: Record<string, 'brand' | 'warning' | 'success' | 'neutral' | 'danger'> = {
  admin: 'danger',
  lecturer: 'warning',
  student: 'brand',
  club_leader: 'success',
};

const emptyForm = {
  name: '',
  email: '',
  password: '',
  role: 'student',
  major: '',
  gpa: '',
  skills: '',
  interests: '',
  description: '',
  isActive: true,
};

const parseList = (value: string) =>
  value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

export default function UsersScreen() {
  const router = useRouter();
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const { data, loading, error, reload } = useAsync<{ data: AppUser[] }>(
    () => userApi.list({ limit: 100, role: roleFilter || undefined, search: query || undefined }),
    [roleFilter, query]
  );
  const [editing, setEditing] = useState<AppUser | null | 'new'>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const items = data?.data ?? [];

  const openCreate = () => {
    setForm(emptyForm);
    setFormError(null);
    setEditing('new');
  };

  const openEdit = (u: AppUser) => {
    setForm({
      name: u.name,
      email: u.email,
      password: '',
      role: u.role,
      major: u.major || '',
      gpa: u.gpa == null ? '' : String(u.gpa),
      skills: (u.skills || []).join(', '),
      interests: (u.interests || []).join(', '),
      description: u.description || '',
      isActive: u.isActive ?? true,
    });
    setFormError(null);
    setEditing(u);
  };

  const submit = async () => {
    if (editing === 'new') {
      if (!form.name.trim() || !form.email.trim() || form.password.length < 8) {
        setFormError('Nhập tên, email và mật khẩu tối thiểu 8 ký tự.');
        return;
      }
    } else if (!form.name.trim()) {
      setFormError('Vui lòng nhập tên.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      if (editing === 'new') {
        await userApi.create({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
          major: form.major.trim(),
        });
      } else if (editing) {
        await userApi.update(editing._id, {
          name: form.name.trim(),
          role: form.role,
          isActive: form.isActive,
          major: form.major.trim(),
          description: form.description.trim(),
          skills: parseList(form.skills),
          interests: parseList(form.interests),
          gpa: form.gpa.trim() === '' ? null : Number(form.gpa),
        });
      }
      await reload();
      setEditing(null);
    } catch (err) {
      setFormError((err as ApiError)?.message || 'Không thể lưu người dùng.');
    } finally {
      setSaving(false);
    }
  };

  const remove = (u: AppUser) => {
    Alert.alert('Xóa người dùng', `Xóa "${u.name}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await userApi.remove(u._id);
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
      <ScreenShell title={isNew ? 'Thêm người dùng' : 'Sửa người dùng'} onBack={() => setEditing(null)}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.editorBody} keyboardShouldPersistTaps="handled">
        <TextField label="Họ tên" value={form.name} onChangeText={(name) => setForm({ ...form, name })} />
        {isNew ? (
          <>
            <TextField
              label="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              value={form.email}
              onChangeText={(email) => setForm({ ...form, email })}
            />
            <TextField
              label="Mật khẩu (tối thiểu 8 ký tự)"
              secureTextEntry
              value={form.password}
              onChangeText={(password) => setForm({ ...form, password })}
            />
            <TextField
              label="Chuyên ngành"
              value={form.major}
              onChangeText={(major) => setForm({ ...form, major })}
            />
          </>
        ) : null}
        <ChipSelect
          label="Vai trò"
          options={ROLE_OPTIONS}
          value={form.role}
          onChange={(role) => setForm({ ...form, role })}
        />
        {!isNew ? (
          <>
            <ChipSelect
              label="Trạng thái"
              options={[
                { value: 'true', label: 'Đang hoạt động' },
                { value: 'false', label: 'Đã khóa' },
              ]}
              value={String(form.isActive)}
              onChange={(v) => setForm({ ...form, isActive: v === 'true' })}
            />
            <TextField label="Chuyên ngành" value={form.major} onChangeText={(major) => setForm({ ...form, major })} />
            <TextField
              label="GPA"
              keyboardType="decimal-pad"
              placeholder="0 - 4"
              value={form.gpa}
              onChangeText={(gpa) => setForm({ ...form, gpa })}
            />
            <TextField
              label="Kỹ năng (phân tách bằng dấu phẩy)"
              value={form.skills}
              onChangeText={(skills) => setForm({ ...form, skills })}
            />
            <TextField
              label="Sở thích (phân tách bằng dấu phẩy)"
              value={form.interests}
              onChangeText={(interests) => setForm({ ...form, interests })}
            />
            <TextField
              label="Giới thiệu"
              multiline
              value={form.description}
              onChangeText={(description) => setForm({ ...form, description })}
            />
          </>
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

  return (
    <ScreenShell title="Quản lý người dùng" onBack={() => router.back()}>
    <ScrollView style={styles.screen} contentContainerStyle={styles.list}>
      <Button label="＋ Thêm người dùng" onPress={openCreate} />
      <View style={styles.searchRow}>
        <TextField
          containerStyle={styles.flex}
          placeholder="Tìm theo tên, email..."
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          onSubmitEditing={() => setQuery(search.trim())}
        />
        <Button label="Tìm" variant="secondary" onPress={() => setQuery(search.trim())} />
      </View>
      <ChipSelect
        options={[{ value: '', label: 'Tất cả' }, ...ROLE_OPTIONS]}
        value={roleFilter}
        onChange={setRoleFilter}
      />

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : items.length === 0 ? (
        <EmptyState title="Không có người dùng" description="Không tìm thấy người dùng phù hợp." />
      ) : (
        items.map((u) => (
          <Card key={u._id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Avatar name={u.name} size={40} />
              <View style={styles.flex}>
                <Text style={styles.name}>{u.name}</Text>
                <Text style={styles.meta}>{u.email}</Text>
              </View>
              <Badge label={ROLE_LABELS[u.role] || u.role} tone={roleTone[u.role] || 'neutral'} />
            </View>
             <View style={styles.roleControl}><Text style={styles.roleLabel}>Vai trò</Text><ChipSelect options={ROLE_OPTIONS} value={u.role} onChange={async (role) => { try { await userApi.update(u._id, { role }); await reload(); } catch (err) { Alert.alert('Không thể cập nhật vai trò', (err as ApiError)?.message || 'Vui lòng thử lại.'); } }} /></View>
             <View style={styles.cardActions}>
               {u.isActive === false ? <Badge label="Đã khóa" tone="danger" /> : <View style={styles.flex} />}
              <Pressable style={styles.iconBtn} onPress={() => openEdit(u)}>
                <Ionicons name="create-outline" size={20} color={palette.textMuted} />
              </Pressable>
              <Pressable style={styles.iconBtn} onPress={() => remove(u)}>
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  flex: { flex: 1 },
  list: { padding: 16, gap: 12 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  card: { gap: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { fontSize: 15, fontWeight: '700', color: palette.text },
  meta: { fontSize: 12, color: palette.textFaint },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  roleControl: { gap: 6 },
  roleLabel: { fontSize: 12, fontWeight: '700', color: palette.textMuted },
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
