import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ScreenShell } from '@/components/ui/screen-shell';
import { TextField } from '@/components/ui/text-field';
import { palette } from '@/constants/palette';
import { authApi, type ApiError } from '@/services/api';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!currentPassword || newPassword.length < 8 || currentPassword === newPassword) {
      return setError('Mật khẩu mới phải khác mật khẩu hiện tại và có ít nhất 8 ký tự.');
    }
    setLoading(true);
    setError(null);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      router.back();
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenShell title="Đổi mật khẩu" onBack={() => router.back()}>
      <View style={styles.body}>
        <TextField label="Mật khẩu hiện tại" secureTextEntry value={currentPassword} onChangeText={setCurrentPassword} />
        <TextField label="Mật khẩu mới" secureTextEntry value={newPassword} onChangeText={setNewPassword} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button label="Đổi mật khẩu" loading={loading} onPress={submit} />
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({ body: { padding: 20, gap: 14 }, error: { color: palette.danger } });
