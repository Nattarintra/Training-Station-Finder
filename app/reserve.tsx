import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ApiError, createReservation } from '@/src/api/mockApi';
import { Button } from '@/src/components/Button';
import { FormField } from '@/src/components/FormField';
import { Screen } from '@/src/components/Screen';
import { StateView } from '@/src/components/StateView';
import { ReservationFormValues, reservationSchema } from '@/src/features/bookings/schema';
import { useStation } from '@/src/features/stations/queries';
import { colors, radii, spacing } from '@/src/theme';
import { formatSlotDate, formatSlotTime } from '@/src/utils/format';

export default function ReserveScreen() {
  const { stationId = '', slotId = '' } = useLocalSearchParams<{
    stationId: string;
    slotId: string;
  }>();
  const router = useRouter();
  const idempotencyKey = useRef<string | null>(null);
  const stationQuery = useStation(stationId);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ReservationFormValues>({
    resolver: zodResolver(reservationSchema),
    defaultValues: { fullName: '', email: '', phone: '' },
  });
  const reservation = useMutation({
    mutationFn: createReservation,
    onSuccess: (data) => router.replace(`/booking/${data.id}`),
    onError: (error) => {
      if (error instanceof ApiError) {
        idempotencyKey.current = null;
      }
    },
  });

  if (stationQuery.isPending)
    return (
      <Screen>
        <StateView title="Preparing reservation…" loading />
      </Screen>
    );
  if (stationQuery.isError)
    return (
      <Screen>
        <StateView title="Unable to reserve" message={stationQuery.error.message} />
      </Screen>
    );
  const station = stationQuery.data;
  const slot = station.slots.find((item) => item.id === slotId);
  if (!slot)
    return (
      <Screen>
        <StateView
          title="Time not found"
          message="Return to the station and choose another time."
        />
      </Screen>
    );

  const submit = (values: ReservationFormValues) => {
    if (reservation.isPending) return;
    idempotencyKey.current ??= `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    reservation.mutate({
      ...values,
      stationId,
      slotId,
      idempotencyKey: idempotencyKey.current,
    });
  };
  const slotUnavailable =
    reservation.error instanceof ApiError &&
    reservation.error.code === 'SLOT_UNAVAILABLE';

  return (
    <Screen>
      <View style={styles.summary}>
        <Text style={styles.eyebrow}>YOUR SESSION</Text>
        <Text style={styles.station}>{station.name}</Text>
        <Text style={styles.time}>
          {formatSlotDate(slot.startsAt)} · {formatSlotTime(slot.startsAt, slot.endsAt)}
        </Text>
        <Text style={styles.address}>{station.address}</Text>
      </View>

      <Text accessibilityRole="header" style={styles.title}>
        Your details
      </Text>
      <Text style={styles.intro}>
        We’ll use these details only for this practice booking.
      </Text>
      <View style={styles.form}>
        <Controller
          control={control}
          name="fullName"
          render={({ field: { onBlur, onChange, value } }) => (
            <FormField
              label="Full name"
              placeholder="Alex Morgan"
              autoComplete="name"
              textContentType="name"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              error={errors.fullName?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="email"
          render={({ field: { onBlur, onChange, value } }) => (
            <FormField
              label="Email"
              placeholder="alex@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              error={errors.email?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="phone"
          render={({ field: { onBlur, onChange, value } }) => (
            <FormField
              label="Phone"
              placeholder="+46 70 123 45 67"
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              error={errors.phone?.message}
            />
          )}
        />
      </View>

      {reservation.isError && (
        <View accessibilityRole="alert" style={styles.errorBox}>
          <Text style={styles.errorTitle}>
            {slotUnavailable ? 'This time is no longer available' : 'Reservation failed'}
          </Text>
          <Text style={styles.errorText}>{reservation.error.message}</Text>
          {slotUnavailable && (
            <Button
              label="Choose another time"
              variant="danger"
              onPress={() => router.back()}
              style={styles.errorButton}
            />
          )}
        </View>
      )}
      <Button
        label="Confirm reservation"
        loading={reservation.isPending}
        onPress={handleSubmit(submit)}
        style={styles.submit}
        testID="submit-reservation"
      />
      <Text style={styles.privacy}>
        No payment is required. This demonstration stores reservations only in app memory.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  eyebrow: { color: colors.primary, fontSize: 12, letterSpacing: 1.2, fontWeight: '800' },
  station: { color: colors.text, fontSize: 21, fontWeight: '900', marginTop: spacing.sm },
  time: { color: colors.text, fontSize: 16, fontWeight: '700', marginTop: spacing.sm },
  address: { color: colors.muted, fontSize: 14, marginTop: 5 },
  title: { color: colors.text, fontSize: 25, fontWeight: '900', marginTop: spacing.xl },
  intro: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: spacing.sm },
  form: { gap: spacing.md, marginTop: spacing.lg },
  errorBox: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  errorTitle: { color: colors.danger, fontSize: 16, fontWeight: '800' },
  errorText: { color: colors.danger, lineHeight: 20, marginTop: spacing.sm },
  errorButton: { marginTop: spacing.md },
  submit: { marginTop: spacing.lg },
  privacy: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 12,
  },
});
