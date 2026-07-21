import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette } from '@/constants/palette';
import { DetailHeader } from './detail-header';

type ScreenShellProps = {
  title: string;
  onBack: () => void;
  right?: React.ReactNode;
  children: React.ReactNode;
};

export function ScreenShell({ title, onBack, right, children }: ScreenShellProps) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <DetailHeader title={title} onBack={onBack} right={right} />
      <View style={styles.body}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.background },
  body: { flex: 1 },
});
