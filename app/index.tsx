import { View, Text, TouchableOpacity, Platform, I18nManager } from 'react-native';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../constants/theme';
import { ArrowRight, ArrowLeft, CheckCircle2, TrendingUp } from 'lucide-react-native';
import { getLandingPageHtml } from '../constants/landingHtml';
import { useTranslation } from 'react-i18next';
import { setLanguage } from '../lib/i18n';

export default function Splash() {
  const router = useRouter();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleMessage = async (event: MessageEvent) => {
        if (event.data?.type === 'CHANGE_LANGUAGE') {
          const newLang = i18n.language === 'fr' ? 'ar' : 'fr';
          await setLanguage(newLang);
          window.location.reload();
        }
      };
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, [i18n.language]);

  if (Platform.OS === 'web') {
    return (
      <View style={{ flex: 1, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
        <iframe
          srcDoc={getLandingPageHtml(i18n.language)}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            outline: 'none',
          }}
          title="Qimatna Dz Landing Page"
        />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar style="dark" />

      {/* Decorative background noise or simple color is already handled by bg-background */}

      <View className="flex-1 px-6 py-4 justify-between">
        {/* Header */}
        <View className="flex-row justify-between items-center mb-10">
          <Text className="text-primary text-xl font-display font-bold">Qimatna Dz</Text>
        </View>

        {/* Main Content */}
        <View className="flex-1 justify-center">
          {/* Eyebrow Badge */}
          <View className="self-start flex-row items-center bg-accent/10 border border-accent/25 rounded-full px-4 py-2 mb-8">
            <View className="w-1.5 h-1.5 rounded-full bg-accent mr-2" />
            <Text className="text-accent text-[10px] font-body font-bold uppercase tracking-wider">
              {t('splash.eyebrow') || "MARCHÉ AUTOMOBILE ALGÉRIEN • CÔTE EN DIRECT"}
            </Text>
          </View>

          {/* Headline */}
          <Text className="text-primary text-[42px] font-display font-bold leading-[48px] mb-6 tracking-tight">
            Estimez le <Text className="text-accent italic font-display">juste prix</Text> de votre voiture en Algérie.
          </Text>

          {/* Subtitle */}
          <Text className="text-text-secondary text-[16px] font-body leading-[26px] mb-10">
            Grâce à notre intelligence artificielle avancée et l'analyse continue du marché algérien. Obtenez une estimation chirurgicale en 1 clic, gratuitement et sans compte.
          </Text>

          {/* Action Buttons */}
          <View className="gap-4">
            <TouchableOpacity
              className="bg-primary w-full py-4 rounded-[100px] flex-row justify-center items-center"
              activeOpacity={0.85}
              onPress={() => router.replace('/onboarding')}
            >
              <Text className="text-white text-[16px] font-body font-bold">
                🚀 Estimer mon véhicule
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-transparent border border-gray-200 w-full py-4 rounded-[100px] flex-row justify-center items-center"
              activeOpacity={0.85}
              onPress={() => {}}
            >
              <Text className="text-primary text-[16px] font-body font-medium">
                📱 Application mobile
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Trust row */}
        <View className="flex-row justify-center items-center gap-3 pb-6 pt-4">
          <Text className="text-text-secondary text-[12px] font-body">⚡ Gratuit</Text>
          <View className="w-1 h-1 rounded-full bg-gray-300" />
          <Text className="text-text-secondary text-[12px] font-body">Sans inscription</Text>
          <View className="w-1 h-1 rounded-full bg-gray-300" />
          <Text className="text-text-secondary text-[12px] font-body">100% anonyme</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
