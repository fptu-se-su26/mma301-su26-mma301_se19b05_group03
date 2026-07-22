import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChipSelect } from '@/components/ui/chip-select';
import { CommentSection } from '@/components/ui/comment-section';
import { DetailHeader } from '@/components/ui/detail-header';
import { ReactionBar } from '@/components/ui/reaction-bar';
import { ScreenHeader } from '@/components/ui/screen-header';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { TextField } from '@/components/ui/text-field';
import { POST_TYPE_LABELS } from '@/constants/labels';
import { palette } from '@/constants/palette';
import { useAuth } from '@/context/auth';
import { useAsync } from '@/hooks/use-async';
import { postApi } from '@/services/api';
import type { ApiError } from '@/services/api';
import { formatDateTime, formatRelative } from '@/utils/format';

type Post = {
  _id: string;
  type: string;
  title: string;
  content: string;
  eventDate?: string | null;
  tagsNeeded?: string[];
  reactionCount?: number;
  myReaction?: string | null;
  commentCount?: number;
  status?: string;
  createdAt: string;
  author?: { _id: string; name: string; role: string };
};

type ReactionOverride = { count: number; current: string | null };
type Mode = { view: 'list' } | { view: 'detail'; item: Post } | { view: 'editor'; item: Post | null };

const TYPE_OPTIONS = [
  { value: 'academic_update', label: 'Thông tin học vụ' },
  { value: 'event', label: 'Sự kiện' },
];

const emptyForm = { type: 'academic_update', title: '', content: '', eventDate: '', tags: '' };

