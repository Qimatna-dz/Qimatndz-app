import React from 'react';
import { View, Text, Pressable, I18nManager } from 'react-native';
import { useTranslation } from 'react-i18next';

interface ConditionSelectorProps {
  selected: string;
  onSelect: (id: string) => void;
}

export function ConditionSelector({ selected, onSelect }: ConditionSelectorProps) {
  const { t } = useTranslation();

  const CONDITIONS = [
    { id: 'excellent', label: t('components.condition_excellent'), multiplier: 1.08, desc: t('components.condition_excellent_desc') },
    { id: 'bon', label: t('components.condition_good'), multiplier: 1.00, desc: t('components.condition_good_desc') },
    { id: 'moyen', label: t('components.condition_medium'), multiplier: 0.88, desc: t('components.condition_medium_desc') },
    { id: 'mauvais', label: t('components.condition_bad'), multiplier: 0.75, desc: t('components.condition_bad_desc') },
  ];

  return (
    <View className={`flex-row flex-wrap justify-between ${I18nManager.isRTL ? 'flex-row-reverse' : ''}`}>
      {CONDITIONS.map((c) => (
        <Pressable
          key={c.id}
          onPress={() => onSelect(c.id)}
          className={`w-[48%] mb-3 p-4 rounded-2xl border active:opacity-70 ${
            selected === c.id 
              ? 'bg-primary border-primary shadow-sm' 
              : 'bg-white border-gray-100'
          }`}
        >
          <Text className={`font-body font-bold text-base ${
            selected === c.id ? 'text-white' : 'text-text-primary'
          } ${I18nManager.isRTL ? 'text-right' : 'text-left'}`}>
            {c.label}
          </Text>
          <Text className={`font-body text-[10px] mt-1 ${
            selected === c.id ? 'text-white/80' : 'text-text-secondary'
          } ${I18nManager.isRTL ? 'text-right' : 'text-left'}`}>
            {c.desc}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
