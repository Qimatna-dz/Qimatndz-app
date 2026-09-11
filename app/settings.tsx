import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Platform, Modal, I18nManager, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Bell, Globe, Shield, FileText, Info, Trash2, X, Bot, Check } from 'lucide-react-native';
import { Colors } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import { setLanguage } from '../lib/i18n';

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [notifications, setNotifications] = React.useState(true);
  const [hasSession, setHasSession] = React.useState(false);
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'about' | 'language' | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
    });
  }, []);

  const handleChangeLanguage = async (lang: 'fr' | 'ar') => {
    const isDirectionChanging = (lang === 'ar') !== I18nManager.isRTL;
    await setLanguage(lang);
    setActiveModal(null);
    
    if (isDirectionChanging) {
      if (Platform.OS === 'web') {
        window.location.reload();
      } else {
        Alert.alert(
          'Redémarrage requis',
          'Veuillez redémarrer l\'application pour appliquer la nouvelle direction de texte (RTL/LTR).',
          [{ text: 'OK' }]
        );
      }
    }
  };

  return (
    <ScrollView className="flex-1 bg-[#F8F7F4]">
      <Stack.Screen options={{
        title: t('settings.title'),
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')} className="ml-4">
            {I18nManager.isRTL ? <ChevronRight size={24} color="#1A1A1A" /> : <ChevronLeft size={24} color="#1A1A1A" />}
          </TouchableOpacity>
        )
      }} />

      <View className="p-6">
        {/* Account Section */}
        <Text className="text-text-secondary font-body text-xs uppercase tracking-widest mb-4 ml-2">Préférences</Text>
        
        <View className="bg-white rounded-[32px] overflow-hidden border border-gray-50 mb-8">
          <SettingItem 
            icon={Bell} 
            title="Notifications" 
            right={<Switch value={notifications} onValueChange={setNotifications} trackColor={{ true: Colors.primary }} />}
          />
          <SettingItem 
            icon={Globe} 
            title={t('settings.language')} 
            value={i18n.language === 'ar' ? t('settings.arabic') : t('settings.french')}
            onPress={() => setActiveModal('language')}
          />
        </View>

        {/* Legal Section */}
        <Text className="text-text-secondary font-body text-xs uppercase tracking-widest mb-4 ml-2">Légal & Support</Text>
        
        <View className="bg-white rounded-[32px] overflow-hidden border border-gray-50 mb-8">
          <SettingItem 
            icon={Shield} 
            title="Confidentialité" 
            onPress={() => setActiveModal('privacy')}
          />
          <SettingItem 
            icon={FileText} 
            title="Conditions d'utilisation" 
            onPress={() => setActiveModal('terms')}
          />
          <SettingItem 
            icon={Info} 
            title="À propos de QimatnaDz" 
            value="v1.0.0"
            onPress={() => setActiveModal('about')}
          />
        </View>

        {/* Danger Zone (Visible only for authenticated users) */}
        {hasSession && (
          <>
            <Text className="text-red-500 font-body text-xs uppercase tracking-widest mb-4 ml-2">Zone de danger</Text>
            
            <View className="bg-white rounded-[32px] overflow-hidden border border-red-50 mb-8">
              <SettingItem 
                icon={Trash2} 
                title="Supprimer mon compte" 
                color="#EF4444"
                onPress={() => alert('Action irréversible. Contactez le support.')}
                isLast
              />
            </View>
          </>
        )}

        <View className="items-center py-8">
          <Text className="text-gray-300 font-body text-[10px]">QIMATNADZ — FABRIQUÉ AVEC ❤️ EN ALGÉRIE</Text>
        </View>
      </View>

      {/* Premium Content Modal */}
      <Modal
        visible={activeModal !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setActiveModal(null)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-[#F8F7F4] rounded-t-[40px] h-[80%] p-6 border-t border-gray-200">
            {/* Header */}
            <View className="flex-row justify-between items-center pb-4 mb-6 border-b border-gray-200">
              <Text className={`text-text-primary font-display font-bold text-xl ${I18nManager.isRTL ? 'text-right' : ''}`}>
                {activeModal === 'privacy' && 'Politique de Confidentialité'}
                {activeModal === 'terms' && "Conditions d'Utilisation"}
                {activeModal === 'about' && 'À propos de QimatnaDz'}
                {activeModal === 'language' && t('settings.language')}
              </Text>
              <TouchableOpacity 
                onPress={() => setActiveModal(null)}
                className="bg-gray-200/50 p-2 rounded-full"
              >
                <X size={20} color="#1A1A1A" />
              </TouchableOpacity>
            </View>

            {/* Scrollable Content */}
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              
              {activeModal === 'language' && (
                <View className="pb-8 flex flex-col gap-4">
                  <TouchableOpacity 
                    className="bg-white p-5 rounded-2xl border border-gray-100 flex-row items-center justify-between"
                    onPress={() => handleChangeLanguage('fr')}
                  >
                    <Text className="text-text-primary font-body font-bold text-base">{t('settings.french')}</Text>
                    {i18n.language === 'fr' && <Check size={20} color={Colors.primary} />}
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    className="bg-white p-5 rounded-2xl border border-gray-100 flex-row items-center justify-between"
                    onPress={() => handleChangeLanguage('ar')}
                  >
                    <Text className="text-text-primary font-body font-bold text-base">{t('settings.arabic')}</Text>
                    {i18n.language === 'ar' && <Check size={20} color={Colors.primary} />}
                  </TouchableOpacity>
                </View>
              )}

              {activeModal === 'privacy' && (
                <View className="pb-8 flex flex-col gap-6">
                  <Text className="text-text-primary font-body text-sm leading-6">
                    Chez <Text className="font-bold text-primary">Qimatna Dz</Text>, nous accordons une importance capitale à la protection de vos données privées. Cette politique a pour but de vous expliquer en toute transparence quelles données nous traitons et comment nous les protégeons.
                  </Text>
                  
                  <View className="bg-white p-5 rounded-2xl border border-gray-100">
                    <Text className="text-primary font-display font-bold text-sm mb-2">1. Estimation Anonyme</Text>
                    <Text className="text-text-secondary font-body text-xs leading-5">
                      Toutes les fonctionnalités de base d'estimation de cote automobile sont entièrement gratuites et accessibles sans création de compte. Vos recherches de cotes (marque, modèle, kilométrage) restent strictement anonymes et servent uniquement à enrichir l'intelligence de calcul du marché automobile algérien.
                    </Text>
                  </View>

                  <View className="bg-white p-5 rounded-2xl border border-gray-100">
                    <Text className="text-primary font-display font-bold text-sm mb-2">2. Captures de Leads & Demandes de Veille</Text>
                    <Text className="text-text-secondary font-body text-xs leading-5">
                      Si vous utilisez la fonction "Me prévenir des mises à jour" pour un véhicule récent ou rare, nous vous demandons votre numéro WhatsApp ou adresse e-mail. Ces informations ne sont collectées qu'avec votre consentement explicite et sont uniquement utilisées pour vous notifier des évolutions de cotes. Elles ne seront jamais revendues ou louées à des tiers.
                    </Text>
                  </View>

                  <View className="bg-white p-5 rounded-2xl border border-gray-100">
                    <Text className="text-primary font-display font-bold text-sm mb-2">3. Sécurité des Données</Text>
                    <Text className="text-text-secondary font-body text-xs leading-5">
                      Vos données de profil, historiques d'évaluation et demandes d'alertes sont hébergées de manière ultra-sécurisée via notre fournisseur cloud de confiance Supabase. Tous les flux de communication sont chiffrés via les protocoles TLS/SSL standards de l'industrie.
                    </Text>
                  </View>
                </View>
              )}

              {activeModal === 'terms' && (
                <View className="pb-8 flex flex-col gap-6">
                  <Text className="text-text-primary font-body text-sm leading-6">
                    Bienvenue sur <Text className="font-bold text-primary">Qimatna Dz</Text>. L'accès et l'utilisation de notre application mobile sont soumis aux conditions d'utilisation décrites ci-dessous.
                  </Text>
                  
                  <View className="bg-white p-5 rounded-2xl border border-gray-100">
                    <Text className="text-primary font-display font-bold text-sm mb-2">1. Nature de l'Estimation</Text>
                    <Text className="text-text-secondary font-body text-xs leading-5">
                      Qimatna Dz est un outil d'estimation de prix indicatif de véhicules d'occasion et neufs sur le marché algérien. Les cotes fournies sont issues de modèles statistiques avancés analysant le marché en temps réel. Elles ne constituent en aucun cas une expertise technique obligatoire ou une offre contractuelle d'achat ou de vente.
                    </Text>
                  </View>

                  <View className="bg-white p-5 rounded-2xl border border-gray-100">
                    <Text className="text-primary font-display font-bold text-sm mb-2">2. Limites de Responsabilité</Text>
                    <Text className="text-text-secondary font-body text-xs leading-5">
                      Le marché automobile algérien est soumis à de fortes fluctuations (taux de change parallèle "Square", régulations des importations, disponibilité physique). Qimatna Dz s'efforce de fournir les cotes les plus précises possibles, mais ne peut être tenu responsable des pertes financières, litiges ou erreurs de négociation survenant lors d'une transaction finale entre acheteurs et vendeurs.
                    </Text>
                  </View>

                  <View className="bg-white p-5 rounded-2xl border border-gray-100">
                    <Text className="text-primary font-display font-bold text-sm mb-2">3. Propriété Intellectuelle</Text>
                    <Text className="text-text-secondary font-body text-xs leading-5">
                      L'algorithme de calcul, les modèles de scraping de données, le code source de l'application, les graphiques et le design visuel sont la propriété exclusive et intellectuelle de Qimatna Dz. Toute reproduction, exploitation ou revente non autorisée est strictement interdite.
                    </Text>
                  </View>
                </View>
              )}

              {activeModal === 'about' && (
                <View className="pb-8 flex flex-col gap-6">
                  <View className="items-center mb-6">
                    <View className="bg-primary/10 w-24 h-24 rounded-[32px] items-center justify-center mb-4">
                      <Bot size={48} color={Colors.primary} />
                    </View>
                    <Text className="text-text-primary font-display font-bold text-2xl text-center">Qimatna Dz</Text>
                    <Text className="text-primary font-body text-xs mt-1 uppercase tracking-widest font-bold text-center">L'Argus Intelligent Algérien</Text>
                    <Text className="text-text-secondary font-body text-[10px] mt-1 text-center">Version 1.0.0 (MVP)</Text>
                  </View>
                  
                  <Text className="text-text-primary font-body text-sm leading-6 text-center px-4">
                    Notre mission est de digitaliser et d'apporter une transparence totale sur le marché automobile en Algérie grâce à la puissance combinée du traitement des données réelles et de l'intelligence artificielle.
                  </Text>

                  <View className="bg-white p-5 rounded-2xl border border-gray-100 mt-4">
                    <Text className="text-primary font-display font-bold text-sm mb-2">🤖 Une Architecture Hybride Unique</Text>
                    <Text className="text-text-secondary font-body text-xs leading-5">
                      Qimatna Dz scanne quotidiennement des dizaines de milliers d'annonces de vente actives, croise les transactions réelles déclarées en Algérie, intègre le taux de change du marché parallèle ("Square") et utilise un moteur d'IA de pointe pour calculer instantanément la vraie valeur de votre véhicule selon 3 axes : sa condition mécanique, sa peinture/carrosserie et son kilométrage exact.
                    </Text>
                  </View>

                  <View className="bg-white p-5 rounded-2xl border border-gray-100 mt-4 items-center">
                    <Text className="text-primary font-display font-bold text-xs">🇩🇿 Fabriqué avec ❤️ en Algérie pour le marché local</Text>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function SettingItem({ icon: Icon, title, value, right, onPress, color, isLast }: any) {
  return (
    <TouchableOpacity 
      onPress={onPress}
      disabled={!onPress}
      className={`p-5 flex-row items-center justify-between border-b border-gray-50 ${isLast ? 'border-b-0' : ''}`}
    >
      <View className="flex-row items-center flex-1">
        <View className={`${color ? 'bg-red-50' : 'bg-gray-50'} p-2 rounded-xl mr-4`}>
          <Icon size={18} color={color || Colors.primary} />
        </View>
        <Text className={`font-body font-bold text-sm ${color ? 'text-red-500' : 'text-text-primary'}`}>{title}</Text>
      </View>
      
      <View className="flex-row items-center">
        {value && <Text className="text-text-secondary font-body text-xs mr-2">{value}</Text>}
        {right || (onPress && (I18nManager.isRTL ? <ChevronRight size={16} color="#D1D5DB" /> : <ChevronLeft size={16} color="#D1D5DB" style={{ transform: [{ rotate: '180deg' }] }} />))}
      </View>
    </TouchableOpacity>
  );
}
