import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '@/src/theme';
import { Station } from '@/src/types/domain';

export function StationCard({
  station,
  onPress,
}: {
  station: Station;
  onPress: () => void;
}) {
  const available = station.slots.filter(
    (slot) => slot.availability !== 'unavailable',
  ).length;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${station.name}, ${station.distanceKm} kilometers away, ${available} available times`}
      accessibilityHint="Opens station details and time slots"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.icon}>
        <Ionicons name="location" color={colors.primary} size={24} />
      </View>
      <View style={styles.body}>
        <View style={styles.row}>
          <Text style={styles.name}>{station.name}</Text>
          <Text style={styles.distance}>{station.distanceKm.toFixed(1)} km</Text>
        </View>
        <Text style={styles.address}>
          {station.address} · {station.area}
        </Text>
        <Text style={styles.availability}>
          {available} upcoming {available === 1 ? 'time' : 'times'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 116,
  },
  pressed: { opacity: 0.78 },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 5 },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  name: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: '60%',
    color: colors.text,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
  },
  distance: {
    flexShrink: 0,
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  address: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  availability: { color: colors.primary, fontSize: 14, fontWeight: '600' },
});
