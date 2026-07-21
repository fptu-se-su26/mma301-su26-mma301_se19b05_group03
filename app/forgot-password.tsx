import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ScreenShell } from '@/components/ui/screen-shell';
import { TextField } from '@/components/ui/text-field';
import { palette } from '@/constants/palette';
import { authApi, type ApiError } from '@/services/api';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.trim()) return setError('Vui lòng nhập email.');
    setLoading(true);
    setError(null);
    try {
      const response = await authApi.forgotPassword(email.trim());
      setMessage((response as unknown as { message?: string }).message || 'Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi.');
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenShell title="Quên mật khẩu" onBack={() => router.back()}>
      <View style={styles.body}>
        <Text style={styles.description}>Nhập email tài khoản để nhận hướng dẫn đặt lại mật khẩu.</Text>
        <TextField label="Email" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
        {message ? <Text style={styles.success}>{message}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button label="Gửi hướng dẫn" loading={loading} onPress={submit} />
        <Button label="Tôi đã có mã đặt lại" variant="secondary" onPress={() => router.push('/reset-password' as Href)} />
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  body: { padding: 20, gap: 14 },
  description: { color: palette.textMuted, lineHeight: 21 },
  success: { color: palette.success },
  error: { color: palette.danger },
});
