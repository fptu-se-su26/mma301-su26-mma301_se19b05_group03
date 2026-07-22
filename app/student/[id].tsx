import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScreenShell } from '@/components/ui/screen-shell';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { palette } from '@/constants/palette';
import { userApi, type ApiError } from '@/services/api';

type Student = { name: string; major?: string; avatarUrl?: string; description?: string; skills?: string[]; interests?: string[]; gpa?: number };

export default function StudentProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (id) userApi.publicProfile(id).then((response) => setStudent(response.data.student)).catch((requestError) => setError((requestError as ApiError).message)); }, [id]);
  if (error) return <ScreenShell title="Hồ sơ sinh viên" onBack={() => router.back()}><ErrorState message={error} /></ScreenShell>;
  if (!student) return <ScreenShell title="Hồ sơ sinh viên" onBack={() => router.back()}><LoadingState /></ScreenShell>;
  return <ScreenShell title="Hồ sơ sinh viên" onBack={() => router.back()}><ScrollView contentContainerStyle={styles.body}><Card style={styles.header}><Avatar name={student.name} avatarUrl={student.avatarUrl} size={76} /><Text style={styles.name}>{student.name}</Text><Text style={styles.meta}>{student.major || 'Sinh viên'}{student.gpa != null ? ` · GPA ${student.gpa}` : ''}</Text></Card>{student.description ? <Card><Text style={styles.section}>Giới thiệu</Text><Text style={styles.text}>{student.description}</Text></Card> : null}<Card><Text style={styles.section}>Kỹ năng và quan tâm</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tags}>{[...(student.skills || []).map((item) => ({ type: 'skill', item })), ...(student.interests || []).map((item) => ({ type: 'interest', item }))].map(({ type, item }, index) => <Badge key={`${type}-${item}-${index}`} label={item} tone="neutral" />)}</ScrollView>{!student.skills?.length && !student.interests?.length ? <EmptyState title="Chưa cập nhật" /> : null}</Card></ScrollView></ScreenShell>;
}

const styles = StyleSheet.create({ body: { padding: 16, gap: 12 }, header: { alignItems: 'center', gap: 6, paddingVertical: 24 }, name: { color: palette.text, fontSize: 20, fontWeight: '800' }, meta: { color: palette.textMuted }, section: { color: palette.text, fontWeight: '800', marginBottom: 8 }, text: { color: palette.text, lineHeight: 21 }, tags: { gap: 8 } });
