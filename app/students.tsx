import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { ScreenShell } from '@/components/ui/screen-shell';
import { EmptyState, LoadingState } from '@/components/ui/states';
import { TextField } from '@/components/ui/text-field';
import { palette } from '@/constants/palette';
import { userApi, type ApiError } from '@/services/api';

type Student = { _id: string; name: string; major?: string; avatarUrl?: string; skills?: string[] };

export default function StudentsScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (value: string) => {
    setQuery(value);
    if (value.trim().length < 2) { setItems([]); return; }
    setLoading(true);
    try {
      const response = await userApi.searchStudents({ search: value.trim(), limit: 30 });
      setItems(response.data || []);
      setError(null);
    } catch (requestError) {
      setError((requestError as ApiError).message || 'Không thể tìm sinh viên.');
    } finally { setLoading(false); }
  };

  return (
    <ScreenShell title="Tìm sinh viên" onBack={() => router.back()}>
      <TextField label="Tên, mã sinh viên hoặc chuyên ngành" value={query} onChangeText={search} autoFocus />
      {loading ? <LoadingState /> : error ? <Text style={styles.error}>{error}</Text> : items.length === 0 && query.length >= 2 ? <EmptyState title="Không tìm thấy" description="Thử từ khóa khác." /> : (
        <FlatList data={items} keyExtractor={(item) => item._id} contentContainerStyle={styles.list} renderItem={({ item }) => (
          <Pressable accessibilityRole="button" accessibilityLabel={`Xem hồ sơ ${item.name}`} onPress={() => router.push(`/student/${item._id}` as Href)}>
            <Card style={styles.row}><Avatar name={item.name} avatarUrl={item.avatarUrl} /><Text style={styles.name}>{item.name}</Text><Text style={styles.major}>{item.major || 'Sinh viên'}</Text></Card>
          </Pressable>
        )} />
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({ list: { paddingTop: 14, gap: 10 }, row: { flexDirection: 'row', alignItems: 'center', gap: 10 }, name: { flex: 1, fontWeight: '800', color: palette.text }, major: { color: palette.textMuted, fontSize: 12 }, error: { color: palette.danger, padding: 16 } });
