import { useRouter } from 'expo-router';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';

import { Button } from '@/components/ui/button';
import { ScreenShell } from '@/components/ui/screen-shell';
import { TextField } from '@/components/ui/text-field';
import { palette } from '@/constants/palette';
import { useAuth } from '@/context/auth';
import { userApi } from '@/services/api';
import type { ApiError } from '@/services/api';

const toList = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export default function ProfileEditScreen() {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const isStudent = user?.role === 'student';

  const [form, setForm] = useState({
    name: user?.name || '',
    major: user?.major || '',
    description: user?.description || '',
    gpa: user?.gpa != null ? String(user.gpa) : '',
    skills: (user?.skills || []).join(', '),
    interests: (user?.interests || []).join(', '),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Cần quyền truy cập', 'Hãy cho phép ứng dụng truy cập thư viện ảnh để chọn ảnh đại diện.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    const formData = new FormData();
    formData.append('avatar', {
      uri: asset.uri,
      name: asset.fileName || 'avatar.jpg',
      type: asset.mimeType || 'image/jpeg',
    } as unknown as Blob);
    setUploading(true);
    try {
      const response = await userApi.updateAvatar(formData);
      setUser({ ...(user as NonNullable<typeof user>), ...response.data.user });
    } catch (requestError) {
      setError((requestError as ApiError).message || 'Không thể tải ảnh lên.');
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!form.name.trim()) {
      setError('Vui lòng nhập họ tên.');
      return;
    }
    setSaving(true);
    setError(null);
    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      major: form.major.trim(),
      description: form.description.trim(),
      skills: toList(form.skills),
    };
    if (isStudent) {
      payload.gpa = form.gpa === '' ? null : Number(form.gpa);
      payload.interests = toList(form.interests);
    }
    try {
      const res = await userApi.updateProfile(payload);
      setUser({ ...(user as NonNullable<typeof user>), ...res.data.user });
      router.back();
    } catch (err) {
      setError((err as ApiError)?.message || 'Không thể cập nhật hồ sơ.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenShell title="Chỉnh sửa hồ sơ" onBack={() => router.back()}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.body}
        automaticallyAdjustKeyboardInsets
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled">
      <TextField label="Họ và tên" value={form.name} onChangeText={(name) => setForm({ ...form, name })} />
       <TextField label="Chuyên ngành" value={form.major} onChangeText={(major) => setForm({ ...form, major })} />
       <Button label="Chọn ảnh đại diện" variant="secondary" loading={uploading} onPress={pickAvatar} />
      {isStudent ? (
        <TextField
          label="GPA (0 - 4)"
          keyboardType="decimal-pad"
          value={form.gpa}
          onChangeText={(gpa) => setForm({ ...form, gpa })}
        />
      ) : null}
      <TextField
        label="Giới thiệu bản thân"
        value={form.description}
        onChangeText={(description) => setForm({ ...form, description })}
        multiline
      />
      <TextField
        label="Kỹ năng (phân tách bằng dấu phẩy)"
        placeholder="React, Java, UI/UX"
        value={form.skills}
        onChangeText={(skills) => setForm({ ...form, skills })}
      />
      {isStudent ? (
        <TextField
          label="Lĩnh vực quan tâm (phân tách bằng dấu phẩy)"
          placeholder="Fintech, Y tế số"
          value={form.interests}
          onChangeText={(interests) => setForm({ ...form, interests })}
        />
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
       <Button label="Lưu thay đổi" loading={saving} disabled={uploading} onPress={submit} />
       </ScrollView>
      </KeyboardAvoidingView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  body: { padding: 16, paddingBottom: 48, gap: 14 },
  error: { color: palette.danger, fontSize: 13 },
});
