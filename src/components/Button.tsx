import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { colors, radii, spacing } from '@/src/theme';

interface ButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  selected?: boolean;
  variant?: 'primary' | 'secondary';
  style?: ViewStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string | undefined;
  testID?: string;
}

export function Button({
  label,
  onPress,
  disabled = false,
  loading = false,
  selected = false,
  variant = 'primary',
  style,
  accessibilityLabel,
  accessibilityHint,
  testID,
}: ButtonProps) {
  const unavailable = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: unavailable, busy: loading, selected }}
      disabled={unavailable}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' ? styles.primary : styles.secondary,
        pressed && !unavailable && styles.pressed,
        unavailable && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.surface : colors.primary}
        />
      ) : (
        <Text style={variant === 'primary' ? styles.primaryText : styles.secondaryText}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    paddingVertical: 13,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  primary: { backgroundColor: colors.primary, borderColor: colors.primary },
  secondary: { backgroundColor: colors.surface, borderColor: colors.primary },
  primaryText: { color: colors.surface, fontSize: 16, lineHeight: 20, fontWeight: '700' },
  secondaryText: {
    color: colors.primary,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
  },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.5 },
});
