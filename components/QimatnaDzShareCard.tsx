import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Share,
  TouchableOpacity,
  Platform,
} from 'react-native';
import * as Sharing from 'expo-sharing';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CoteResult {
  marque: string;
  modele: string;
  annee: number;
  kilometrage: number;
  carburant: string;
  wilaya: string;
  prixConseil: number;
  prixMin: number;
  prixMax: number;
  score: number; // 0-100
  verdict: 'bonne_affaire' | 'prix_marche' | 'surevalue';
  conseil: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatPrice = (n: number): string =>
  n.toLocaleString('fr-DZ').replace(/\u202f/g, ' ');

const formatKm = (n: number): string =>
  n.toLocaleString('fr-DZ').replace(/\u202f/g, ' ') + ' km';

const verdictLabel = (v: CoteResult['verdict']): string => ({
  bonne_affaire: 'Bonne affaire',
  prix_marche: 'Prix marché',
  surevalue: 'Surévalué',
}[v]);

const verdictColor = (v: CoteResult['verdict']): string => ({
  bonne_affaire: '#00b89a',
  prix_marche: '#00b89a',
  surevalue: '#d94f2a',
}[v]);

const todayLabel = (): string => {
  const monthsFr = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
  ];
  const monthsAr = [
    'جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان',
    'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
  ];
  const d = new Date();
  const isAr = i18next.language === 'ar';
  const months = isAr ? monthsAr : monthsFr;
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

// ─── Share text (WhatsApp / SMS fallback) ─────────────────────────────────────

const buildShareText = (data: CoteResult, t: any): string => `
─────────────────────────
🏷 ${t('share.report')}
─────────────────────────
🚗  ${data.marque} ${data.modele} ${data.annee}
     ${formatKm(data.kilometrage)} · ${data.carburant} · ${data.wilaya}

💰  ${t('share.recommended_price')}
     ${formatPrice(data.prixConseil)} DZD

📊  Fourchette marché
     ${t('share.min')}  →  ${formatPrice(data.prixMin)} DZD
     ${t('share.max')}  →  ${formatPrice(data.prixMax)} DZD

📈  ${t('share.evaluation')} : ${data.score} / 100
✅  ${t('share.verdict')} : ${t(`components.condition_${data.verdict === 'bonne_affaire' ? 'excellent' : data.verdict === 'surevalue' ? 'bad' : 'medium'}`) /* Approx map */}
─────────────────────────
${t('share.based_on', { date: todayLabel() })}

👉 qimatnadz.com
─────────────────────────`.trim();

// ─── Visual Card Component ─────────────────────────────────────────────────────

interface ShareCardProps {
  data: CoteResult;
}

export const ShareCard = React.forwardRef<View, ShareCardProps>(
  ({ data }, ref) => {
    const { t } = useTranslation();
    // Score bar fill percentage (clamped 0-100)
    const fill = Math.min(100, Math.max(0, data.score));

    return (
      <View ref={ref as any} style={styles.card} collapsable={false}>

        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.logoBox}>
              <Text style={styles.logoLetter}>Q</Text>
            </View>
            <View>
              <Text style={styles.brandName}>QimatnaDz</Text>
              <Text style={styles.brandSub}>{t('share.official_report')}</Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.dateLabel}>{t('share.issued_on')}</Text>
            <Text style={styles.dateVal}>{todayLabel()}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* ── VEHICLE ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('share.evaluated_vehicle')}</Text>
          <Text style={styles.vehicleName}>
            {data.marque} {data.modele}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaItem}>{data.annee}</Text>
            <View style={styles.metaDot} />
            <Text style={styles.metaItem}>{formatKm(data.kilometrage)}</Text>
            <View style={styles.metaDot} />
            <Text style={styles.metaItem}>{data.carburant}</Text>
            <View style={styles.metaDot} />
            <Text style={styles.metaItem}>{data.wilaya}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* ── PRICE ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('share.recommended_price')}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceMain}>{formatPrice(data.prixConseil)}</Text>
            <Text style={styles.priceCurrency}> DZD</Text>
          </View>

          {/* Range bar */}
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${fill}%` as any }]} />
            {/* Center dot at 50% representing the recommended price */}
            <View style={styles.barDot} />
          </View>

          <View style={styles.rangeRow}>
            <View>
              <Text style={styles.rangeLabel}>{t('share.min')}</Text>
              <Text style={styles.rangeVal}>{formatPrice(data.prixMin)} DZD</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.rangeLabel}>{t('share.max')}</Text>
              <Text style={styles.rangeVal}>{formatPrice(data.prixMax)} DZD</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* ── METRICS ── */}
        <View style={styles.metricsRow}>
          <View style={[styles.metricCell, styles.metricBorderRight]}>
            <Text style={styles.metricLabel}>{t('share.evaluation')}</Text>
            <Text style={styles.metricValCyan}>
              {data.score}
              <Text style={styles.metricValSub}>/100</Text>
            </Text>
          </View>
          <View style={[styles.metricCell, styles.metricBorderRight]}>
            <Text style={styles.metricLabel}>{t('share.verdict')}</Text>
            <Text style={[styles.metricVal, { color: verdictColor(data.verdict) }]}>
              {verdictLabel(data.verdict)}
            </Text>
          </View>
          <View style={styles.metricCell}>
            <Text style={styles.metricLabel}>{t('share.data')}</Text>
            <Text style={styles.metricVal}>{t('share.real_time')}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* ── CONSEIL ── */}
        {data.conseil ? (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('share.negotiation_advice')}</Text>
              <Text style={styles.conseilText}>{data.conseil}</Text>
            </View>
            <View style={styles.divider} />
          </>
        ) : null}

        {/* ── FOOTER ── */}
        <View style={styles.footer}>
          <Text style={styles.footerNote}>
            Estimation neutre basée sur le marché réel. Prix standard hors accessoires aftermarket ajoutés. {t('share.footer_note')}
          </Text>
          <Text style={styles.footerUrl}>qimatnadz.com</Text>
        </View>

      </View>
    );
  }
);

ShareCard.displayName = 'ShareCard';

export const useShareResult = (data: CoteResult) => {
  const cardRef = useRef<any>(null);
  const { t } = useTranslation();

  const shareAsImage = async () => {
    try {
      if (!cardRef.current) {
        throw new Error('cardRef.current is not mounted');
      }

      // ─── Web specific logic ───
      if (Platform.OS === 'web') {
        try {
          const { captureRef } = require('react-native-view-shot');
          const uri = await captureRef(cardRef.current, {
            format: 'png',
            quality: 1,
          });

          // If browser supports native navigator.share with files (e.g. mobile Chrome/Safari)
          if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
            const res = await fetch(uri);
            const blob = await res.blob();
            const file = new File([blob], `rapport-qimatnadz-${data.marque}-${data.annee}.png`, { type: 'image/png' });
            
            if (navigator.canShare({ files: [file] })) {
              await navigator.share({
                files: [file],
                title: t('share.share_dialog', { marque: data.marque, modele: data.modele }),
                text: t('share.share_text', { marque: data.marque, modele: data.modele }),
              });
              return;
            }
          }

          // Desktop fallback: direct download
          const link = document.createElement('a');
          link.download = `rapport-qimatnadz-${data.marque}-${data.modele}-${data.annee}.png`;
          link.href = uri;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          return;
        } catch (webErr) {
          console.error('[QimatnaDz] Web sharing/download failed, falling back to text:', webErr);
          await shareAsText();
          return;
        }
      }

      // ─── Mobile specific logic ───
      // 1. Capture the card as PNG
      const { captureRef } = require('react-native-view-shot');
      const uri = await captureRef(cardRef.current, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      // 2. Try native image share (iOS / Android)
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: t('share.share_title'),
          UTI: 'public.png', // iOS only
        });
      } else {
        // Fallback: text share
        await shareAsText();
      }
    } catch (err) {
      console.error('[QimatnaDz] shareAsImage error:', err);
      // Always fallback to text
      await shareAsText();
    }
  };

  const shareAsText = async () => {
    try {
      await Share.share({
        message: buildShareText(data, t),
        title: t('share.share_dialog', { marque: data.marque, modele: data.modele }),
      });
    } catch (err) {
      console.error('[QimatnaDz] shareAsText error:', err);
    }
  };

  return { cardRef, shareAsImage, shareAsText };
};

// ─── Ready-to-use Share Button ─────────────────────────────────────────────────

interface ShareButtonProps {
  data: CoteResult;
  variant?: 'image' | 'text' | 'auto';
  label?: string;
  style?: object;
  textStyle?: object;
}

export const ShareResultButton: React.FC<ShareButtonProps> = ({
  data,
  variant = 'auto',
  label = "Partager l'expertise",
  style,
  textStyle,
}) => {
  const { cardRef, shareAsImage, shareAsText } = useShareResult(data);

  const handleShare = () => {
    if (variant === 'text') return shareAsText();
    if (variant === 'image') return shareAsImage();
    // auto: image on iOS/Android, text on web
    return Platform.OS === 'web' ? shareAsText() : shareAsImage();
  };

  return (
    <>
      {/* Hidden card — rendered off-screen for capture */}
      <View style={styles.offScreen}>
        {/* Only mount ViewShot on native, fallback or omit if needed on web. Wait, react-native-view-shot supports web if imported dynamically. */}
        <View ref={cardRef} style={{ backgroundColor: 'white' }}>
          <ShareCard data={data} />
        </View>
      </View>

      {/* Visible share button */}
      <TouchableOpacity
        style={[styles.shareBtn, style]}
        onPress={handleShare}
        activeOpacity={0.75}
      >
        <Text style={[styles.shareBtnText, textStyle]}>{label}</Text>
      </TouchableOpacity>
    </>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const C = {
  bg: '#ffffff',
  cyan: '#00b89a',
  darkText: '#0a0c0f',
  greyText: '#5c6066',
  lightGreyText: '#8f95a0',
  divider: 'rgba(10, 12, 15, 0.08)',
  track: 'rgba(0, 184, 154, 0.1)',
};

const styles = StyleSheet.create({
  // ── Card ──
  card: {
    backgroundColor: C.bg,
    width: 380,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.divider,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: C.cyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  brandName: {
    fontSize: 14,
    fontWeight: '700',
    color: C.darkText,
    letterSpacing: -0.2,
  },
  brandSub: {
    fontSize: 8,
    fontWeight: '600',
    color: C.lightGreyText,
    letterSpacing: 0.8,
    marginTop: 1,
  },
  dateLabel: {
    fontSize: 8,
    fontWeight: '600',
    color: C.lightGreyText,
    letterSpacing: 0.6,
  },
  dateVal: {
    fontSize: 11,
    color: C.greyText,
    marginTop: 1,
  },

  // ── Divider ──
  divider: {
    height: 1,
    backgroundColor: C.divider,
    marginHorizontal: 20,
  },

  // ── Sections ──
  section: {
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  sectionLabel: {
    fontSize: 8,
    fontWeight: '600',
    color: C.lightGreyText,
    letterSpacing: 1,
    marginBottom: 6,
  },

  // ── Vehicle ──
  vehicleName: {
    fontSize: 24,
    fontWeight: '700',
    color: C.darkText,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  metaItem: {
    fontSize: 12,
    color: C.greyText,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: C.lightGreyText,
  },

  // ── Price ──
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  priceMain: {
    fontSize: 36,
    fontWeight: '800',
    color: C.darkText,
    letterSpacing: -1,
  },
  priceCurrency: {
    fontSize: 14,
    color: C.greyText,
    fontWeight: '600',
  },

  // ── Range Bar ──
  barTrack: {
    height: 4,
    backgroundColor: C.track,
    borderRadius: 100,
    marginBottom: 10,
    position: 'relative',
    justifyContent: 'center',
  },
  barFill: {
    height: '100%',
    backgroundColor: C.cyan,
    borderRadius: 100,
    opacity: 0.7,
  },
  barDot: {
    position: 'absolute',
    left: '50%',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: C.cyan,
    borderWidth: 2,
    borderColor: C.bg,
    marginLeft: -6,
    top: -4,
  },
  rangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rangeLabel: {
    fontSize: 8,
    fontWeight: '600',
    color: C.lightGreyText,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  rangeVal: {
    fontSize: 12,
    fontWeight: '600',
    color: C.greyText,
  },

  // ── Metrics ──
  metricsRow: {
    flexDirection: 'row',
    paddingVertical: 2,
  },
  metricCell: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  metricBorderRight: {
    borderRightWidth: 1,
    borderRightColor: C.divider,
  },
  metricLabel: {
    fontSize: 8,
    fontWeight: '600',
    color: C.lightGreyText,
    letterSpacing: 0.8,
    marginBottom: 5,
  },
  metricVal: {
    fontSize: 12,
    fontWeight: '600',
    color: C.darkText,
  },
  metricValCyan: {
    fontSize: 16,
    fontWeight: '700',
    color: C.cyan,
  },
  metricValSub: {
    fontSize: 10,
    color: C.lightGreyText,
    fontWeight: '500',
  },

  // ── Conseil ──
  conseilText: {
    fontSize: 12,
    color: C.greyText,
    lineHeight: 18,
    marginTop: 2,
  },

  // ── Footer ──
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  footerNote: {
    fontSize: 9,
    color: C.lightGreyText,
    flex: 1,
    lineHeight: 13,
    marginRight: 12,
  },
  footerUrl: {
    fontSize: 12,
    fontWeight: '700',
    color: C.cyan,
    letterSpacing: -0.2,
  },

  // ── Share Button ──
  shareBtn: {
    backgroundColor: C.cyan,
    borderRadius: 100,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: -0.2,
  },

  // ── Off-screen capture container ──
  offScreen: {
    position: 'absolute',
    top: -9999,
    left: -9999,
    opacity: 0,
  },
});
