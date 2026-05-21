import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, FlatList, Modal } from 'react-native';
import { MapPin, Search, X, ChevronDown } from 'lucide-react-native';
import { Colors } from '../constants/theme';
import { useTranslation } from 'react-i18next';
import { I18nManager } from 'react-native';

const WILAYAS = [
  "01 - Adrar", "02 - Chlef", "03 - Laghouat", "04 - Oum El Bouaghi", "05 - Batna", 
  "06 - Béjaïa", "07 - Biskra", "08 - Béchar", "09 - Blida", "10 - Bouira", 
  "11 - Tamanrasset", "12 - Tébessa", "13 - Tlemcen", "14 - Tiaret", "15 - Tizi Ouzou", 
  "16 - Alger", "17 - Djelfa", "18 - Jijel", "19 - Sétif", "20 - Saïda", 
  "21 - Skikda", "22 - Sidi Bel Abbès", "23 - Annaba", "24 - Guelma", "25 - Constantine", 
  "26 - Médéa", "27 - Mostaganem", "28 - M'Sila", "29 - Mascara", "30 - Ouargla", 
  "31 - Oran", "32 - El Bayadh", "33 - Illizi", "34 - Bordj Bou Arreridj", "35 - Boumerdès", 
  "36 - El Tarf", "37 - Tindouf", "38 - Tissemsilt", "39 - El Oued", "40 - Khenchela", 
  "41 - Souk Ahras", "42 - Tipaza", "43 - Mila", "44 - Aïn Defla", "45 - Naâma", 
  "46 - Aïn Témouchent", "47 - Ghardaïa", "48 - Relizane", "49 - El M'Ghair", "50 - El Meniaa", 
  "51 - Ouled Djellal", "52 - Bordj Baji Mokhtar", "53 - Béni Abbès", "54 - Timimoun", "55 - Touggourt", 
  "56 - Djanet", "57 - In Salah", "58 - In Guezzam"
];

interface WilayaPickerProps {
  selected: string;
  onSelect: (wilaya: string) => void;
}

export function WilayaPicker({ selected, onSelect }: WilayaPickerProps) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = WILAYAS.filter(w => 
    w.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (w: string) => {
    onSelect(w);
    setVisible(false);
    setSearch('');
  };

  return (
    <View>
      <TouchableOpacity 
        onPress={() => setVisible(true)}
        className={`bg-white rounded-xl p-4 flex-row items-center justify-between border ${visible ? 'border-accent' : 'border-transparent'} shadow-sm ${I18nManager.isRTL ? 'flex-row-reverse' : ''}`}
      >
        <View className={`flex-row items-center ${I18nManager.isRTL ? 'flex-row-reverse' : ''}`}>
          <MapPin size={20} color="#6B6B6B" />
          <Text className={`font-body ${selected ? 'text-text-primary' : 'text-text-secondary'} ${I18nManager.isRTL ? 'mr-3 text-right' : 'ml-3 text-left'}`}>
            {selected || t('components.select_wilaya')}
          </Text>
        </View>
        <ChevronDown size={20} color="#6B6B6B" />
      </TouchableOpacity>

      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-background">
          <View className={`p-6 border-b border-gray-100 flex-row items-center justify-between ${I18nManager.isRTL ? 'flex-row-reverse' : ''}`}>
            <Text className="text-2xl font-display font-bold text-primary">Wilaya</Text>
            <TouchableOpacity onPress={() => setVisible(false)}>
              <X size={24} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          <View className="p-4">
            <View className={`bg-gray-100 rounded-xl px-4 py-3 flex-row items-center mb-4 ${I18nManager.isRTL ? 'flex-row-reverse' : ''}`}>
              <Search size={20} color="#6B6B6B" />
              <TextInput 
                placeholder={t('components.search_wilaya')}
                className={`flex-1 font-body text-text-primary text-base ${I18nManager.isRTL ? 'mr-2 text-right' : 'ml-2 text-left'}`}
                value={search}
                onChangeText={setSearch}
                autoFocus
              />
            </View>
          </View>

          <FlatList 
            data={filtered}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity 
                onPress={() => handleSelect(item)}
                className={`px-6 py-4 border-b border-gray-50 flex-row items-center ${I18nManager.isRTL ? 'flex-row-reverse' : ''}`}
              >
                <View className={`w-8 h-8 rounded-full items-center justify-center ${I18nManager.isRTL ? 'ml-4' : 'mr-4'} ${selected === item ? 'bg-primary' : 'bg-gray-100'}`}>
                  <Text className={`text-xs font-bold ${selected === item ? 'text-white' : 'text-text-secondary'}`}>
                    {item.split(' ')[0]}
                  </Text>
                </View>
                <Text className={`font-body text-lg ${I18nManager.isRTL ? 'text-right' : 'text-left'} ${selected === item ? 'text-primary font-bold' : 'text-text-primary'}`}>
                  {item.split('- ')[1]}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}
