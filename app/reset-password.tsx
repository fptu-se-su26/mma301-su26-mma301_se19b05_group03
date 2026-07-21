import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ScreenShell } from '@/components/ui/screen-shell';
import { TextField } from '@/components/ui/text-field';
import { palette } from '@/constants/palette';
import { authApi, type ApiError } from '@/services/api';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (resetToken.trim().length !== 64 || newPassword.length < 8) {
      return setError('Mã đặt lại phải có 64 ký tự và mật khẩu mới ít nhất 8 ký tự.');
    }
    setLoading(true);
    setError(null);
    try {
      await authApi.resetPassword({ resetToken: resetToken.trim(), newPassword });
      router.replace('/login');
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenShell title="Đặt lại mật khẩu" onBack={() => router.back()}>
      <View style={styles.body}>
        <TextField label="Mã đặt lại" autoCapitalize="none" value={resetToken} onChangeText={setResetToken} />
        <TextField label="Mật khẩu mới" secureTextEntry value={newPassword} onChangeText={setNewPassword} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button label="Đặt lại mật khẩu" loading={loading} onPress={submit} />
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({ body: { padding: 20, gap: 14 }, error: { color: palette.danger } });
