import "../global.css";
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { useFonts, DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { CormorantGaramond_400Regular, CormorantGaramond_700Bold } from '@expo-google-fonts/cormorant-garamond';
import { DMMono_400Regular } from '@expo-google-fonts/dm-mono';
import { Colors } from '../constants/theme';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useUserTracking } from '../lib/tracking';
import { initI18n } from '../lib/i18n';
import { useTranslation } from 'react-i18next';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useUserTracking();
  const colorScheme = useColorScheme();
  const [i18nLoaded, setI18nLoaded] = useState(false);
  
  const [fontsLoaded, fontError] = useFonts({
    'DMSans-Regular': DMSans_400Regular,
    'DMSans-Medium': DMSans_500Medium,
    'DMSans-Bold': DMSans_700Bold,
    'Cormorant-Regular': CormorantGaramond_400Regular,
    'Cormorant-Bold': CormorantGaramond_700Bold,
    'DMMono-Regular': DMMono_400Regular,
  });

  useEffect(() => {
    initI18n().then(() => {
      setI18nLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  useEffect(() => {
    if (fontsLoaded && i18nLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, i18nLoaded]);

  if (!fontsLoaded || !i18nLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <I18nAwareStack colorScheme={colorScheme} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

// Inner component to access the translation hook for titles
function I18nAwareStack({ colorScheme }: { colorScheme: any }) {
  const { t } = useTranslation();
  
  return (
    <Stack screenOptions={{ 
      headerStyle: { backgroundColor: colorScheme === 'dark' ? Colors.primary : '#F8F7F4' },
      headerTitleStyle: { 
        fontFamily: 'Cormorant-Bold', 
        color: colorScheme === 'dark' ? '#FFFFFF' : '#1A1A1A',
        fontSize: 20
      },
      headerTintColor: colorScheme === 'dark' ? '#FFFFFF' : '#1A1A1A',
    }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="result" options={{ title: 'Cote QimatnaDz' }} />
      <Stack.Screen name="transaction" options={{ title: 'Vente confirmée' }} />
      <Stack.Screen name="auth" options={{ presentation: 'modal', title: 'Connexion' }} />
      <Stack.Screen name="admin" options={{ headerShown: false }} />
    </Stack>
  );
}
