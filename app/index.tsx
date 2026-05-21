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

      {/* Decorative blobs */}
      <View className="absolute top-[-80] right-[-80] w-[280] h-[280] bg-accent/10 rounded-full" />
      <View className="absolute bottom-[-40] left-[-60] w-[220] h-[220] bg-primary/5 rounded-full" />

      <View className="flex-1 justify-between px-8 py-6">
        {/* Top section */}
        <View className="flex-1 justify-center items-center">
          {/* Logo */}
          <View className="bg-primary w-[72] h-[72] rounded-[22px] items-center justify-center mb-8 shadow-xl">
            <Text className="text-white text-4xl font-display font-bold">Q</Text>
          </View>

          {/* Eyebrow */}
          <View className="flex-row items-center mb-4">
            <View className="w-8 h-[1px] bg-accent mx-3" />
            <Text className="text-accent text-[11px] font-body font-bold uppercase tracking-[2px]">
              {t('splash.eyebrow')}
            </Text>
          </View>

          {/* Main headline */}
          <Text className="text-primary text-[32px] font-display font-bold text-center leading-[38px] mb-4 px-2">
            {t('splash.title')}
          </Text>

          {/* Sub-headline */}
          <Text className="text-text-secondary text-[15px] font-body text-center leading-[24px] px-4">
            {t('splash.subtitle')}
          </Text>
        </View>

        {/* Bottom section */}
        <View className="w-full">
          {/* Feature bullets */}
          <View className="flex-col gap-3 mb-8 px-2">
            {[
              { icon: <CheckCircle2 size={15} color="#00B89A" />, text: t('splash.feature1') },
              { icon: <TrendingUp size={15} color="#00B89A" />, text: t('splash.feature2') },
            ].map((item, i) => (
              <View key={i} className="flex-row items-center gap-2">
                {item.icon}
                <Text className="text-text-primary text-[13px] font-body font-medium">
                  {item.text}
                </Text>
              </View>
            ))}
          </View>

          {/* CTA */}
          <TouchableOpacity
            className="bg-accent w-full py-5 rounded-[20px] items-center flex-row justify-center mb-4"
            activeOpacity={0.85}
            onPress={() => router.replace('/onboarding')}
          >
            <Text className="text-white text-[17px] font-body font-bold mx-2">
              {t('splash.cta')}
            </Text>
            {I18nManager.isRTL ? <ArrowLeft size={20} color="#FFFFFF" /> : <ArrowRight size={20} color="#FFFFFF" />}
          </TouchableOpacity>

          {/* Trust row */}
          <View className="flex-row justify-center items-center gap-2">
            <Text className="text-text-muted text-[11px] font-body">{t('splash.trust_free')}</Text>
            <View className="w-1 h-1 rounded-full bg-text-muted" />
            <Text className="text-text-muted text-[11px] font-body">{t('splash.trust_no_signup')}</Text>
            <View className="w-1 h-1 rounded-full bg-text-muted" />
            <Text className="text-text-muted text-[11px] font-body">{t('splash.trust_anonymous')}</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
