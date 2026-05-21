import { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Platform,
  I18nManager,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

const ONBOARDING_KEY = 'qimatnadz_onboarding_done';

function markOnboardingDone() {
  if (Platform.OS === 'web') {
    localStorage.setItem(ONBOARDING_KEY, 'true');
  }
}

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const SLIDES = [
    {
      key: 'slide1',
      eyebrow: t('onboarding.slide1.eyebrow'),
      title: t('onboarding.slide1.title'),
      description: t('onboarding.slide1.desc'),
      themeColor: '#0D0E10',
      bgLight: 'rgba(13,14,16,0.04)',
    },
    {
      key: 'slide2',
      eyebrow: t('onboarding.slide2.eyebrow'),
      title: t('onboarding.slide2.title'),
      description: t('onboarding.slide2.desc'),
      themeColor: '#00B89A',
      bgLight: 'rgba(0,184,154,0.08)',
    },
    {
      key: 'slide3',
      eyebrow: t('onboarding.slide3.eyebrow'),
      title: t('onboarding.slide3.title'),
      description: t('onboarding.slide3.desc'),
      themeColor: '#0D0E10',
      bgLight: 'rgba(13,14,16,0.04)',
    },
  ];

  const goToIndex = (index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
    setActiveIndex(index);
  };

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      goToIndex(activeIndex + 1);
    } else {
      markOnboardingDone();
      router.replace('/(tabs)/evaluate');
    }
  };

  const handleBack = () => {
    if (activeIndex > 0) {
      goToIndex(activeIndex - 1);
    }
  };

  const handleSkip = () => {
    markOnboardingDone();
    router.replace('/(tabs)/evaluate');
  };

  // ─── Slide 1 illustration: scattered price cards ───────────────────────
  const renderSlide1 = () => (
    <View style={styles.illus1}>
      <View style={styles.priceChaos}>
        {/* Overpriced cards (red) */}
        <View style={[styles.chaosCard, { top: '10%', left: '4%', transform: [{ rotate: '-5deg' }] }]}>
          <Text style={styles.chaosCardModel}>Kia KX1 · 2026</Text>
          <Text style={[styles.chaosCardPrice, { color: '#D94F2A' }]}>4 800 000</Text>
        </View>
        <View style={[styles.chaosCard, { top: '52%', right: '4%', transform: [{ rotate: '-3deg' }] }]}>
          <Text style={styles.chaosCardModel}>Kia KX1 · 2026</Text>
          <Text style={[styles.chaosCardPrice, { color: '#D94F2A' }]}>4 500 000</Text>
        </View>
        {/* Underpriced cards (green) */}
        <View style={[styles.chaosCard, { top: '8%', right: '5%', transform: [{ rotate: '4deg' }] }]}>
          <Text style={styles.chaosCardModel}>Kia KX1 · 2026</Text>
          <Text style={[styles.chaosCardPrice, { color: '#00B89A' }]}>3 100 000</Text>
        </View>
        <View style={[styles.chaosCard, { bottom: '10%', left: '14%', transform: [{ rotate: '2deg' }] }]}>
          <Text style={styles.chaosCardModel}>Kia KX1 · 2026</Text>
          <Text style={[styles.chaosCardPrice, { color: '#00B89A' }]}>2 900 000</Text>
        </View>
        {/* Middle neutral */}
        <View style={[styles.chaosCard, { top: '40%', left: '12%', transform: [{ rotate: '1deg' }] }]}>
          <Text style={styles.chaosCardModel}>Kia KX1 · 2026</Text>
          <Text style={[styles.chaosCardPrice, { color: '#0D0E10' }]}>3 950 000</Text>
        </View>
        {/* Centre icon */}
        <View style={styles.chaosCenter}>
          <Text style={{ fontSize: 22 }}>🤷</Text>
        </View>
      </View>
    </View>
  );

  // ─── Slide 2 illustration: step-by-step flow ───────────────────────────
  const renderSlide2 = () => {
    const steps = [
      {
        num: '1',
        title: t('onboarding.slide2.step1_title'),
        sub: t('onboarding.slide2.step1_sub'),
        state: 'done',
      },
      {
        num: '2',
        title: t('onboarding.slide2.step2_title'),
        sub: t('onboarding.slide2.step2_sub'),
        state: 'active',
      },
      {
        num: '3',
        title: t('onboarding.slide2.step3_title'),
        sub: t('onboarding.slide2.step3_sub'),
        state: 'pending',
      },
    ];

    return (
      <View style={styles.illus2}>
        <View style={styles.stepsCard}>
          {steps.map((step, idx) => (
            <View
              key={step.num}
              style={[
                styles.stepRow,
                idx < steps.length - 1 && styles.stepRowBorder,
              ]}
            >
              <View
                style={[
                  styles.stepNum,
                  step.state === 'done' || step.state === 'active'
                    ? { backgroundColor: '#00B89A' }
                    : { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(13,14,16,0.15)' },
                ]}
              >
                <Text
                  style={[
                    styles.stepNumText,
                    step.state === 'pending' && { color: 'rgba(13,14,16,0.3)' },
                  ]}
                >
                  {step.num}
                </Text>
              </View>
              <View style={styles.stepText}>
                <Text
                  style={[
                    styles.stepTitle,
                    step.state === 'pending' && { color: 'rgba(13,14,16,0.4)' },
                    I18nManager.isRTL && { textAlign: 'left' }
                  ]}
                >
                  {step.title}
                </Text>
                <Text style={[styles.stepSub, I18nManager.isRTL && { textAlign: 'left' }]}>{step.sub}</Text>
              </View>
              {step.state === 'done' && (
                <View style={styles.stepBadgeDone}>
                  <Text style={styles.stepBadgeDoneText}>✓</Text>
                </View>
              )}
              {step.state === 'active' && (
                <View style={styles.stepBadgeActive}>
                  <Text style={styles.stepBadgeActiveText}>···</Text>
                </View>
              )}
              {step.state === 'pending' && <View style={styles.stepBadgePending} />}
            </View>
          ))}
        </View>
      </View>
    );
  };

  // ─── Slide 3 illustration: result card ─────────────────────────────────
  const renderSlide3 = () => (
    <View style={styles.illus3}>
      <View style={styles.resultCard}>
        {/* Header */}
        <View style={styles.rcHeader}>
          <Text style={styles.rcLabel}>{t('onboarding.slide3.card_header')}</Text>
          <View style={styles.rcBadge}>
            <Text style={styles.rcBadgeText}>{t('onboarding.slide3.card_verified')}</Text>
          </View>
        </View>
        {/* Body */}
        <View style={styles.rcBody}>
          <Text style={[styles.rcCar, I18nManager.isRTL && { textAlign: 'left' }]}>Kia KX1 · 2026 · 00 Compteur</Text>
          <Text style={[styles.rcPrice, I18nManager.isRTL && { textAlign: 'left' }]}>
            3 950 000 <Text style={styles.rcPriceDzd}>DZD</Text>
          </Text>
          <Text style={[styles.rcRange, I18nManager.isRTL && { textAlign: 'left' }]}>{t('onboarding.slide3.card_range')} · 3 750 000 – 4 150 000 DZD</Text>

          {/* Confidence bar */}
          <View style={styles.rcBarWrap}>
            <View style={styles.rcBarLabelRow}>
              <Text style={styles.rcBarLabel}>{t('onboarding.slide3.card_confidence')}</Text>
              <Text style={styles.rcBarScore}>94/100</Text>
            </View>
            <View style={styles.rcBar}>
              <View style={[styles.rcFill, { width: '94%' }]} />
            </View>
          </View>

          {/* Factors */}
          {[
            { label: t('onboarding.slide3.factor1_label'), tag: t('onboarding.slide3.factor1_tag'), pos: true },
            { label: t('onboarding.slide3.factor2_label'), tag: t('onboarding.slide3.factor2_tag'), pos: true },
            { label: t('onboarding.slide3.factor3_label'), tag: t('onboarding.slide3.factor3_tag'), pos: true },
          ].map((f) => (
            <View key={f.label} style={styles.rcFactor}>
              <View style={styles.rcFactorLeft}>
                <View style={[styles.rcDot, { backgroundColor: f.pos ? '#00B89A' : '#D94F2A' }]} />
                <Text style={styles.rcFactorLabel}>{f.label}</Text>
              </View>
              <View style={[styles.rcTag, { backgroundColor: f.pos ? 'rgba(0,184,154,0.1)' : 'rgba(217,79,42,0.1)' }]}>
                <Text style={[styles.rcTagText, { color: f.pos ? '#00B89A' : '#D94F2A' }]}>{f.tag}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderIllustration = (key: string) => {
    if (key === 'slide1') return renderSlide1();
    if (key === 'slide2') return renderSlide2();
    if (key === 'slide3') return renderSlide3();
    return null;
  };

  const isLastSlide = activeIndex === SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>Qimatna Dz</Text>
        {!isLastSlide ? (
          <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
            <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 56 }} />
        )}
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            {/* Illustration zone */}
            <View style={[styles.illusZone, { backgroundColor: item.bgLight }]}>
              {renderIllustration(item.key)}
            </View>

            {/* Text */}
            <View style={styles.textContent}>
              <View style={styles.eyebrowRow}>
                <View style={styles.eyebrowLine} />
                <Text style={styles.eyebrow}>{item.eyebrow.toUpperCase()}</Text>
              </View>
              <Text style={[styles.slideTitle, I18nManager.isRTL && { textAlign: 'left' }]}>{item.title}</Text>
              <Text style={[styles.slideDesc, I18nManager.isRTL && { textAlign: 'left' }]}>{item.description}</Text>
            </View>
          </View>
        )}
      />

      {/* Footer */}
      <View style={styles.footer}>
        {/* Dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === activeIndex ? styles.dotActive : styles.dotInactive]}
            />
          ))}
        </View>

        {/* Buttons */}
        <View style={styles.ctaArea}>
          <TouchableOpacity
            style={[styles.btn, isLastSlide ? styles.btnCyan : styles.btnDark]}
            onPress={handleNext}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>
              {isLastSlide ? t('onboarding.start') : t('onboarding.next')}
            </Text>
          </TouchableOpacity>

          {activeIndex > 0 && (
            <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
              <Text style={styles.backBtnText}>{t('onboarding.back')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Trust row on last slide */}
        {isLastSlide && (
          <View style={styles.trustRow}>
            <Text style={styles.trustItem}>⚡ {t('splash.trust_free')}</Text>
            <View style={styles.trustDot} />
            <Text style={styles.trustItem}>{t('splash.trust_no_signup')}</Text>
            <View style={styles.trustDot} />
            <Text style={styles.trustItem}>{t('splash.trust_anonymous')}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F6F2',
  },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 8 : 18,
    paddingBottom: 8,
  },
  logo: {
    fontFamily: 'Cormorant-Bold',
    fontSize: 26,
    fontWeight: 'bold',
    color: '#0D0E10',
  },
  skipBtn: {
    backgroundColor: 'rgba(13,14,16,0.06)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 100,
  },
  skipText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(13,14,16,0.55)',
  },

  // ── Slide ────────────────────────────────────────────────────────────────
  slide: {
    flex: 1,
  },
  illusZone: {
    height: 250,
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 24,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 22,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  eyebrowLine: {
    width: 16,
    height: 2,
    backgroundColor: '#00B89A',
    borderRadius: 1,
    marginRight: 8,
  },
  eyebrow: {
    fontFamily: 'DMSans-Regular',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: 'rgba(13,14,16,0.45)',
  },
  slideTitle: {
    fontFamily: 'Cormorant-Bold',
    fontSize: 27,
    fontWeight: 'bold',
    color: '#0D0E10',
    lineHeight: 34,
    marginBottom: 12,
  },
  slideDesc: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: 'rgba(13,14,16,0.62)',
    lineHeight: 21,
  },

  // ── Footer ───────────────────────────────────────────────────────────────
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 18,
  },
  dot: {
    height: 4,
    borderRadius: 100,
  },
  dotActive: {
    width: 22,
    backgroundColor: '#0D0E10',
  },
  dotInactive: {
    width: 6,
    backgroundColor: 'rgba(13,14,16,0.12)',
  },
  ctaArea: {
    width: '100%',
    gap: 6,
  },
  btn: {
    width: '100%',
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDark: {
    backgroundColor: '#0D0E10',
  },
  btnCyan: {
    backgroundColor: '#00B89A',
  },
  btnText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  backBtn: {
    width: '100%',
    paddingVertical: 10,
    alignItems: 'center',
  },
  backBtnText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: 'rgba(13,14,16,0.45)',
    fontWeight: '500',
  },
  trustRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
  },
  trustItem: {
    fontFamily: 'DMSans-Regular',
    fontSize: 11,
    color: 'rgba(13,14,16,0.35)',
    fontWeight: '500',
  },
  trustDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(13,14,16,0.15)',
    marginHorizontal: 8,
  },

  // ── Slide 1: Price chaos ──────────────────────────────────────────────────
  illus1: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  priceChaos: {
    width: '100%',
    height: '100%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chaosCard: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(13,14,16,0.1)',
    borderRadius: 12,
    paddingVertical: 7,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chaosCardModel: {
    fontFamily: 'DMSans-Regular',
    fontSize: 9,
    color: 'rgba(13,14,16,0.5)',
  },
  chaosCardPrice: {
    fontFamily: 'Cormorant-Bold',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 1,
  },
  chaosCenter: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(13,14,16,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },

  // ── Slide 2: Steps ────────────────────────────────────────────────────────
  illus2: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  stepsCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(13,14,16,0.07)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  stepRowBorder: {
    borderBottomWidth: 1,
    borderColor: 'rgba(13,14,16,0.06)',
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepText: {
    flex: 1,
    marginLeft: 12,
  },
  stepTitle: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    fontWeight: '600',
    color: '#0D0E10',
  },
  stepSub: {
    fontFamily: 'DMSans-Regular',
    fontSize: 10,
    color: 'rgba(13,14,16,0.45)',
    marginTop: 2,
  },
  stepBadgeDone: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,184,154,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0,184,154,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBadgeDoneText: {
    color: '#00B89A',
    fontSize: 11,
    fontWeight: 'bold',
  },
  stepBadgeActive: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,184,154,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBadgeActiveText: {
    color: '#00B89A',
    fontSize: 9,
    fontWeight: 'bold',
    lineHeight: 12,
  },
  stepBadgePending: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(13,14,16,0.12)',
  },

  // ── Slide 3: Result card ──────────────────────────────────────────────────
  illus3: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  resultCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(13,14,16,0.07)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    overflow: 'hidden',
  },
  rcHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderColor: 'rgba(13,14,16,0.05)',
  },
  rcLabel: {
    fontFamily: 'DMSans-Regular',
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(13,14,16,0.3)',
    letterSpacing: 0.5,
  },
  rcBadge: {
    backgroundColor: 'rgba(0,184,154,0.08)',
    borderColor: 'rgba(0,184,154,0.25)',
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  rcBadgeText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 9,
    color: '#00B89A',
    fontWeight: '600',
  },
  rcBody: {
    padding: 12,
    gap: 4,
  },
  rcCar: {
    fontFamily: 'DMSans-Regular',
    fontSize: 10,
    color: 'rgba(13,14,16,0.5)',
    marginBottom: 1,
    fontWeight: '500',
  },
  rcPrice: {
    fontFamily: 'Cormorant-Bold',
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0D0E10',
    lineHeight: 24,
  },
  rcPriceDzd: {
    fontFamily: 'DMSans-Regular',
    fontSize: 11,
    fontWeight: '400',
    color: 'rgba(13,14,16,0.4)',
  },
  rcRange: {
    fontFamily: 'DMSans-Regular',
    fontSize: 9,
    color: 'rgba(13,14,16,0.45)',
    marginBottom: 4,
  },
  rcBarWrap: {
    marginBottom: 6,
  },
  rcBarLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  rcBarLabel: {
    fontFamily: 'DMSans-Regular',
    fontSize: 9,
    color: 'rgba(13,14,16,0.45)',
  },
  rcBarScore: {
    fontFamily: 'DMSans-Regular',
    fontSize: 10,
    fontWeight: '700',
    color: '#00B89A',
  },
  rcBar: {
    height: 3,
    backgroundColor: 'rgba(13,14,16,0.07)',
    borderRadius: 100,
  },
  rcFill: {
    height: '100%',
    backgroundColor: '#00B89A',
    borderRadius: 100,
  },
  rcFactor: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 6,
    backgroundColor: 'rgba(13,14,16,0.02)',
    borderRadius: 8,
  },
  rcFactorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rcDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 7,
  },
  rcFactorLabel: {
    fontFamily: 'DMSans-Regular',
    fontSize: 9,
    color: '#0D0E10',
  },
  rcTag: {
    borderRadius: 100,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  rcTagText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 8,
    fontWeight: '700',
  },
});
