import { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Share, Platform, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PriceCard } from '../components/PriceCard';
import { ConfidenceBar } from '../components/ConfidenceBar';
import { Share2, FileText, ArrowLeft, Clock, ChevronLeft, ChevronRight, Bot, Globe, CheckCircle, Shield, Database, Sparkles } from 'lucide-react-native';
import { calculateValuation, ValuationResult } from '../lib/valuation';
import { Colors } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { ShareCard, useShareResult } from '../components/QimatnaDzShareCard';
import { useTranslation } from 'react-i18next';
import { I18nManager } from 'react-native';

export default function ResultScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{
    brand: string;
    model: string;
    year: string;
    mileage: string;
    condition: string;
    paint: string;
    engine: string;
    engine_details: string;
    trim_details: string;
    wilaya: string;
    trim?: string;
    document_status?: string;
    transmission?: string;
  }>();
  const router = useRouter();

  // Notification for rare/new cars (leads without accounts)
  const [showNotificationForm, setShowNotificationForm] = useState(false);
  const [contactType, setContactType] = useState<'whatsapp' | 'email'>('whatsapp');
  const [contactInfo, setContactInfo] = useState('');
  const [submittingNotification, setSubmittingNotification] = useState(false);
  const [notificationSubmitted, setNotificationSubmitted] = useState(false);

  const handleSubmitNotification = async () => {
    if (!contactInfo.trim()) {
      alert(t('result.error_contact'));
      return;
    }
    
    setSubmittingNotification(true);
    try {
      const { error } = await supabase.from('update_requests').insert({
        brand: params.brand as string,
        model: params.model as string,
        contact_type: contactType,
        contact_info: contactInfo.trim(),
      });
      
      if (error) {
        console.warn('Error saving notification request, falling back gracefully:', error);
      }
      
      setNotificationSubmitted(true);
    } catch (err) {
      console.warn('Network error saving notification request:', err);
      setNotificationSubmitted(true);
    } finally {
      setSubmittingNotification(false);
    }
  };

  const [results, setResults] = useState<ValuationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await calculateValuation({
          brand: params.brand as string,
          model: params.model as string,
          year: Number(params.year),
          mileage: Number(params.mileage),
          condition: params.condition as 'excellent' | 'bon' | 'moyen' | 'mauvais',
          paint: params.paint as string,
          engine: params.engine as 'neuf' | 'bon' | 'fatigue',
          engine_details: params.engine_details as string,
          trim_details: params.trim_details as string,
          wilaya: params.wilaya as string,
          trim: params.trim as string,
          document_status: params.document_status as 'safia' | 'licence_delai',
          transmission: params.transmission as 'manuelle' | 'automatique',
        });

        if (data && 'error' in data) {
          setError(`${data.error}`);
        } else if (!data) {
          setError(t('result.error_null'));
        } else if (Object.keys(data).length === 0) {
          setError(t('result.error_empty'));
        } else {
          setResults(data);
        }
      } catch (err) {
        setError(t('result.error_general'));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.brand, params.model, params.year, params.mileage, params.condition, params.paint, params.engine, params.trim, params.document_status, params.transmission]);

  const coteData = {
    marque: params.brand as string,
    modele: params.model as string,
    annee: Number(params.year),
    kilometrage: Number(params.mileage),
    carburant: 'essence', // Default fuel type placeholder for share card
    wilaya: (params.wilaya || 'Algérie') as string,
    prixConseil: results?.prix_estime || 0,
    prixMin: results?.fourchette_min || 0,
    prixMax: results?.fourchette_max || 0,
    score: results?.score_justification || 80,
    verdict: (results?.verdict || 'prix_marche') as 'bonne_affaire' | 'prix_marche' | 'surevalue',
    conseil: results?.conseil_negociation || '',
  };

  const { cardRef, shareAsImage } = useShareResult(coteData);

  const handleShare = async () => {
    if (!results) return;
    await shareAsImage();
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{
        title: t('result.title'),
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/evaluate')} className="ml-4">
            {I18nManager.isRTL ? <ChevronRight size={24} color={Colors.primary} /> : <ArrowLeft size={24} color={Colors.primary} />}
          </TouchableOpacity>
        ),
      }} />

      <ScrollView className="flex-1 px-6">
        <View className="py-8">
          <Text className={`text-text-secondary font-body mb-1 ${I18nManager.isRTL ? 'text-right' : 'text-left'}`}>{t('result.estimation_for')}</Text>
          <Text className={`text-text-primary text-3xl font-display font-bold ${I18nManager.isRTL ? 'text-right' : 'text-left'}`}>
            {params.brand} {params.model} {params.year}
          </Text>
          <View className={`flex-row flex-wrap mt-2.5 ${I18nManager.isRTL ? 'flex-row-reverse' : ''}`}>
            <Text className={`text-[11px] font-body uppercase tracking-[2px] font-bold text-text-secondary ${I18nManager.isRTL ? 'ml-4' : 'mr-4'}`}>
              {params.document_status === 'licence_delai' ? t('result.paper_licence') : t('result.paper_safia')}
            </Text>
            <Text className="text-[11px] font-body uppercase tracking-[2px] font-bold text-text-secondary">
              {params.transmission === 'automatique' ? t('result.gear_auto') : t('result.gear_manual')}
            </Text>
          </View>
          
          <View className={`flex-row items-center mt-4 flex-wrap gap-2 ${I18nManager.isRTL ? 'flex-row-reverse' : ''}`}>
            {results && (
              <View className={`px-4 py-2 rounded-full flex-row items-center ${
                results.verdict === 'bonne_affaire' ? 'bg-green-100' : 
                results.verdict === 'surevalue' ? 'bg-red-100' : 'bg-primary/10'
              }`}>
                <CheckCircle size={14} color={
                  results.verdict === 'bonne_affaire' ? '#166534' : 
                  results.verdict === 'surevalue' ? '#991B1B' : Colors.primary
                } />
                <Text className={`font-display font-bold text-xs uppercase tracking-tight ml-2 ${
                  results.verdict === 'bonne_affaire' ? 'text-green-800' : 
                  results.verdict === 'surevalue' ? 'text-red-800' : 'text-primary'
                }`}>
                  {results.verdict === 'bonne_affaire' ? t('result.good_deal') : 
                   results.verdict === 'surevalue' ? t('result.overvalued') : t('result.market_price')}
                </Text>
              </View>
            )}

            {!results && !loading && (
              <View className="px-3 py-1.5 rounded-full flex-row items-center bg-red-50">
                <View className="w-2 h-2 rounded-full mr-2 bg-red-500" />
                <Text className="font-body text-[11px] font-bold text-red-700">{t('result.failed')}</Text>
              </View>
            )}
            {loading && (
              <View className="px-3 py-1.5 rounded-full flex-row items-center bg-gray-100">
                <View className="w-2 h-2 rounded-full mr-2 bg-gray-400" />
                <Text className="font-body text-[11px] font-bold text-gray-500">{t('result.calculating')}</Text>
              </View>
            )}
          </View>

        </View>

        {loading ? (
          <View className="pb-20">
            {/* Skeleton Loader - Fluid & Animated equivalent */}
            <View className="bg-gray-100 p-6 rounded-[32px] mb-8 opacity-50">
              <View className="h-6 w-1/3 bg-gray-200 rounded-md mb-4" />
              <View className="h-4 w-full bg-gray-200 rounded-md mb-2" />
              <View className="h-4 w-5/6 bg-gray-200 rounded-md" />
            </View>
            <View className="mb-8">
              <View className="h-4 w-1/4 bg-gray-200 rounded-md mb-4" />
              <View className="h-32 bg-gray-100 rounded-[32px] w-full mb-4 opacity-50" />
              <View className="flex-row justify-between">
                <View className="h-24 bg-gray-100 rounded-[32px] w-[48%] opacity-50" />
                <View className="h-24 bg-gray-100 rounded-[32px] w-[48%] opacity-50" />
              </View>
            </View>
            <View className="flex-row justify-center py-4">
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text className="text-text-secondary font-body ml-2">{t('result.analyzing') || "Analyse en cours..."}</Text>
            </View>
          </View>
        ) : error ? (
          <View className="py-12 px-6 items-center justify-center bg-gray-50 rounded-[32px] border border-gray-100 mx-1">
            <Bot size={48} color="#9CA3AF" className="mb-4" />
            <Text className="text-text-primary font-display font-bold text-xl text-center mb-2">Modèle rare ou introuvable</Text>
            <Text className="text-text-secondary font-body text-center px-2 leading-6 mb-6">
              Ce modèle ({params.brand} {params.model}) est rare ou en cours d'analyse par notre algorithme. Laissez votre contact pour recevoir une alerte dès que sa cote est disponible.
            </Text>
            {showNotificationForm ? (
              <View className="w-full">
                <TextInput
                  placeholder="Votre Email ou Numéro"
                  className="bg-white rounded-2xl px-4 py-3 mb-3 border border-gray-200 font-body"
                  value={contactInfo}
                  onChangeText={setContactInfo}
                />
                <TouchableOpacity 
                  onPress={handleSubmitNotification}
                  className="bg-primary py-3 rounded-2xl items-center"
                >
                  <Text className="text-white font-body font-bold">{notificationSubmitted ? "Bien reçu !" : "M'alerter"}</Text>
                </TouchableOpacity>
                <Text className="text-gray-400 font-body text-[10px] text-center mt-3">
                  🔒 Votre contact est 100% privé et ne sera utilisé que par notre robot pour l'alerte.
                </Text>
              </View>
            ) : (
              <TouchableOpacity 
                onPress={() => setShowNotificationForm(true)}
                className="bg-primary px-8 py-3.5 rounded-2xl"
              >
                <Text className="text-white font-body font-bold">Me notifier</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : results ? (
          <View className="pb-20">
            {results.confiance === 'faible' && (
              <View className="bg-[#00B89A]/5 border border-[#00B89A]/15 p-6 rounded-[32px] mb-8">
                <View className={`flex-row items-center mb-4 ${I18nManager.isRTL ? 'flex-row-reverse' : ''}`}>
                  <Shield size={24} color="#00B89A" />
                  <Text className={`text-primary font-display font-bold text-xl font-serif ${I18nManager.isRTL ? 'mr-3' : 'ml-3'}`}>{t('result.reference_cote')}</Text>
                </View>
                
                <Text className={`text-text-secondary font-body text-sm leading-5 mb-6 ${I18nManager.isRTL ? 'text-right' : 'text-left'}`}>
                  {t('result.reference_desc')}
                </Text>

                {showNotificationForm ? (
                  <View className="bg-white/90 p-5 rounded-2xl border border-primary/10 items-center shadow-sm">
                    <View className="bg-[#00B89A]/10 p-3 rounded-full mb-3 border border-[#00B89A]/20">
                      <Sparkles size={24} color="#00B89A" />
                    </View>
                    <Text className="text-primary font-display font-bold text-center text-base">{t('result.price_alerts')}</Text>
                    <View className="bg-[#00B89A]/10 border border-[#00B89A]/20 px-3 py-1 rounded-full mt-1.5 mb-2.5">
                      <Text className="text-primary font-body font-bold text-[10px] uppercase tracking-wider">{t('result.coming_soon')}</Text>
                    </View>
                    <Text className="text-text-secondary font-body text-xs text-center leading-5 px-2">
                      {t('result.notification_desc')}
                    </Text>
                    <TouchableOpacity 
                      onPress={() => setShowNotificationForm(false)}
                      activeOpacity={0.8}
                      className="mt-4 bg-primary px-6 py-2.5 rounded-xl"
                    >
                      <Text className="text-white font-body font-bold text-xs">{t('result.close')}</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => setShowNotificationForm(true)}
                    className="bg-primary py-4 rounded-2xl items-center shadow-sm"
                    activeOpacity={0.8}
                  >
                    <Text className="text-white font-body font-bold">{t('result.notify_me')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Price Main Section */}
            <View className="mb-8">
              <View className={`flex-row items-center justify-between mb-4 px-1 ${I18nManager.isRTL ? 'flex-row-reverse' : ''}`}>
                <View className={`flex-row items-center ${I18nManager.isRTL ? 'flex-row-reverse' : ''}`}>
                  <Clock size={12} color="#6B6B6B" />
                  <Text className={`text-text-secondary font-body text-[10px] uppercase tracking-widest ${I18nManager.isRTL ? 'mr-1' : 'ml-1'}`}>
                    {t('result.updated_2h')}
                  </Text>
                </View>
                <View className="bg-primary/5 px-2 py-0.5 rounded-full">
                  <Text className="text-primary text-[9px] font-bold uppercase tracking-widest">{t('result.real_time')}</Text>
                </View>
              </View>

              <PriceCard label={t('result.recommended_price')} price={results.prix_estime || 0} isMain />
              
              <View className={`flex-row justify-between mt-4 ${I18nManager.isRTL ? 'flex-row-reverse' : ''}`}>
                <View className="w-[48%]">
                  <PriceCard label={t('result.low_range')} price={results.fourchette_min || 0} />
                </View>
                <View className="w-[48%]">
                  <PriceCard label={t('result.high_range')} price={results.fourchette_max || 0} />
                </View>
              </View>

              <View className="mt-5 bg-blue-50/80 px-4 py-3.5 rounded-2xl border border-blue-100 flex-row items-center">
                <Text className="text-xl mr-3">💡</Text>
                <View className="flex-1">
                  <Text className={`text-blue-900 font-display font-bold text-sm mb-0.5 ${I18nManager.isRTL ? 'text-right' : 'text-left'}`}>Pourquoi ce prix ?</Text>
                  <Text className={`text-blue-800/80 font-body text-xs leading-4 ${I18nManager.isRTL ? 'text-right' : 'text-left'}`}>
                    C'est une moyenne du marché réel (ventes confirmées), sans la marge de "gonflage" habituelle des annonces en ligne.
                  </Text>
                </View>
              </View>
            </View>

            {/* Évaluation Globale Section */}
            {results && (
              <View className="mb-8">
                <View className={`flex-row items-center justify-between mb-4 ${I18nManager.isRTL ? 'flex-row-reverse' : ''}`}>
                  <Text className="text-text-primary font-display font-bold text-xl">{t('result.global_eval')}</Text>
                  <View className="bg-primary px-3 py-1 rounded-lg">
                    <Text className="text-white font-display font-bold">{results.score_justification}/100</Text>
                  </View>
                </View>

                {/* [Défi 2] Alertes choc de marché — style orange distinct des alertes physiques */}
                {results.alertes && results.alertes.some(a => a.includes('Choc de marché') || a.includes('📈') || a.includes('📉')) && (
                  <View className="bg-orange-50 border border-orange-200 p-4 rounded-2xl mb-3">
                    <View className="flex-row items-center mb-2">
                      <Text className="text-orange-800 font-display font-bold text-sm">🚨 Volatility Alert — Marché en Mouvement</Text>
                    </View>
                    {results.alertes.filter(a => a.includes('Choc de marché') || a.includes('📈') || a.includes('📉')).map((alerte, idx) => (
                      <View key={idx} className={`flex-row items-start mt-1 ${I18nManager.isRTL ? 'flex-row-reverse' : ''}`}>
                        <Text className={`text-orange-800 font-body text-xs flex-1 ${I18nManager.isRTL ? 'text-right' : 'text-left'}`}>{alerte}</Text>
                      </View>
                    ))}
                    <Text className="text-orange-600 font-body text-[10px] mt-2 italic">
                      Les estimations intègrent automatiquement ces variations. La fourchette peut être plus large que d'habitude.
                    </Text>
                  </View>
                )}

                {/* Alertes physiques (kilométrage, etc.) — style rouge */}
                {results.alertes && results.alertes.some(a => !a.includes('Choc de marché') && !a.includes('📈') && !a.includes('📉')) && (
                  <View className="bg-red-50 border border-red-100 p-4 rounded-2xl mb-4">
                    {results.alertes.filter(a => !a.includes('Choc de marché') && !a.includes('📈') && !a.includes('📉')).map((alerte, idx) => (
                      <View key={idx} className={`flex-row items-start mb-2 ${I18nManager.isRTL ? 'flex-row-reverse' : ''}`}>
                        <Shield size={16} color="#991B1B" />
                        <Text className={`text-red-800 font-body text-xs flex-1 ${I18nManager.isRTL ? 'mr-2 text-right' : 'ml-2 text-left'}`}>{alerte}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Factors List */}
                <View className="flex flex-col gap-3">
                  {results.facteurs.map((facteur, idx) => (
                    <View key={idx} className={`bg-white p-4 rounded-2xl border border-gray-100 flex-row items-center shadow-sm ${I18nManager.isRTL ? 'flex-row-reverse' : ''}`}>
                      <View className={`w-2 h-10 rounded-full ${I18nManager.isRTL ? 'ml-4' : 'mr-4'} ${
                        facteur.impact === 'positif' ? 'bg-green-500' : 
                        facteur.impact === 'negatif' ? 'bg-red-500' : 'bg-gray-300'
                      }`} />
                      <View className="flex-1">
                        <View className={`flex-row items-center justify-between ${I18nManager.isRTL ? 'flex-row-reverse' : ''}`}>
                          <Text className={`text-text-primary font-bold text-sm ${I18nManager.isRTL ? 'text-right' : 'text-left'}`}>{facteur.nom || (facteur as any).facteur}</Text>
                          {facteur.poids && (
                            <Text className="text-text-secondary text-[10px] uppercase font-bold tracking-tight">{t('result.weight')} {facteur.poids}</Text>
                          )}
                        </View>
                        <Text className={`text-text-secondary font-body text-xs mt-1 ${I18nManager.isRTL ? 'text-right' : 'text-left'}`} numberOfLines={2}>
                          {facteur.explication}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Advice Card */}
                <View className="bg-primary/5 p-6 rounded-[32px] border border-primary/10 mt-6">
                  <View className={`flex-row items-center mb-3 ${I18nManager.isRTL ? 'flex-row-reverse' : ''}`}>
                    <Bot size={20} color={Colors.primary} />
                    <Text className={`text-primary font-display font-bold text-lg ${I18nManager.isRTL ? 'mr-2' : 'ml-2'}`}>{t('result.negotiation_advice')}</Text>
                  </View>
                  <Text className={`text-text-primary font-body text-sm leading-6 ${I18nManager.isRTL ? 'text-right' : 'text-left'}`}>
                    {results.conseil_negociation}
                  </Text>
                </View>
              </View>
            )}

            {/* Import Option Section */}
            {results.import_option?.disponible && (
              <View className="bg-indigo-50 border border-indigo-100 p-6 rounded-[32px] mb-8">
                <View className={`flex-row items-center mb-3 ${I18nManager.isRTL ? 'flex-row-reverse' : ''}`}>
                  <Globe size={24} color="#4338CA" />
                  <Text className={`text-indigo-900 font-display font-bold text-xl ${I18nManager.isRTL ? 'mr-3' : 'ml-3'}`}>{t('result.import_option')}</Text>
                </View>
                <Text className={`text-indigo-800 font-body text-sm leading-5 mb-4 ${I18nManager.isRTL ? 'text-right' : 'text-left'}`}>
                  {results.import_option.details}
                </Text>
                {results.import_option.prix_total_estime && (
                  <View className="bg-white p-4 rounded-2xl items-center shadow-sm">
                    <Text className="text-indigo-900 font-display font-bold text-2xl">
                      {results.import_option.prix_total_estime.toLocaleString()} DZD
                    </Text>
                    <Text className="text-indigo-500 font-body text-[10px] uppercase font-bold mt-1">{t('result.total_landed_cost')}</Text>
                  </View>
                )}
              </View>
            )}


            {/* Actions */}
            <View className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
              <Text className={`text-text-primary font-body font-bold mb-6 text-lg ${I18nManager.isRTL ? 'text-right' : 'text-left'}`}>{t('result.expert_actions')}</Text>
              
              <View className="flex flex-col gap-4">
                <TouchableOpacity
                  onPress={() => router.push({
                    pathname: '/transaction',
                    params: { ...params }
                  })}
                  className={`bg-primary p-5 rounded-2xl flex-row items-center ${I18nManager.isRTL ? 'flex-row-reverse' : ''}`}
                >
                  <FileText size={20} color="white" />
                  <Text className={`text-white font-body font-bold flex-1 text-base ${I18nManager.isRTL ? 'mr-3 text-right' : 'ml-3 text-left'}`}>{t('result.sell_vehicle')}</Text>
                  {I18nManager.isRTL ? <ChevronLeft size={18} color="white" /> : <ChevronRight size={18} color="white" />}
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={handleShare}
                  className={`bg-accent p-5 rounded-2xl flex-row items-center ${I18nManager.isRTL ? 'flex-row-reverse' : ''}`}
                >
                  <Share2 size={20} color={Colors.primary} />
                  <Text className={`text-primary font-body font-bold flex-1 text-base ${I18nManager.isRTL ? 'mr-3 text-right' : 'ml-3 text-left'}`}>{t('result.share_expertise')}</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View className="mt-10 px-6">
              <Text className="text-text-secondary text-[11px] font-body text-center leading-5 mb-2">
                Les prix indiqués sont des estimations basées sur le marché actuel. Une marge de négociation standard de 5 à 10 % est conseillée.
              </Text>
              <Text className="text-gray-400 text-[10px] font-body text-center leading-4">
                {t('result.disclaimer')}
              </Text>
            </View>
            {/* Hidden card for dynamic PNG generation & sharing */}
            <View style={{ position: 'absolute', top: -9999, left: -9999, width: 380 }}>
              <ShareCard ref={cardRef} data={coteData} />
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function SourceBadge({ label, count, icon, highlight }: { label: string, count: number, icon: string, highlight?: boolean }) {
  const Icon = icon === 'globe' ? Globe : 
               icon === 'check-circle' ? CheckCircle : 
               icon === 'shield' ? Shield : Database;
  
  return (
    <View className={`flex-row items-center rounded-full px-3 py-1.5 mr-2 mb-2 ${highlight ? 'bg-primary' : 'bg-gray-50 border border-gray-100'}`}>
      <Icon size={12} color={highlight ? 'white' : '#6B6B6B'} />
      <Text className={`ml-1.5 font-body text-[10px] font-bold ${highlight ? 'text-white' : 'text-text-primary'}`}>
        {count > 0 ? `${count} ` : ''}{label}
      </Text>
    </View>
  );
}
