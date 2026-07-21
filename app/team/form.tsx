import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { Button } from '@/components/ui/button';
import { ChipSelect } from '@/components/ui/chip-select';
import { ScreenShell } from '@/components/ui/screen-shell';
import { LoadingState } from '@/components/ui/states';
import { TextField } from '@/components/ui/text-field';
import { palette } from '@/constants/palette';
import { teamApi } from '@/services/api';
import type { ApiError } from '@/services/api';

const toList = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const STATUS_OPTIONS = [
  { value: 'recruiting', label: 'Đang tuyển' },
  { value: 'full', label: 'Đã đủ' },
  { value: 'closed', label: 'Đã đóng' },
];

export default function TeamFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [form, setForm] = useState({
    name: '',
    description: '',
    topic: '',
    major: '',
    skills: '',
    maxMembers: '5',
    status: 'recruiting',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    teamApi
      .get(id)
      .then((res: { data: { team: Record<string, unknown> } }) => {
        const team = res.data.team as {
          name?: string;
          description?: string;
          topic?: string;
          major?: string;
          skillsNeeded?: string[];
          maxMembers?: number;
          status?: string;
        };
        setForm({
          name: team.name || '',
          description: team.description || '',
          topic: team.topic || '',
          major: team.major || '',
          skills: (team.skillsNeeded || []).join(', '),
          maxMembers: String(team.maxMembers || 5),
          status: team.status || 'recruiting',
        });
      })
      .catch(() => setError('Không thể tải nhóm.'))
      .finally(() => setLoading(false));
  }, [id]);

  const submit = async () => {
    if (form.name.trim().length < 3) {
      setError('Tên nhóm cần tối thiểu 3 ký tự.');
      return;
    }
    setSaving(true);
    setError(null);
    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      description: form.description.trim(),
      topic: form.topic.trim(),
      major: form.major.trim(),
      skillsNeeded: toList(form.skills),
      maxMembers: Number(form.maxMembers) || 5,
    };
    try {
      if (isEditing && id) {
        payload.status = form.status;
        await teamApi.update(id, payload);
      } else {
        await teamApi.create(payload);
      }
      router.back();
    } catch (err) {
      setError((err as ApiError)?.message || 'Không thể lưu nhóm.');
    } finally {
      setSaving(false);
    }
  };

  const title = isEditing ? 'Sửa nhóm' : 'Tạo nhóm';

  if (loading) {
    return (
      <ScreenShell title={title} onBack={() => router.back()}>
        <LoadingState />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell title={title} onBack={() => router.back()}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
      <TextField label="Tên nhóm" value={form.name} onChangeText={(name) => setForm({ ...form, name })} />
      <TextField
        label="Chủ đề / đề tài"
        value={form.topic}
        onChangeText={(topic) => setForm({ ...form, topic })}
      />
      <TextField
        label="Mô tả"
        value={form.description}
        onChangeText={(description) => setForm({ ...form, description })}
        multiline
      />
      <TextField label="Chuyên ngành" value={form.major} onChangeText={(major) => setForm({ ...form, major })} />
      <TextField
        label="Kỹ năng cần tuyển (phân tách bằng dấu phẩy)"
        placeholder="React, Figma, Python"
        value={form.skills}
        onChangeText={(skills) => setForm({ ...form, skills })}
      />
      <TextField
        label="Số thành viên tối đa"
        keyboardType="number-pad"
        value={form.maxMembers}
        onChangeText={(maxMembers) => setForm({ ...form, maxMembers })}
      />
      {isEditing ? (
        <ChipSelect
          label="Trạng thái"
          options={STATUS_OPTIONS}
          value={form.status}
          onChange={(status) => setForm({ ...form, status })}
        />
      ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button label={isEditing ? 'Lưu thay đổi' : 'Tạo nhóm'} loading={saving} onPress={submit} />
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  body: { padding: 16, gap: 14 },
  error: { color: palette.danger, fontSize: 13 },
});
