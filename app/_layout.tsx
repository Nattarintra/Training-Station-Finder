import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AppProviders } from '@/src/providers/AppProviders';
import { colors } from '@/src/theme';

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    primary: colors.primary,
    text: colors.text,
  },
};

export default function RootLayout() {
  return (
    <AppProviders>
      <ThemeProvider value={navigationTheme}>
        <Stack
          screenOptions={{
            headerShadowVisible: false,
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerBackButtonDisplayMode: 'minimal',
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="station/[id]" options={{ title: 'Station details' }} />
          <Stack.Screen
            name="reserve"
            options={{ title: 'Reserve a session', presentation: 'modal' }}
          />
          <Stack.Screen
            name="booking/[id]"
            options={{ title: 'Booking confirmed', headerBackVisible: false }}
          />
          <Stack.Screen name="check-in" options={{ title: 'Check in' }} />
        </Stack>
        <StatusBar style="dark" />
      </ThemeProvider>
    </AppProviders>
  );
}
