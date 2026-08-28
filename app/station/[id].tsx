import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/src/components/Button';
import { Screen } from '@/src/components/Screen';
import { StateView } from '@/src/components/StateView';
import { useStation } from '@/src/features/stations/queries';
import { colors, radii, spacing } from '@/src/theme';
import { TimeSlot } from '@/src/types/domain';
import { formatSlotDate, formatSlotTime } from '@/src/utils/format';

function SlotRow({
  slot,
  selected,
  onSelect,
}: {
  slot: TimeSlot;
  selected: boolean;
  onSelect: (slotId: string) => void;
}) {
  const unavailable = slot.availability === 'unavailable';
  const lowAvailability =
    !unavailable && (slot.availability === 'limited' || slot.placesLeft < 4);
  const date = formatSlotDate(slot.startsAt);
  const time = formatSlotTime(slot.startsAt, slot.endsAt);
  const availability = unavailable
    ? 'fully booked'
    : slot.availability === 'limited' || lowAvailability
      ? `${slot.placesLeft} ${slot.placesLeft === 1 ? 'place' : 'places'} left`
      : `${slot.placesLeft} ${slot.placesLeft === 1 ? 'place' : 'places'} available`;
  const actionLabel = unavailable ? 'Full' : selected ? 'Selected' : 'Select';
  const accessibilityLabel = `${actionLabel}, ${date}, ${time}, ${availability}`;
  return (
    <View
      style={[
        styles.slot,
        unavailable && styles.unavailable,
        selected && styles.selectedSlot,
      ]}
    >
      <View style={styles.dateBox}>
        <Ionicons name="calendar-outline" size={20} color={colors.primary} />
      </View>
      <View style={styles.slotCopy}>
        <Text style={styles.slotDate}>{date}</Text>
        <Text style={styles.slotTime}>{time}</Text>
        <Text
          style={[
            styles.places,
            lowAvailability && styles.limited,
            unavailable && styles.fullPlaces,
          ]}
        >
          {unavailable ? 'Fully booked' : availability}
        </Text>
      </View>
      <Button
        label={actionLabel}
        disabled={unavailable}
        selected={selected}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={
          unavailable
            ? 'This time cannot be selected'
            : selected
              ? 'Selected time; use Continue to enter your details'
              : 'Selects this time'
        }
        onPress={() => onSelect(slot.id)}
        style={styles.selectButton}
        testID={`slot-${slot.id}`}
      />
    </View>
  );
}

export default function StationDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const stationQuery = useStation(params.id);
  const { refetch } = stationQuery;
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const hasFocused = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (hasFocused.current) void refetch();
      hasFocused.current = true;
    }, [refetch]),
  );

  useEffect(() => {
    if (
      selectedSlotId &&
      stationQuery.data?.slots.some(
        (slot) => slot.id === selectedSlotId && slot.availability !== 'unavailable',
      ) !== true
    ) {
      setSelectedSlotId(null);
    }
  }, [selectedSlotId, stationQuery.data]);

  if (stationQuery.isPending)
    return (
      <Screen>
        <StateView title="Loading station…" loading />
      </Screen>
    );
  if (stationQuery.isError) {
    return (
      <Screen>
        <StateView
          title="Station unavailable"
          message={stationQuery.error.message}
          actionLabel="Try again"
          onAction={() => stationQuery.refetch()}
        />
      </Screen>
    );
  }

  const station = stationQuery.data;
  return (
    <Screen>
      <Button
        label="Back"
        variant="secondary"
        accessibilityHint="Returns to the previous screen"
        onPress={() => router.back()}
        testID="back-to-stations"
        style={styles.backButton}
      />
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          {station.name}
        </Text>
        <View style={styles.meta}>
          <Ionicons name="navigate-outline" size={17} color={colors.primary} />
          <Text style={styles.distance}>{station.distanceKm.toFixed(1)} km away</Text>
        </View>
        <Text style={styles.address}>
          {station.address}, {station.area}
        </Text>
        <Text style={styles.description}>{station.description}</Text>
      </View>

      <Text style={styles.heading}>What’s available</Text>
      <View style={styles.amenities}>
        {station.amenities.map((amenity) => (
          <View key={amenity} style={styles.pill}>
            <Ionicons name="checkmark" size={15} color={colors.primary} />
            <Text style={styles.pillText}>{amenity}</Text>
          </View>
        ))}
      </View>

      <Text accessibilityRole="header" style={[styles.heading, styles.timesHeading]}>
        Choose a time
      </Text>
      {station.slots.length === 0 ? (
        <StateView
          title="No times available"
          message="Check back soon for newly released sessions."
        />
      ) : (
        <View style={styles.slots}>
          {station.slots.map((slot) => (
            <SlotRow
              key={slot.id}
              slot={slot}
              selected={slot.id === selectedSlotId}
              onSelect={setSelectedSlotId}
            />
          ))}
          <Button
            label="Continue"
            disabled={selectedSlotId === null}
            accessibilityHint="Opens the reservation form for the selected time"
            onPress={() => {
              if (selectedSlotId === null) return;
              router.push({
                pathname: '/reserve',
                params: { stationId: station.id, slotId: selectedSlotId },
              });
            }}
            testID="continue-reservation"
            style={styles.continueButton}
          />
        </View>
      )}
      <Text style={styles.note}>
        Availability is confirmed when you complete your reservation.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backButton: { alignSelf: 'flex-start', marginBottom: spacing.md },
  title: { color: colors.text, fontSize: 28, lineHeight: 34, fontWeight: '900' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 12 },
  distance: { color: colors.primary, fontWeight: '700' },
  address: { color: colors.muted, fontSize: 15, marginTop: 5 },
  description: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 24,
    marginTop: spacing.md,
  },
  heading: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '800',
    marginTop: spacing.lg,
    marginBottom: 12,
  },
  amenities: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
  },
  pillText: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  timesHeading: { marginTop: spacing.xl },
  slots: { gap: 10 },
  slot: {
    minHeight: 104,
    padding: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  unavailable: { opacity: 0.6 },
  selectedSlot: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  dateBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotCopy: { flex: 1, minWidth: 0 },
  slotDate: { color: colors.text, fontSize: 15, fontWeight: '800' },
  slotTime: { color: colors.text, fontSize: 15, marginTop: 3 },
  places: { color: colors.primary, fontSize: 13, fontWeight: '700', marginTop: 5 },
  limited: { color: colors.warning },
  fullPlaces: { color: colors.muted },
  selectButton: { minWidth: 72, paddingHorizontal: 10 },
  continueButton: { marginTop: spacing.sm },
  note: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: spacing.md },
});