export default function FeedScreen() {
  const { user } = useAuth();
  const myId = user?.id || user?._id;
  const canCreate = ['lecturer', 'admin', 'club_leader'].includes(user?.role || '');
  const isAdmin = user?.role === 'admin';

  const { data, loading, error, reload } = useAsync<{ data: Post[] }>(
    () => postApi.list({ limit: 30 }),
    []
  );
  const [refreshing, setRefreshing] = useState(false);
  const [mode, setMode] = useState<Mode>({ view: 'list' });
  const [reactingId, setReactingId] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, ReactionOverride>>({});
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const items = data?.data ?? [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await reload();
    setOverrides({});
    setRefreshing(false);
  }, [reload]);

  const reactionCount = (post: Post) => overrides[post._id]?.count ?? post.reactionCount ?? 0;
  const currentReaction = (post: Post) => overrides[post._id]?.current ?? post.myReaction ?? null;
  const canEdit = (post: Post) => isAdmin || post.author?._id === myId;

  const react = async (post: Post, type: string) => {
    setReactingId(post._id);
    try {
      const res = await postApi.react(post._id, { type });
      setOverrides((prev) => ({
        ...prev,
        [post._id]: { count: res.data.reactionCount, current: res.data.myReaction },
      }));
    } catch {
      setReactingId(null);
    } finally {
      setReactingId(null);
    }
  };

  const openCreate = () => {
    setForm(emptyForm);
    setFormError(null);
    setMode({ view: 'editor', item: null });
  };

  const openEdit = (post: Post) => {
    setForm({
      type: post.type,
      title: post.title,
      content: post.content,
      eventDate: post.eventDate ? post.eventDate.slice(0, 10) : '',
      tags: (post.tagsNeeded || []).join(', '),
    });
    setFormError(null);
    setMode({ view: 'editor', item: post });
  };

  const submit = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      setFormError('Vui lòng nhập tiêu đề và nội dung.');
      return;
    }
    const editing = mode.view === 'editor' ? mode.item : null;
    const tagsNeeded = form.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const eventDate = form.type === 'event' && form.eventDate ? form.eventDate : null;
    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        await postApi.update(editing._id, {
          title: form.title.trim(),
          content: form.content.trim(),
          eventDate,
          tagsNeeded,
        });
      } else {
        await postApi.create({
          type: form.type,
          title: form.title.trim(),
          content: form.content.trim(),
          eventDate,
          tagsNeeded,
        });
      }
      await reload();
      setMode({ view: 'list' });
    } catch (err) {
      setFormError((err as ApiError)?.message || 'Không thể lưu bài đăng.');
    } finally {
      setSaving(false);
    }
  };

  const remove = (post: Post) => {
    Alert.alert('Xóa bài đăng', `Xóa "${post.title}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await postApi.remove(post._id);
            await reload();
            setMode({ view: 'list' });
          } catch (err) {
            Alert.alert('Lỗi', (err as ApiError)?.message || 'Không thể xóa.');
          }
        },
      },
    ]);
  };

  const toggleStatus = async (post: Post) => {
    const nextStatus = post.status === 'hidden' ? 'published' : 'hidden';
    try {
      await postApi.update(post._id, { status: nextStatus });
      await reload();
      setMode({ view: 'detail', item: { ...post, status: nextStatus } });
    } catch (err) {
      Alert.alert('Lỗi', (err as ApiError)?.message || 'Không thể cập nhật.');
    }
  };

  if (mode.view === 'editor') {
    const editing = mode.item;
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <DetailHeader title={editing ? 'Sửa bài đăng' : 'Đăng bài mới'} onBack={() => setMode({ view: 'list' })} />
        <ScrollView contentContainerStyle={styles.detailBody} keyboardShouldPersistTaps="handled">
          {!editing ? (
            <ChipSelect
              label="Loại bài"
              options={TYPE_OPTIONS}
              value={form.type}
              onChange={(type) => setForm({ ...form, type })}
            />
          ) : null}
          <TextField label="Tiêu đề" value={form.title} onChangeText={(title) => setForm({ ...form, title })} />
          <TextField
            label="Nội dung"
            value={form.content}
            onChangeText={(content) => setForm({ ...form, content })}
            multiline
          />
          {form.type === 'event' ? (
            <TextField
              label="Ngày sự kiện (YYYY-MM-DD)"
              placeholder="2026-07-20"
              value={form.eventDate}
              onChangeText={(eventDate) => setForm({ ...form, eventDate })}
            />
          ) : null}
          <TextField
            label="Kỹ năng/tag cần tìm (phân tách bằng dấu phẩy)"
            placeholder="React, Figma"
            value={form.tags}
            onChangeText={(tags) => setForm({ ...form, tags })}
          />
          {formError ? <Text style={styles.error}>{formError}</Text> : null}
          <Button label={editing ? 'Lưu thay đổi' : 'Đăng bài'} loading={saving} onPress={submit} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (mode.view === 'detail') {
    const item = mode.item;
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <DetailHeader title="Chi tiết bài viết" onBack={() => setMode({ view: 'list' })} />
        <ScrollView contentContainerStyle={styles.detailBody}>
          <Card style={styles.detailCard}>
            <View style={styles.cardHeader}>
              <Avatar name={item.author?.name} size={44} />
              <View style={styles.flex}>
                <Text style={styles.author}>{item.author?.name || 'Ẩn danh'}</Text>
                <Text style={styles.meta}>{formatDateTime(item.createdAt)}</Text>
              </View>
              <Badge
                label={POST_TYPE_LABELS[item.type] || item.type}
                tone={item.type === 'event' ? 'warning' : 'brand'}
              />
            </View>
            {item.status === 'hidden' ? <Badge label="Đang ẩn" tone="danger" /> : null}
            <Text style={styles.detailTitle}>{item.title}</Text>
            {item.eventDate ? (
              <View style={styles.eventRow}>
                <Text style={styles.eventLabel}>Thời gian sự kiện</Text>
                <Text style={styles.eventValue}>{formatDateTime(item.eventDate)}</Text>
              </View>
            ) : null}
            <Text style={styles.detailContent}>{item.content}</Text>
            {item.tagsNeeded && item.tagsNeeded.length > 0 ? (
              <View style={styles.tags}>
                {item.tagsNeeded.map((tag, index) => (
                  <Badge key={`post-tag-${item._id}-${tag}-${index}`} label={tag} tone="neutral" />
                ))}
              </View>
            ) : null}
          </Card>

          <Card style={styles.detailCard}>
            <Text style={styles.sectionTitle}>Cảm xúc</Text>
            <ReactionBar
              current={currentReaction(item)}
              count={reactionCount(item)}
              disabled={reactingId === item._id}
              onReact={(type) => react(item, type)}
            />
          </Card>

          <Card style={styles.detailCard}>
            <CommentSection postId={item._id} myId={myId} isAdmin={isAdmin} />
          </Card>

          {canEdit(item) ? (
            <View style={styles.actionRow}>
              <Button label="Sửa" variant="secondary" style={styles.flex} onPress={() => openEdit(item)} />
              <Button label="Xóa" variant="danger" style={styles.flex} onPress={() => remove(item)} />
            </View>
          ) : null}
          {isAdmin ? (
            <Button
              label={item.status === 'hidden' ? 'Hiện lại bài đăng' : 'Ẩn bài đăng'}
              variant="secondary"
              onPress={() => toggleStatus(item)}
            />
          ) : null}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title="Bảng tin"
        subtitle="Cập nhật học vụ và sự kiện mới nhất"
        right={
          canCreate ? (
            <Pressable style={styles.addBtn} onPress={openCreate}>
              <Ionicons name="add" size={22} color="#fff" />
            </Pressable>
          ) : undefined
        }
      />
      {loading && !refreshing ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <View style={styles.cardHeader}>
                <Avatar name={item.author?.name} size={36} />
                <View style={styles.flex}>
                  <Text style={styles.author}>{item.author?.name || 'Ẩn danh'}</Text>
                  <Text style={styles.meta}>{formatRelative(item.createdAt)}</Text>
                </View>
                <Badge
                  label={POST_TYPE_LABELS[item.type] || item.type}
                  tone={item.type === 'event' ? 'warning' : 'brand'}
                />
              </View>
              <Pressable onPress={() => setMode({ view: 'detail', item })}>
                {item.status === 'hidden' ? <Badge label="Đang ẩn" tone="danger" /> : null}
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.content} numberOfLines={3}>
                  {item.content}
                </Text>
                <View style={styles.metaFooter}>
                  <Text style={styles.link}>Xem chi tiết</Text>
                  {item.commentCount ? (
                    <View style={styles.commentPill}>
                      <Ionicons name="chatbubble-outline" size={13} color={palette.textFaint} />
                      <Text style={styles.commentPillText}>{item.commentCount}</Text>
                    </View>
                  ) : null}
                </View>
              </Pressable>
              <View style={styles.actions}>
                <ReactionBar
                  current={currentReaction(item)}
                  count={reactionCount(item)}
                  disabled={reactingId === item._id}
                  onReact={(type) => react(item, type)}
                />
              </View>
            </Card>
          )}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<EmptyState title="Chưa có bài viết" description="Hãy quay lại sau nhé." />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.background },
  flex: { flex: 1 },
  list: { padding: 16, gap: 12 },
  card: { gap: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  author: { fontSize: 15, fontWeight: '700', color: palette.text },
  meta: { fontSize: 12, color: palette.textFaint },
  title: { fontSize: 16, fontWeight: '700', color: palette.text, marginTop: 2 },
  content: { fontSize: 14, color: palette.textMuted, marginTop: 4, lineHeight: 20 },
  link: { fontSize: 13, fontWeight: '600', color: palette.brand, marginTop: 6 },
  metaFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  commentPill: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  commentPillText: { fontSize: 12, color: palette.textFaint, fontWeight: '600' },
  actions: { borderTopWidth: 1, borderTopColor: palette.border, paddingTop: 10 },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: palette.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailBody: { padding: 16, gap: 14 },
  detailCard: { gap: 12 },
  detailTitle: { fontSize: 22, fontWeight: '800', color: palette.text, lineHeight: 30 },
  detailContent: { fontSize: 15, color: palette.text, lineHeight: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: palette.textMuted },
  eventRow: { backgroundColor: palette.warningSoft, borderRadius: 12, padding: 12, gap: 2 },
  eventLabel: { fontSize: 12, color: palette.warning, fontWeight: '600' },
  eventValue: { fontSize: 14, color: palette.text, fontWeight: '600' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionRow: { flexDirection: 'row', gap: 12 },
  error: { color: palette.danger, fontSize: 13 },
});
