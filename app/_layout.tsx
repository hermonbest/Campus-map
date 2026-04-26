import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import {
  Inter_400Regular,
  Inter_600SemiBold,
  useFonts
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, ActivityIndicator } from 'react-native';
import { getCachedData, cacheAllData } from '../lib/cache';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [loaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
  });

  useEffect(() => {
    if (loaded) {
      // Hide splash screen when fonts are loaded
      // Perform initial cache sync in background
      initializeCache();
    }
  }, [loaded]);

  const initializeCache = async () => {
    try {
      console.log('[APP_INIT] Checking cache status...');
      const cached = await getCachedData();

      if (!cached) {
        console.log('[APP_INIT] No cached data found, performing initial sync...');
        await cacheAllData();
        console.log('[APP_INIT] Initial sync complete');
      } else {
        console.log('[APP_INIT] Cache exists (v' + cached.appVersion + '), skipping sync');
      }
    } catch (error) {
      console.error('[APP_INIT] Error during initial cache sync:', error);
      // Don't block the app if cache sync fails
    }
  };

  if (!loaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
