import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';

import { checkIn } from '@/src/api/mockApi';
import { Button } from '@/src/components/Button';
import { FormField } from '@/src/components/FormField';
import { Screen } from '@/src/components/Screen';
import { CheckInFormValues, checkInSchema } from '@/src/features/bookings/schema';
import { colors, radii, spacing } from '@/src/theme';

export default function CheckInScreen() {
  const { code = '' } = useLocalSearchParams<{ code?: string }>();
  const router = useRouter();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckInFormValues>({
    resolver: zodResolver(checkInSchema),
    defaultValues: { bookingCode: code },
  });
  const checkInMutation = useMutation({ mutationFn: checkIn });

  if (checkInMutation.isSuccess) {
    return (
      <Screen contentStyle={styles.successContainer}>
        <View style={styles.successMark}>
          <Text style={styles.check}>✓</Text>
        </View>
        <Text accessibilityRole="header" style={styles.title}>
          Check-in complete
        </Text>
        <Text style={styles.copy}>
          Welcome, {checkInMutation.data.fullName}. You’re ready for your session.
        </Text>
        <Text style={styles.successCode}>{checkInMutation.data.bookingCode}</Text>
        <Button label="Done" onPress={() => router.replace('/')} style={styles.done} />
      </Screen>
    );
  }

  const submit = ({ bookingCode }: CheckInFormValues) => {
    if (!checkInMutation.isPending) checkInMutation.mutate(bookingCode);
  };

  return (
    <Screen>
      <View style={styles.icon}>
        <Text style={styles.iconText}>#</Text>
      </View>
      <Text accessibilityRole="header" style={styles.title}>
        Enter booking code
      </Text>
      <Text style={styles.copy}>
        Find the code below the QR image on your booking confirmation.
      </Text>
      <View style={styles.form}>
        <Controller
          control={control}
          name="bookingCode"
          render={({ field: { onBlur, onChange, value } }) => (
            <FormField
              label="Booking code"
              placeholder="TSF-ABC123"
              autoCapitalize="characters"
              autoCorrect={false}
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              error={errors.bookingCode?.message}
            />
          )}
        />
        {checkInMutation.isError && (
          <View accessibilityRole="alert" style={styles.errorBox}>
            <Text style={styles.errorTitle}>Couldn’t check in</Text>
            <Text style={styles.errorText}>{checkInMutation.error.message}</Text>
          </View>
        )}
        <Button
          label="Check in"
          loading={checkInMutation.isPending}
          onPress={handleSubmit(submit)}
        />
      </View>
      <Text style={styles.demoNote}>
        This is a simulated check-in. No external certification or attendance service is
        contacted.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  icon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  iconText: { color: colors.primary, fontSize: 30, fontWeight: '900' },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  copy: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 23,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  form: { gap: spacing.md, marginTop: spacing.xl },
  errorBox: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  errorTitle: { color: colors.danger, fontWeight: '800' },
  errorText: { color: colors.danger, lineHeight: 20, marginTop: 5 },
  demoNote: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  successContainer: { justifyContent: 'center' },
  successMark: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.primarySoft,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: { color: colors.primary, fontSize: 40, fontWeight: '900' },
  successCode: {
    color: colors.primary,
    fontSize: 18,
    letterSpacing: 1.5,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  done: { marginTop: spacing.xl },
});
