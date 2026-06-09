import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Dimensions, I18nManager, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { 
  ChevronRight,
  ChevronLeft,
  ShieldCheck, 
  Sparkles, 
  Paintbrush, 
  Zap, 
  CheckCircle2, 
  AlertTriangle,
  MapPin,
  Car
} from 'lucide-react-native';

import { BrandPicker } from '../../components/BrandPicker';
import { ConditionSelector } from '../../components/ConditionSelector';
import { WilayaPicker } from '../../components/WilayaPicker';
import { Colors } from '../../constants/theme';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

export default function EvaluateScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [form, setForm] = useState({
    brand: '',
    model: '',
    year: '',
    mileage: '',
    condition: 'bon',
    paint: 'origine',
    engine: 'bon' as 'neuf' | 'bon' | 'fatigue' | 'swappe',
    fuel: 'essence' as 'essence' | 'diesel' | 'gpl' | 'hybride',
    engine_details: '',
    trim_details: '',
    wilaya: '',
    trim: undefined as string | undefined,
    document_status: 'safia' as 'safia' | 'licence_delai',
    transmission: 'manuelle' as 'manuelle' | 'automatique',
    is_gulf_spec: false,
    has_aftermarket: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleMileageChange = (text: string) => {
    const rawValue = text.replace(/[^0-9]/g, '');
    if (rawValue) {
      const formattedValue = parseInt(rawValue, 10).toLocaleString('fr-FR');
      setForm({ ...form, mileage: formattedValue });
    } else {
      setForm({ ...form, mileage: '' });
    }
  };

  const handleEvaluate = () => {
    if (isSubmitting) return;

    if (!form.brand || !form.model) {
      alert(t('evaluate.error_model'));
      return;
    }
    const yearNum = Number(form.year);
    if (!form.year || isNaN(yearNum) || yearNum < 1980 || yearNum > new Date().getFullYear()) {
      alert(t('evaluate.error_year'));
      return;
    }
    
    const rawMileage = form.mileage.replace(/[^0-9]/g, '');
    if (!rawMileage || isNaN(Number(rawMileage))) {
      alert(t('evaluate.error_mileage'));
      return;
    }

    setIsSubmitting(true);
    
    router.push({
      pathname: '/result',
      params: {
        ...form,
        mileage: rawMileage,
        is_gulf_spec: form.is_gulf_spec ? 'true' : 'false',
        has_aftermarket: form.has_aftermarket ? 'true' : 'false',
      },
    });

    setTimeout(() => setIsSubmitting(false), 1000);
  };

  const SelectionChip = ({ id, label, icon: Icon, selected, onSelect, color = Colors.primary }: any) => (
    <TouchableOpacity
      onPress={() => onSelect(id)}
      activeOpacity={0.7}
      style={{ 
        backgroundColor: selected ? color : '#F9FAFB',
        borderColor: selected ? color : '#F3F4F6',
      }}
      className={`flex-row items-center px-4 py-3.5 rounded-[20px] border mb-2 ${I18nManager.isRTL ? 'ml-2' : 'mr-2'}`}
    >
      <Icon size={16} color={selected ? '#FFFFFF' : '#6B7280'} />
      <Text 
        className={`font-body text-[13px] ${selected ? 'text-white font-bold' : 'text-text-primary'} ${I18nManager.isRTL ? 'mr-2' : 'ml-2'}`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar style="dark" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View className="px-6 pt-8 pb-32">
          <View className={`mb-10 ${I18nManager.isRTL ? 'items-end' : 'items-start'}`}>
            <Text className="text-primary text-5xl font-display font-bold">{t('evaluate.title')}</Text>
            <Text className="text-text-secondary font-body mt-2 text-lg">{t('evaluate.subtitle')}</Text>
          </View>

          <View className="flex flex-col gap-6">
            {/* Section: Véhicule */}
            <View className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-50">
              <View className={`flex-row items-center mb-6 ${I18nManager.isRTL ? 'flex-row-reverse' : ''}`}>
                <View className={`bg-primary/5 p-2 rounded-xl ${I18nManager.isRTL ? 'ml-3' : 'mr-3'}`}>
                  <Car size={22} color={Colors.primary} />
                </View>
                <Text className="text-text-primary font-display font-bold text-xl">{t('evaluate.vehicle_details')}</Text>
              </View>

              <View className="flex flex-col gap-5">
                <View>
                  <Text className={`text-text-secondary font-body text-xs uppercase tracking-widest mb-3 mx-1 ${I18nManager.isRTL ? 'text-right' : 'text-left'}`}>
                    {t('evaluate.brand_model')}
                  </Text>
                  <BrandPicker 
                    selectedBrand={form.brand}
                    selectedModel={form.model}
                    selectedTrim={form.trim}
                    onSelect={(b, m, t) => setForm({ ...form, brand: b, model: m, trim: t || undefined })}
                  />
                </View>

                <View className={`flex-row justify-between ${I18nManager.isRTL ? 'flex-row-reverse' : ''}`}>
                  <View className="w-[48%]">
                    <Text className={`text-text-secondary font-body text-xs uppercase tracking-widest mb-3 mx-1 ${I18nManager.isRTL ? 'text-right' : 'text-left'}`}>
                      {t('evaluate.engine')}
                    </Text>
                    <TextInput 
                      placeholder="ex: 1.6 TDI"
                      placeholderTextColor="#9CA3AF"
                      style={{ outlineStyle: 'none', textAlign: I18nManager.isRTL ? 'right' : 'left' } as any}
                      className="bg-gray-50 rounded-2xl px-3 py-3.5 font-body text-text-primary text-sm border border-gray-100"
                      value={form.engine_details}
                      onChangeText={(t) => setForm({ ...form, engine_details: t })}
                    />
                  </View>
                  <View className="w-[48%]">
                    <Text className={`text-text-secondary font-body text-xs uppercase tracking-widest mb-3 mx-1 ${I18nManager.isRTL ? 'text-right' : 'text-left'}`}>
                      {t('evaluate.trim')}
                    </Text>
                    <TextInput 
                      placeholder="ex: Limited"
                      placeholderTextColor="#9CA3AF"
                      style={{ outlineStyle: 'none', textAlign: I18nManager.isRTL ? 'right' : 'left' } as any}
                      className="bg-gray-50 rounded-2xl px-3 py-3.5 font-body text-text-primary text-sm border border-gray-100"
                      value={form.trim_details}
                      onChangeText={(t) => setForm({ ...form, trim_details: t })}
                    />
                  </View>
                </View>

                <View className={`flex-row justify-between ${I18nManager.isRTL ? 'flex-row-reverse' : ''}`}>
                  <View className="w-[48%]">
                    <Text className={`text-text-secondary font-body text-xs uppercase tracking-widest mb-1 mx-1 ${I18nManager.isRTL ? 'text-right' : 'text-left'}`}>
                      {t('evaluate.year')}
                    </Text>
                    <Text className={`text-gray-400 font-body text-[9px] mb-2 mx-1 ${I18nManager.isRTL ? 'text-right' : 'text-left'}`}>
                      Année de fabrication
                    </Text>
                    <TextInput 
                      placeholder="2020"
                      placeholderTextColor="#9CA3AF"
                      style={{ outlineStyle: 'none', textAlign: I18nManager.isRTL ? 'right' : 'left' } as any}
                      keyboardType="numeric"
                      maxLength={4}
                      className="bg-gray-50 rounded-2xl px-3 py-3.5 font-body text-text-primary text-sm border border-gray-100"
                      value={form.year}
                      onChangeText={(t) => setForm({ ...form, year: t })}
                    />
                  </View>
                  <View className="w-[48%]">
                    <Text className={`text-text-secondary font-body text-xs uppercase tracking-widest mb-3 mx-1 ${I18nManager.isRTL ? 'text-right' : 'text-left'}`}>
                      {t('evaluate.mileage')}
                    </Text>
                    <View className={`bg-gray-50 rounded-2xl px-3 py-3.5 flex-row items-center border border-gray-100 ${I18nManager.isRTL ? 'flex-row-reverse' : ''}`}>
                      <TextInput 
                        placeholder="85 000"
                        placeholderTextColor="#9CA3AF"
                        style={{ outlineStyle: 'none', minWidth: 0, textAlign: I18nManager.isRTL ? 'right' : 'left' } as any}
                        keyboardType="number-pad"
                        className="flex-1 font-body text-text-primary text-sm"
                        value={form.mileage}
                        onChangeText={handleMileageChange}
                      />
                      <Text className={`text-text-secondary font-body text-[10px] ${I18nManager.isRTL ? 'mr-1' : 'ml-1'}`}>km</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Section: État */}
            <View className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-50">
              <View className={`flex-row items-center mb-6 ${I18nManager.isRTL ? 'flex-row-reverse' : ''}`}>
                <View className={`bg-primary/5 p-2 rounded-xl ${I18nManager.isRTL ? 'ml-3' : 'mr-3'}`}>
                  <ShieldCheck size={22} color={Colors.primary} />
                </View>
                <Text className="text-text-primary font-display font-bold text-xl">{t('evaluate.condition_body')}</Text>
              </View>

              <View className="flex flex-col gap-6">
                <View>
                  <Text className={`text-text-secondary font-body text-xs uppercase tracking-widest mb-4 mx-1 ${I18nManager.isRTL ? 'text-right' : 'text-left'}`}>
                    {t('evaluate.general_condition')}
                  </Text>
                  <ConditionSelector 
                    selected={form.condition}
                    onSelect={(id) => setForm({ ...form, condition: id as any })}
                  />
                </View>

                <View>
                  <Text className={`text-text-secondary font-body text-xs uppercase tracking-widest mb-4 mx-1 ${I18nManager.isRTL ? 'text-right' : 'text-left'}`}>
                    {t('evaluate.paint')}
                  </Text>
                  <View className={`flex-row flex-wrap ${I18nManager.isRTL ? 'flex-row-reverse' : ''}`}>
                    <SelectionChip 
                      id="origine" label={t('evaluate.paint_orig')} icon={Sparkles} 
                      selected={form.paint === 'origine'} onSelect={(id: any) => setForm({...form, paint: id})} 
                    />
                    <SelectionChip 
                      id="raccord" label={t('evaluate.paint_retouch')} icon={Paintbrush} 
                      selected={form.paint === 'raccord'} onSelect={(id: any) => setForm({...form, paint: id})} 
                    />
                    <SelectionChip 
                      id="repeinte" label={t('evaluate.paint_repaint')} icon={Paintbrush} 
                      selected={form.paint === 'repeinte'} onSelect={(id: any) => setForm({...form, paint: id})} 
                    />
                    <SelectionChip 
                      id="choc" label={t('evaluate.paint_crash')} icon={Zap} 
                      selected={form.paint === 'choc'} onSelect={(id: any) => setForm({...form, paint: id})} 
                    />
                  </View>
                  <View className={`mt-2 px-1 ${I18nManager.isRTL ? 'items-end' : 'items-start'}`}>
                    {form.paint === 'origine' && <Text className="text-gray-500 font-body text-[11px] leading-4">00 Sbigha : Aucune retouche, peinture d'usine.</Text>}
                    {form.paint === 'raccord' && <Text className="text-gray-500 font-body text-[11px] leading-4">Raccord : Petit raccord à froid ou retouche minime sans peinture majeure.</Text>}
                    {form.paint === 'repeinte' && <Text className="text-gray-500 font-body text-[11px] leading-4">Voile : Peinture refaite pour l'esthétique (rayures), sans choc.</Text>}
                    {form.paint === 'choc' && <Text className="text-gray-500 font-body text-[11px] leading-4">Choc réparé : Accident ayant touché la structure ou froissé la tôle.</Text>}
                  </View>
                </View>

                <View>
                  <Text className={`text-text-secondary font-body text-xs uppercase tracking-widest mb-4 mx-1 ${I18nManager.isRTL ? 'text-right' : 'text-left'}`}>
                    {t('evaluate.fuel')}
                  </Text>
                  <View className={`flex-row flex-wrap ${I18nManager.isRTL ? 'flex-row-reverse' : ''}`}>
                    <SelectionChip 
                      id="essence" label={t('evaluate.fuel_gas')} icon={Zap} 
                      selected={form.fuel === 'essence'} onSelect={(id: any) => setForm({...form, fuel: id})} 
                    />
                    <SelectionChip 
                      id="diesel" label={t('evaluate.fuel_diesel')} icon={Zap} 
                      selected={form.fuel === 'diesel'} onSelect={(id: any) => setForm({...form, fuel: id})} 
                    />
                    <SelectionChip 
                      id="gpl" label={t('evaluate.fuel_lpg')} icon={CheckCircle2} 
                      selected={form.fuel === 'gpl'} onSelect={(id: any) => setForm({...form, fuel: id})} 
                    />
                    <SelectionChip 
                      id="hybride" label={t('evaluate.fuel_hybrid')} icon={Sparkles} 
                      selected={form.fuel === 'hybride'} onSelect={(id: any) => setForm({...form, fuel: id})} 
                    />
                  </View>
                </View>

                <View>
                  <Text className={`text-text-secondary font-body text-xs uppercase tracking-widest mb-4 mx-1 ${I18nManager.isRTL ? 'text-right' : 'text-left'}`}>
                    {t('evaluate.engine_state')}
                  </Text>
                  <View className={`flex-row flex-wrap ${I18nManager.isRTL ? 'flex-row-reverse' : ''}`}>
                    <SelectionChip 
                      id="neuf" label={t('evaluate.engine_new')} icon={CheckCircle2} color="#059669"
                      selected={form.engine === 'neuf'} onSelect={(id: any) => setForm({...form, engine: id})} 
                    />
                    <SelectionChip 
                      id="bon" label={t('evaluate.engine_good')} icon={CheckCircle2} color="#059669"
                      selected={form.engine === 'bon'} onSelect={(id: any) => setForm({...form, engine: id})} 
                    />
                    <SelectionChip 
                      id="fatigue" label={t('evaluate.engine_bad')} icon={AlertTriangle} color="#D97706"
                      selected={form.engine === 'fatigue'} onSelect={(id: any) => setForm({...form, engine: id})} 
                    />
                    <SelectionChip 
                      id="swappe" label="Moteur Swappé / Changé" icon={AlertTriangle} color="#EA580C"
                      selected={form.engine === 'swappe'} onSelect={(id: any) => setForm({...form, engine: id})} 
                    />
                  </View>
                </View>

                <View>
                  <Text className={`text-text-secondary font-body text-xs uppercase tracking-widest mb-4 mx-1 ${I18nManager.isRTL ? 'text-right' : 'text-left'}`}>
                    {t('evaluate.transmission')}
                  </Text>
                  <View className={`flex-row flex-wrap ${I18nManager.isRTL ? 'flex-row-reverse' : ''}`}>
                    <SelectionChip 
                      id="manuelle" label={t('evaluate.trans_manual')} icon={CheckCircle2} 
                      selected={form.transmission === 'manuelle'} onSelect={(id: any) => setForm({...form, transmission: id})} 
                    />
                    <SelectionChip 
                      id="automatique" label={t('evaluate.trans_auto')} icon={Sparkles} color="#4F46E5"
                      selected={form.transmission === 'automatique'} onSelect={(id: any) => setForm({...form, transmission: id})} 
                    />
                  </View>
                </View>

                <View>
                  <Text className={`text-text-secondary font-body text-xs uppercase tracking-widest mb-4 mx-1 ${I18nManager.isRTL ? 'text-right' : 'text-left'}`}>
                    Équipements & Origine
                  </Text>
                  <View className={`flex-row flex-wrap ${I18nManager.isRTL ? 'flex-row-reverse' : ''}`}>
                    <SelectionChip 
                      id="gulf" label="Gulf Specs / Importé" icon={Sparkles} color="#00B89A"
                      selected={form.is_gulf_spec} onSelect={() => setForm({...form, is_gulf_spec: !form.is_gulf_spec})} 
                    />
                    <SelectionChip 
                      id="aftermarket" label="Accessoires ajoutés (Jantes...)" icon={Sparkles} color="#00B89A"
                      selected={form.has_aftermarket} onSelect={() => setForm({...form, has_aftermarket: !form.has_aftermarket})} 
                    />
                  </View>
                </View>

                <View className="mb-4">
                  <Text className={`text-text-secondary font-body text-xs uppercase tracking-widest mb-4 mx-1 ${I18nManager.isRTL ? 'text-right' : 'text-left'}`}>
                    {t('evaluate.documents')}
                  </Text>
                  <View className={`flex-row flex-wrap ${I18nManager.isRTL ? 'flex-row-reverse' : ''}`}>
                    <SelectionChip 
                      id="safia" label={t('evaluate.doc_safia')} icon={ShieldCheck} 
                      selected={form.document_status === 'safia'} onSelect={(id: any) => setForm({...form, document_status: id})} 
                    />
                    <SelectionChip 
                      id="licence_delai" label={t('evaluate.doc_licence')} icon={AlertTriangle} color="#D97706"
                      selected={form.document_status === 'licence_delai'} onSelect={(id: any) => setForm({...form, document_status: id})} 
                    />
                  </View>
                </View>

                <View>
                  <Text className={`text-text-secondary font-body text-xs uppercase tracking-widest mb-3 mx-1 ${I18nManager.isRTL ? 'text-right' : 'text-left'}`}>
                    {t('evaluate.wilaya')}
                  </Text>
                  <WilayaPicker 
                    selected={form.wilaya}
                    onSelect={(w) => setForm({ ...form, wilaya: w })}
                  />
                </View>
              </View>
            </View>

            <TouchableOpacity 
              onPress={handleEvaluate}
              disabled={isSubmitting}
              activeOpacity={0.85}
              className={`bg-accent py-6 rounded-[28px] items-center shadow-2xl shadow-accent/40 flex-row justify-center ${I18nManager.isRTL ? 'flex-row-reverse' : ''} ${isSubmitting ? 'opacity-70' : ''}`}
            >
              <Text allowFontScaling={false} className={`text-primary text-2xl font-body font-bold ${I18nManager.isRTL ? 'ml-2' : 'mr-2'}`}>
                {isSubmitting ? 'Calcul...' : t('evaluate.calculate')}
              </Text>
              {I18nManager.isRTL ? <ChevronLeft size={24} color={Colors.primary} /> : <ChevronRight size={24} color={Colors.primary} />}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>
  );
}
