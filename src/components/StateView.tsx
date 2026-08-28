import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/src/components/Button';
import { colors, spacing } from '@/src/theme';

interface StateViewProps {
  title: string;
  message?: string;
  loading?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  actionLoading?: boolean;
  actionVariant?: 'primary' | 'secondary' | 'neutral' | 'danger';
}

export function StateView({
  title,
  message,
  loading,
  actionLabel,
  onAction,
  actionLoading = false,
  actionVariant = 'primary',
}: StateViewProps) {
  return (
    <View style={styles.container} accessibilityLiveRegion="polite">
      {loading && (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      )}
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
      {actionLabel && onAction && (
        <Button
          label={actionLabel}
          variant={actionVariant}
          loading={actionLoading}
          onPress={onAction}
          style={styles.button}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 280,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  loader: { marginBottom: spacing.md },
  title: { color: colors.text, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  message: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 23,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  button: { marginTop: spacing.lg, alignSelf: 'stretch' },
});
