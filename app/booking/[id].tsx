import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { StyleSheet, Text, View } from 'react-native';

import { checkIn, getReservation } from '@/src/api/mockApi';
import { Button } from '@/src/components/Button';
import { Screen } from '@/src/components/Screen';
import { StateView } from '@/src/components/StateView';
import { useStation } from '@/src/features/stations/queries';
import { colors, radii, spacing } from '@/src/theme';
import { formatSlotDate, formatSlotTime } from '@/src/utils/format';

export default function BookingScreen() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const bookingQuery = useQuery({
    queryKey: ['reservation', id],
    queryFn: () => getReservation(id),
  });
  const checkInMutation = useMutation({ mutationFn: checkIn });
  const stationQuery = useStation(bookingQuery.data?.stationId ?? '');

  if (bookingQuery.isPending)
    return (
      <Screen>
        <StateView title="Creating your booking…" loading />
      </Screen>
    );
  if (bookingQuery.isError)
    return (
      <Screen>
        <StateView
          title="Booking unavailable"
          message={bookingQuery.error.message}
          actionLabel="Find a station"
          onAction={() => router.replace('/')}
        />
      </Screen>
    );
  if (stationQuery.isPending)
    return (
      <Screen>
        <StateView title="Loading booking details…" loading />
      </Screen>
    );
  if (stationQuery.isError)
    return (
      <Screen>
        <StateView title="Details unavailable" message={stationQuery.error.message} />
      </Screen>
    );

  const booking = bookingQuery.data;
  const station = stationQuery.data;
  const slot = station.slots.find((item) => item.id === booking.slotId);
  if (!slot)
    return (
      <Screen>
        <StateView title="Booking time unavailable" />
      </Screen>
    );
  const isCheckedIn = Boolean(booking.checkedInAt || checkInMutation.data?.checkedInAt);

  return (
    <Screen>
      <View style={styles.successMark}>
        <Text style={styles.check}>✓</Text>
      </View>
      <Text accessibilityRole="header" style={styles.title}>
        You’re booked
      </Text>
      <Text style={styles.subtitle}>
        Your practice session is reserved. Keep this code ready for check-in.
      </Text>

      <View style={styles.ticket}>
        <Text style={styles.station}>{station.name}</Text>
        <Text style={styles.date}>{formatSlotDate(slot.startsAt)}</Text>
        <Text style={styles.time}>{formatSlotTime(slot.startsAt, slot.endsAt)}</Text>
        <View style={styles.divider} />
        <View
          accessible
          accessibilityLabel={`Booking QR code for ${booking.bookingCode}`}
          style={styles.qr}
        >
          <QRCode
            value={`training-station-finder:${booking.bookingCode}`}
            size={172}
            color={colors.text}
            backgroundColor={colors.surface}
          />
        </View>
        <Text style={styles.codeLabel}>BOOKING CODE</Text>
        <Text selectable style={styles.code}>
          {booking.bookingCode}
        </Text>
        <Text style={styles.name}>Reserved for {booking.fullName}</Text>
      </View>

      <Button
        label={isCheckedIn ? 'Checked in' : 'Check in now'}
        loading={checkInMutation.isPending}
        disabled={isCheckedIn}
        onPress={() => checkInMutation.mutate(booking.bookingCode)}
      />
      {checkInMutation.isSuccess && (
        <View accessibilityRole="alert" style={styles.checkInNotice}>
          <Text style={styles.checkInNoticeTitle}>Check-in complete</Text>
          <Text style={styles.checkInNoticeText}>You’re ready for your session.</Text>
        </View>
      )}
      <Button
        label="Back to stations"
        variant="secondary"
        onPress={() => router.replace('/')}
        style={styles.secondary}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  successMark: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.primarySoft,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  check: { color: colors.primary, fontSize: 32, fontWeight: '900' },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: spacing.md,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 23,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginHorizontal: spacing.md,
  },
  ticket: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  station: { color: colors.text, fontSize: 20, fontWeight: '900', textAlign: 'center' },
  date: { color: colors.text, fontSize: 16, fontWeight: '700', marginTop: spacing.sm },
  time: { color: colors.muted, fontSize: 15, marginTop: 3 },
  divider: {
    height: 1,
    width: '100%',
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  qr: { padding: spacing.sm, backgroundColor: colors.surface },
  codeLabel: {
    color: colors.muted,
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: '800',
    marginTop: spacing.md,
  },
  code: {
    color: colors.text,
    fontSize: 25,
    letterSpacing: 2,
    fontWeight: '900',
    marginTop: 5,
  },
  name: { color: colors.muted, fontSize: 14, marginTop: spacing.md },
  checkInNotice: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.md,
    alignItems: 'center',
  },
  checkInNoticeTitle: { color: colors.primary, fontSize: 16, fontWeight: '800' },
  checkInNoticeText: { color: colors.text, marginTop: 4 },
  secondary: { marginTop: 10 },
});
