import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StationListScenario } from '@/src/api/mockApi';
import { colors, radii, spacing } from '@/src/theme';

const options: { label: string; value: StationListScenario }[] = [
  { label: 'Normal', value: 'success' },
  { label: 'Empty', value: 'empty' },
  { label: 'Error', value: 'error' },
];

interface StationScenarioControlProps {
  value: StationListScenario;
  onChange: (scenario: StationListScenario) => void;
}

export function StationScenarioControl({ value, onChange }: StationScenarioControlProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Development preview</Text>
      <View accessibilityRole="radiogroup" style={styles.options}>
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityLabel={`${option.label} station response`}
              accessibilityState={{ checked: selected }}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [
                styles.option,
                selected && styles.optionSelected,
                pressed && styles.optionPressed,
              ]}
            >
              <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.warningSoft,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  label: { color: colors.warning, fontSize: 12, fontWeight: '800' },
  options: { flexDirection: 'row', gap: spacing.sm },
  option: {
    minHeight: 48,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
  },
  optionSelected: { borderColor: colors.warning, backgroundColor: colors.warningSoft },
  optionPressed: { opacity: 0.75 },
  optionText: { color: colors.text, fontSize: 14, fontWeight: '700' },
  optionTextSelected: { color: colors.warning },
});
