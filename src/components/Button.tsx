import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { colors, radii, spacing } from '@/src/theme';

interface ButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  selected?: boolean;
  variant?: 'primary' | 'secondary' | 'neutral' | 'danger';
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
        variant === 'primary'
          ? styles.primary
          : variant === 'secondary'
            ? styles.secondary
            : variant === 'neutral'
              ? styles.neutral
              : styles.danger,
        pressed && !unavailable && styles.pressed,
        unavailable && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === 'primary'
              ? colors.surface
              : variant === 'danger'
                ? colors.danger
                : colors.text
          }
        />
      ) : (
        <Text
          style={
            variant === 'primary'
              ? styles.primaryText
              : variant === 'secondary'
                ? styles.secondaryText
                : variant === 'neutral'
                  ? styles.neutralText
                  : styles.dangerText
          }
        >
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
  neutral: { backgroundColor: colors.surface, borderColor: colors.border },
  danger: { backgroundColor: colors.dangerSoft, borderColor: colors.danger },
  primaryText: { color: colors.surface, fontSize: 16, lineHeight: 20, fontWeight: '700' },
  secondaryText: {
    color: colors.primary,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
  },
  neutralText: { color: colors.text, fontSize: 16, lineHeight: 20, fontWeight: '700' },
  dangerText: { color: colors.danger, fontSize: 16, lineHeight: 20, fontWeight: '700' },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.5 },
});
