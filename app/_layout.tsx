import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { 
  Inter_400Regular, 
  Inter_600SemiBold, 
  Inter_700Bold, 
  useFonts 
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import Animated, { 
  FadeOut, 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSequence,
  withDelay,
  runOnJS
} from 'react-native-reanimated';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import Toast from 'react-native-toast-message';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors } from '../styles/tokens';

const { width } = Dimensions.get('window');

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [appReady, setAppReady] = useState(false);
  const [splashAnimationFinished, setSplashAnimationFinished] = useState(false);
  
  const [loaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);

  useEffect(() => {
    if (loaded) {
      // Start the "beauty" animation
      logoOpacity.value = withTiming(1, { duration: 800 });
      logoScale.value = withTiming(1, { duration: 1000 });
      
      // Delay hiding the native splash to avoid flicker
      setTimeout(async () => {
        await SplashScreen.hideAsync();
        setAppReady(true);
      }, 500);

      // Finish custom splash after a bit more time
      setTimeout(() => {
        setSplashAnimationFinished(true);
      }, 2500);
    }
  }, [loaded]);

  const animatedLogoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  if (!loaded) {
    return null;
  }

  return (
    <View style={{ flex: 1 }}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
          <Toast />
        </ThemeProvider>

      {/* Custom Animated Splash Screen */}
      {!splashAnimationFinished && (
        <Animated.View 
          exiting={FadeOut.duration(800)}
          style={[
            StyleSheet.absoluteFill, 
            { 
              backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 9999
            }
          ]}
        >
          <Animated.View style={[styles.splashLogoContainer, animatedLogoStyle]}>
            <View style={styles.placeholderLogo}>
              <Text style={styles.placeholderText}>APP</Text>
            </View>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  splashLogoContainer: {
    width: width * 0.6,
    height: width * 0.6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderLogo: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: width * 0.3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: width * 0.15,
    fontWeight: 'bold',
    color: colors.white,
  }
});
