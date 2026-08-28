import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/src/components/Button';
import { setStationListScenario, StationListScenario } from '@/src/api/mockApi';
import { Screen } from '@/src/components/Screen';
import { StateView } from '@/src/components/StateView';
import { StationCard } from '@/src/features/stations/StationCard';
import { StationScenarioControl } from '@/src/features/stations/StationScenarioControl';
import { useStations } from '@/src/features/stations/queries';
import { colors, radii, spacing } from '@/src/theme';

export default function HomeScreen() {
  const router = useRouter();
  const stationsQuery = useStations();
  const [scenario, setScenario] = useState<StationListScenario>('success');

  const changeScenario = (nextScenario: StationListScenario) => {
    setScenario(nextScenario);
    setStationListScenario(nextScenario);
    void stationsQuery.refetch();
  };

  return (
    <Screen>
      <View style={styles.hero}>
        <View style={styles.brandRow}>
          <View style={styles.mark}>
            <Ionicons name="fitness" color={colors.surface} size={22} />
          </View>
          <Text style={styles.brand}>Training Station Finder</Text>
        </View>
        <Text accessibilityRole="header" style={styles.title}>
          Practice nearby.{`\n`}Build confidence.
        </Text>
        <Text style={styles.subtitle}>
          Find an available training space and reserve a session in minutes.
        </Text>
      </View>

      <View style={styles.headingRow}>
        <View>
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            Nearby stations
          </Text>
          <Text style={styles.location}>Sorted by distance · Sample location</Text>
        </View>
      </View>

      {__DEV__ && <StationScenarioControl value={scenario} onChange={changeScenario} />}

      {stationsQuery.isPending ? (
        <StateView title="Finding stations nearby…" loading />
      ) : stationsQuery.isError ? (
        <StateView
          title="Stations are unavailable"
          message="We couldn’t load nearby stations. Check your connection and try again."
          actionLabel="Try again"
          onAction={() => stationsQuery.refetch()}
        />
      ) : stationsQuery.data.length === 0 ? (
        <StateView
          title="No stations nearby"
          message="Try again later as new training times are added regularly."
          actionLabel="Refresh"
          onAction={() => stationsQuery.refetch()}
        />
      ) : (
        <View style={styles.list}>
          {stationsQuery.data.map((station) => (
            <StationCard
              key={station.id}
              station={station}
              onPress={() => router.push(`/station/${station.id}`)}
            />
          ))}
        </View>
      )}

      <View style={styles.checkInCard}>
        <View style={styles.checkInCopy}>
          <Text style={styles.checkInTitle}>Already booked?</Text>
          <Text style={styles.checkInText}>Use your booking code when you arrive.</Text>
        </View>
        <Button
          label="Check in"
          variant="secondary"
          onPress={() => router.push('/check-in')}
        />
      </View>
      <Text style={styles.disclaimer}>
        Independent portfolio concept · Not affiliated with any training provider
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginHorizontal: -spacing.md,
    marginTop: -spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: 56,
    paddingBottom: spacing.xl,
    backgroundColor: colors.text,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: spacing.xl,
  },
  mark: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { color: colors.surface, fontSize: 15, fontWeight: '700' },
  title: {
    color: colors.surface,
    fontSize: 36,
    lineHeight: 41,
    letterSpacing: -1.2,
    fontWeight: '900',
  },
  subtitle: {
    color: '#C9D2CD',
    fontSize: 17,
    lineHeight: 25,
    marginTop: 12,
    maxWidth: 500,
  },
  headingRow: { marginTop: spacing.xl, marginBottom: spacing.md },
  sectionTitle: { color: colors.text, fontSize: 23, fontWeight: '800' },
  location: { color: colors.muted, fontSize: 14, marginTop: 4 },
  list: { gap: 12 },
  checkInCard: {
    marginTop: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.primarySoft,
    borderRadius: radii.lg,
    gap: spacing.md,
  },
  checkInCopy: { gap: 4 },
  checkInTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  checkInText: { color: colors.muted, fontSize: 15 },
  disclaimer: {
    color: colors.muted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
