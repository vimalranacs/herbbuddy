import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#f7fafc',
          },
          headerTintColor: '#22543d',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="profile-setup" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen
          name="login"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="signup"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="terms-and-conditions"
          options={{
            title: 'Terms & Conditions',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="add-event"
          options={{
            presentation: 'modal',
            title: 'New Event',
            headerStyle: {
              backgroundColor: '#2f855a',
            },
            headerTintColor: '#fff',
          }}
        />
        <Stack.Screen
          name="discover"
          options={{
            title: 'Discover Events',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="join-plan"
          options={{
            title: 'Join Plan',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="chat"
          options={{
            title: 'Chat',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="privacy-policy"
          options={{
            title: 'Privacy Policy',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="verify-otp"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="auth/callback"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
