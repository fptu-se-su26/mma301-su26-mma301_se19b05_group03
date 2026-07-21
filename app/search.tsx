import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScreenShell } from '@/components/ui/screen-shell';
import { EmptyState, LoadingState } from '@/components/ui/states';
import { POST_TYPE_LABELS, TEAM_STATUS_LABELS } from '@/constants/labels';
import { palette } from '@/constants/palette';
import { searchApi } from '@/services/api';
import type { ApiError } from '@/services/api';
import { TextField } from '@/components/ui/text-field';

type SearchResults = {
  courses: { _id: string; code: string; title: string; semester?: string }[];
  materials: { _id: string; title: string; course?: { code: string } }[];
  posts: { _id: string; title: string; type: string }[];
  teams: { _id: string; name: string; status: string; memberCount: number; maxMembers: number }[];
  quizzes: { _id: string; title: string; course?: { code: string } }[];
};

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async () => {
    const q = query.trim();
    if (q.length < 2) {
      setError('Từ khóa cần ít nhất 2 ký tự.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await searchApi.global(q);
      setResults(res.data);
    } catch (err) {
      setError((err as ApiError)?.message || 'Không thể tìm kiếm.');
    } finally {
      setLoading(false);
    }
  };

  const totalCount = results
    ? results.courses.length +
      results.materials.length +
      results.posts.length +
      results.teams.length +
      results.quizzes.length
    : 0;

  return (
    <ScreenShell title="Tìm kiếm" onBack={() => router.back()}>
      <View style={styles.searchRow}>
        <TextField
          containerStyle={styles.flex}
          placeholder="Nhập từ khóa..."
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          onSubmitEditing={search}
          autoFocus
        />
        <Button label="Tìm" onPress={search} />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <LoadingState />
      ) : !results ? null : totalCount === 0 ? (
        <EmptyState title="Không tìm thấy" description={`Không có kết quả cho "${query}".`} />
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          {results.courses.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Học phần</Text>
              {results.courses.map((course) => (
                <Card key={course._id} style={styles.card}>
                  <Ionicons name="book-outline" size={20} color={palette.brand} />
                  <View style={styles.flex}>
                    <Text style={styles.title}>
                      {course.code} — {course.title}
                    </Text>
                    {course.semester ? <Text style={styles.meta}>Học kỳ: {course.semester}</Text> : null}
                  </View>
                </Card>
              ))}
            </View>
          ) : null}

          {results.materials.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tài liệu</Text>
              {results.materials.map((material) => (
                <Card key={material._id} style={styles.card}>
                  <Ionicons name="document-text-outline" size={20} color={palette.brand} />
                  <View style={styles.flex}>
                    <Text style={styles.title}>{material.title}</Text>
                    {material.course?.code ? <Text style={styles.meta}>{material.course.code}</Text> : null}
                  </View>
                </Card>
              ))}
            </View>
          ) : null}

          {results.posts.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Bài đăng</Text>
              {results.posts.map((post) => (
                <Card key={post._id} style={styles.card}>
                  <Ionicons name="newspaper-outline" size={20} color={palette.brand} />
                  <Text style={[styles.title, styles.flex]}>{post.title}</Text>
                  <Badge label={POST_TYPE_LABELS[post.type] || post.type} tone="neutral" />
                </Card>
              ))}
            </View>
          ) : null}

          {results.teams.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Nhóm</Text>
              {results.teams.map((team) => (
                <Pressable key={team._id} onPress={() => router.push(`/team/${team._id}`)}>
                  <Card style={styles.card}>
                    <Ionicons name="people-outline" size={20} color={palette.brand} />
                    <View style={styles.flex}>
                      <Text style={styles.title}>{team.name}</Text>
                      <Text style={styles.meta}>
                        {team.memberCount}/{team.maxMembers} thành viên
                      </Text>
                    </View>
                    <Badge label={TEAM_STATUS_LABELS[team.status] || team.status} tone="neutral" />
                  </Card>
                </Pressable>
              ))}
            </View>
          ) : null}

          {results.quizzes.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Trắc nghiệm</Text>
              {results.quizzes.map((quiz) => (
                <Pressable key={quiz._id} onPress={() => router.push(`/quizzes/${quiz._id}`)}>
                  <Card style={styles.card}>
                    <Ionicons name="help-circle-outline" size={20} color={palette.brand} />
                    <View style={styles.flex}>
                      <Text style={styles.title}>{quiz.title}</Text>
                      {quiz.course?.code ? <Text style={styles.meta}>{quiz.course.code}</Text> : null}
                    </View>
                  </Card>
                </Pressable>
              ))}
            </View>
          ) : null}
        </ScrollView>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16, paddingBottom: 8 },
  body: { padding: 16, paddingTop: 4, gap: 16 },
  section: { gap: 8 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: palette.textFaint,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: 14, fontWeight: '700', color: palette.text },
  meta: { fontSize: 12, color: palette.textFaint, marginTop: 2 },
  error: { color: palette.danger, fontSize: 13, paddingHorizontal: 16 },
});
