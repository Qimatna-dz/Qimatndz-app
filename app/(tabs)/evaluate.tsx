import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Dimensions, I18nManager } from 'react-native';
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
    engine: 'bon' as 'neuf' | 'bon' | 'fatigue',
    fuel: 'essence' as 'essence' | 'diesel' | 'gpl' | 'hybride',
    engine_details: '',
    trim_details: '',
    wilaya: '',
    trim: undefined as string | undefined,
    document_status: 'safia' as 'safia' | 'licence_delai',
    transmission: 'manuelle' as 'manuelle' | 'automatique',
  });

  const handleEvaluate = () => {
    if (!form.brand || !form.model) {
      alert(t('evaluate.error_model'));
      return;
    }
    const yearNum = Number(form.year);
    if (!form.year || isNaN(yearNum) || yearNum < 1980 || yearNum > new Date().getFullYear()) {
      alert(t('evaluate.error_year'));
      return;
    }
    if (!form.mileage || isNaN(Number(form.mileage))) {
      alert(t('evaluate.error_mileage'));
      return;
    }
    router.push({
      pathname: '/result',
      params: form,
    });
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
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
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
                    <Text className={`text-text-secondary font-body text-xs uppercase tracking-widest mb-3 mx-1 ${I18nManager.isRTL ? 'text-right' : 'text-left'}`}>
                      {t('evaluate.year')}
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
                        placeholder="85000"
                        placeholderTextColor="#9CA3AF"
                        style={{ outlineStyle: 'none', minWidth: 0, textAlign: I18nManager.isRTL ? 'right' : 'left' } as any}
                        keyboardType="numeric"
                        className="flex-1 font-body text-text-primary text-sm"
                        value={form.mileage}
                        onChangeText={(t) => setForm({ ...form, mileage: t })}
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
              activeOpacity={0.85}
              className={`bg-accent py-6 rounded-[28px] items-center shadow-2xl shadow-accent/40 flex-row justify-center ${I18nManager.isRTL ? 'flex-row-reverse' : ''}`}
            >
              <Text className={`text-primary text-2xl font-body font-bold ${I18nManager.isRTL ? 'ml-2' : 'mr-2'}`}>
                {t('evaluate.calculate')}
              </Text>
              {I18nManager.isRTL ? <ChevronLeft size={24} color={Colors.primary} /> : <ChevronRight size={24} color={Colors.primary} />}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
