import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

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
      <View style={styles.searchBox}>
        <Text style={styles.heading}>Tra cứu sinh viên</Text>
        <Text style={styles.helper}>Tìm theo tên, mã sinh viên hoặc chuyên ngành</Text>
        <TextField containerStyle={styles.input} placeholder="Ví dụ: Nguyễn Văn A, SE12345..." value={query} onChangeText={search} autoFocus returnKeyType="search" />
        <Text style={styles.hint}>Nhập ít nhất 2 ký tự để bắt đầu tìm kiếm</Text>
      </View>
      {loading ? <LoadingState /> : error ? <Text style={styles.error}>{error}</Text> : items.length === 0 && query.length >= 2 ? <EmptyState title="Không tìm thấy sinh viên" description="Thử tên, mã sinh viên hoặc từ khóa khác." /> : query.length < 2 ? <EmptyState title="Tìm bạn học" description="Kết quả tìm kiếm sẽ hiển thị tại đây." /> : (
        <FlatList data={items} keyExtractor={(item) => item._id} contentContainerStyle={styles.list} renderItem={({ item }) => (
          <Pressable accessibilityRole="button" accessibilityLabel={`Xem hồ sơ ${item.name}`} onPress={() => router.push(`/student/${item._id}` as Href)}>
            <Card style={styles.row}><Avatar name={item.name} avatarUrl={item.avatarUrl} size={48} /><View style={styles.details}><Text style={styles.name}>{item.name}</Text><Text style={styles.major}>{item.major || 'Sinh viên'}</Text>{item.skills?.length ? <Text style={styles.skills} numberOfLines={1}>{item.skills.join(' · ')}</Text> : null}</View><Text style={styles.arrow}>›</Text></Card>
          </Pressable>
        )} />
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  searchBox: { margin: 16, padding: 16, borderRadius: 16, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, gap: 6 },
  heading: { color: palette.text, fontSize: 18, fontWeight: '800' }, helper: { color: palette.textMuted, fontSize: 13 }, input: { marginTop: 6 }, hint: { color: palette.textFaint, fontSize: 12 },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 }, row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 }, details: { flex: 1, gap: 3 }, name: { color: palette.text, fontSize: 15, fontWeight: '800' }, major: { color: palette.textMuted, fontSize: 13 }, skills: { color: palette.textFaint, fontSize: 12 }, arrow: { color: palette.textFaint, fontSize: 28, lineHeight: 28 }, error: { color: palette.danger, padding: 16 },
});
