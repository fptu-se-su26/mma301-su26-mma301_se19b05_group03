import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChipSelect } from '@/components/ui/chip-select';
import { ScreenShell } from '@/components/ui/screen-shell';
import { TextField } from '@/components/ui/text-field';
import { palette } from '@/constants/palette';
import { courseApi, quizApi } from '@/services/api';
import type { ApiError } from '@/services/api';

type Course = { _id: string; code: string; title?: string };
type PickedFile = { uri: string; name: string; mimeType?: string };

const excelTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

export default function QuizImportScreen() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [title, setTitle] = useState('');
  const [course, setCourse] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [file, setFile] = useState<PickedFile | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    courseApi.list({ limit: 100 }).then((res: { data: Course[] }) => setCourses(res.data)).catch(() => setCourses([]));
  }, []);

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: excelTypes, copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    setFile({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType });
  };

  const download = async (kind: 'template' | 'sample') => {
    try {
      const response = await quizApi[kind]();
      const bytes = response instanceof ArrayBuffer ? new Uint8Array(response) : new Uint8Array();
      let binary = '';
      bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
      const base64 = typeof response === 'string' ? response : btoa(binary);
      if (!base64) throw new Error('Không nhận được file mẫu');
      const uri = `${FileSystem.cacheDirectory}ste-quiz-${kind}.xlsx`;
      await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      else Alert.alert('Đã tải file', `File được lưu tại ${uri}`);
    } catch (err) {
      Alert.alert('Lỗi', (err as ApiError)?.message || 'Không thể tải file mẫu.');
    }
  };

  const submit = async () => {
    if (!title.trim()) return Alert.alert('Thiếu thông tin', 'Vui lòng nhập tiêu đề bộ câu hỏi.');
    if (!file) return Alert.alert('Thiếu thông tin', 'Vui lòng chọn file Excel.');
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('course', course);
      formData.append('isPublished', String(isPublished));
      formData.append('file', { uri: file.uri, name: file.name, type: file.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' } as unknown as Blob);
      await quizApi.import(formData);
      Alert.alert('Thành công', 'Đã tạo bộ câu hỏi từ Excel.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (err) {
      const apiError = err as ApiError;
      const details = Array.isArray(apiError.details) ? `\n${apiError.details.join('\n')}` : '';
      Alert.alert('Không thể import', `${apiError.message || 'File Excel không hợp lệ'}${details}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenShell title="Tạo quiz từ Excel" onBack={() => router.back()}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Card style={styles.info}><Text style={styles.infoTitle}>Format file</Text><Text style={styles.infoText}>Sheet Questions gồm questionText, optionA đến optionF và correctAnswers. Dùng A hoặc A,C cho đáp án đúng.</Text><Button label="Tải file trống" variant="secondary" size="sm" onPress={() => download('template')} /><Button label="Tải file mẫu có ví dụ" variant="secondary" size="sm" onPress={() => download('sample')} /></Card>
        <TextField label="Tiêu đề bộ câu hỏi" value={title} onChangeText={setTitle} />
        <ChipSelect label="Học phần" options={[{ value: '', label: 'Không gắn' }, ...courses.map((item) => ({ value: item._id, label: item.code }))]} value={course} onChange={setCourse} />
        <ChipSelect label="Trạng thái" options={[{ value: 'true', label: 'Công bố ngay' }, { value: 'false', label: 'Lưu nháp' }]} value={String(isPublished)} onChange={(value) => setIsPublished(value === 'true')} />
        <Button label={file ? `Đổi file: ${file.name}` : 'Chọn file Excel'} variant="secondary" onPress={pickFile} />
        <Button label="Tạo bộ câu hỏi" loading={saving} onPress={submit} />
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  body: { padding: 16, gap: 14 },
  info: { gap: 10, backgroundColor: palette.brandSoft },
  infoTitle: { fontSize: 15, fontWeight: '700', color: palette.brand },
  infoText: { fontSize: 13, lineHeight: 19, color: palette.textMuted },
});
