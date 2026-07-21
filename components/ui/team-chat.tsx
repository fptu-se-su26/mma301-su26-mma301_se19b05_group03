import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { palette } from '@/constants/palette';
import { teamApi } from '@/services/api';
import type { ApiError } from '@/services/api';
import { formatRelative } from '@/utils/format';
import { Avatar } from './avatar';
import { Button } from './button';
import { TextField } from './text-field';

type ChatMessage = {
  _id: string;
  content: string;
  createdAt: string;
  sender?: { _id: string; name: string; avatarUrl?: string };
};

type TeamChatProps = { teamId: string; myId?: string };

const POLL_INTERVAL_MS = 5000;

export function TeamChat({ teamId, myId }: TeamChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const load = useCallback(async () => {
    try {
      const res = await teamApi.messages(teamId);
      setMessages(res.data);
    } catch {
      setMessages([]);
    }
  }, [teamId]);

  useEffect(() => {
    load();
    const timer = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: false });
  }, [messages.length]);

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await teamApi.sendMessage(teamId, text.trim());
      setText('');
      await load();
    } catch (err) {
      Alert.alert('Lỗi', (err as ApiError)?.message || 'Không thể gửi tin nhắn.');
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Trò chuyện nhóm</Text>

      <ScrollView ref={scrollRef} style={styles.messages} contentContainerStyle={styles.messagesBody}>
        {messages.length === 0 ? (
          <Text style={styles.empty}>Chưa có tin nhắn. Hãy bắt đầu trò chuyện!</Text>
        ) : (
          messages.map((message) => {
            const isMine = message.sender?._id === myId;
            return (
              <View key={message._id} style={[styles.row, isMine && styles.rowMine]}>
                {!isMine ? <Avatar name={message.sender?.name} size={28} /> : null}
                <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
                  {!isMine ? <Text style={styles.sender}>{message.sender?.name}</Text> : null}
                  <Text style={[styles.content, isMine && styles.contentMine]}>{message.content}</Text>
                  <Text style={[styles.time, isMine && styles.timeMine]}>
                    {formatRelative(message.createdAt)}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextField
          containerStyle={styles.flex}
          placeholder="Nhắn tin cho nhóm..."
          value={text}
          onChangeText={setText}
          multiline
        />
        <Button label="Gửi" size="sm" loading={sending} onPress={send} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  flex: { flex: 1 },
  title: { fontSize: 15, fontWeight: '800', color: palette.text },
  messages: { maxHeight: 280 },
  messagesBody: { gap: 10, paddingVertical: 4 },
  empty: { fontSize: 13, color: palette.textFaint, textAlign: 'center', paddingVertical: 16 },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  rowMine: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '78%', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 },
  bubbleOther: { backgroundColor: palette.neutralSoft },
  bubbleMine: { backgroundColor: palette.brand },
  sender: { fontSize: 11, fontWeight: '700', color: palette.textMuted, marginBottom: 2 },
  content: { fontSize: 14, color: palette.text, lineHeight: 20 },
  contentMine: { color: '#fff' },
  time: { fontSize: 10, color: palette.textFaint, marginTop: 2 },
  timeMine: { color: 'rgba(255,255,255,0.7)' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
});
