import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { palette } from '@/constants/palette';
import { useAsync } from '@/hooks/use-async';
import { postApi } from '@/services/api';
import type { ApiError } from '@/services/api';
import { formatRelative } from '@/utils/format';
import { Avatar } from './avatar';
import { Button } from './button';
import { TextField } from './text-field';

type Comment = {
  _id: string;
  content: string;
  createdAt: string;
  author?: { _id: string; name: string; role: string; avatarUrl?: string };
};

type CommentSectionProps = { postId: string; myId?: string; isAdmin?: boolean };

export function CommentSection({ postId, myId, isAdmin }: CommentSectionProps) {
  const { data, loading, reload } = useAsync<{ data: Comment[] }>(() => postApi.comments(postId), [postId]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const comments = data?.data ?? [];

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await postApi.addComment(postId, text.trim());
      setText('');
      await reload();
    } catch (err) {
      Alert.alert('Lỗi', (err as ApiError)?.message || 'Không thể gửi bình luận.');
    } finally {
      setSending(false);
    }
  };

  const remove = (comment: Comment) => {
    Alert.alert('Xóa bình luận', 'Xóa bình luận này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await postApi.removeComment(postId, comment._id);
            await reload();
          } catch (err) {
            Alert.alert('Lỗi', (err as ApiError)?.message || 'Không thể xóa.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Bình luận {comments.length > 0 ? `(${comments.length})` : ''}</Text>

      <View style={styles.inputRow}>
        <TextField
          containerStyle={styles.flex}
          placeholder="Viết bình luận..."
          value={text}
          onChangeText={setText}
          multiline
        />
        <Button label="Gửi" size="sm" loading={sending} onPress={send} />
      </View>

      {loading && comments.length === 0 ? (
        <Text style={styles.empty}>Đang tải bình luận...</Text>
      ) : comments.length === 0 ? (
        <Text style={styles.empty}>Chưa có bình luận nào.</Text>
      ) : (
        comments.map((comment) => {
          const canDelete = isAdmin || comment.author?._id === myId;
          return (
            <View key={comment._id} style={styles.comment}>
              <Avatar name={comment.author?.name} size={32} />
              <View style={styles.flex}>
                <View style={styles.commentHead}>
                  <Text style={styles.commentAuthor}>{comment.author?.name || 'Ẩn danh'}</Text>
                  <Text style={styles.commentTime}>{formatRelative(comment.createdAt)}</Text>
                </View>
                <Text style={styles.commentBody}>{comment.content}</Text>
              </View>
              {canDelete ? (
                <Pressable hitSlop={8} onPress={() => remove(comment)}>
                  <Ionicons name="trash-outline" size={18} color={palette.textFaint} />
                </Pressable>
              ) : null}
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  flex: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700', color: palette.textMuted },
  inputRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  empty: { fontSize: 13, color: palette.textFaint },
  comment: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  commentHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  commentAuthor: { fontSize: 14, fontWeight: '700', color: palette.text },
  commentTime: { fontSize: 11, color: palette.textFaint },
  commentBody: { fontSize: 14, color: palette.text, lineHeight: 20, marginTop: 2 },
});
