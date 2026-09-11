import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Clock as ClockIcon, ChevronRight as ChevronRightIcon, Car as CarIcon, Trash2 as Trash2Icon } from 'lucide-react-native';

const Clock = ClockIcon as any;
const ChevronRight = ChevronRightIcon as any;
const Car = CarIcon as any;
const Trash2 = Trash2Icon as any;
import { fetchHistory } from '../../lib/valuation';
import { useIsFocused } from '@react-navigation/native';
import { Colors } from '../../constants/theme';

export default function HistoryScreen() {
  const router = useRouter();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isFocused = useIsFocused();

  const loadHistory = async () => {
    setLoading(true);
    const data = await fetchHistory();
    setHistory(data);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    const data = await fetchHistory();
    setHistory(data);
    setRefreshing(false);
  };

  useEffect(() => {
    if (isFocused) {
      loadHistory();
    }
  }, [isFocused]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      className="bg-white border border-gray-100 rounded-2xl p-4 mb-4 flex-row items-center shadow-sm"
      activeOpacity={0.7}
      onPress={() => router.push({
        pathname: '/result',
        params: {
          brand: item.brand,
          model: item.model,
          year: item.year?.toString() || '',
          mileage: item.mileage?.toString() || '',
          condition: item.condition || '',
          paint: item.paint || '',
          engine: item.engine || '',
          engine_details: item.engine_details || '',
          trim_details: item.trim_details || '',
          wilaya: item.wilaya || '',
          trim: item.trim || '',
          document_status: item.document_status || '',
          transmission: item.transmission || ''
        }
      })}
    >
      <View className="bg-primary/5 w-12 h-12 rounded-xl items-center justify-center mr-4">
        <Car size={24} color={Colors.primary} />
      </View>
      <View className="flex-1">
        <Text className="text-text-primary font-body font-bold text-lg">{item.brand} {item.model}</Text>
        <View className="flex-row items-center mt-0.5">
          <Text className="text-text-secondary font-body text-[10px] uppercase tracking-wide">
            {item.year} • {item.engine_details || 'Moteur'} • {item.trim_details || 'Version'}
          </Text>
        </View>
        <Text className="text-text-secondary font-body text-[10px] mt-1 italic">{formatDate(item.created_at)}</Text>
      </View>
      <View className="items-end">
        <Text className="text-primary font-display font-bold text-base">{item.price_median.toLocaleString()} DA</Text>
        <ChevronRight size={16} color="#6B6B6B" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar style="dark" />
      <View className="px-6 pt-4 flex-1">
        <View className="mb-8 flex-row justify-between items-end">
          <View>
            <Text className="text-primary text-4xl font-display font-bold">Historique</Text>
            <Text className="text-text-secondary font-body">Vos dernières évaluations</Text>
          </View>
        </View>

        {loading && !refreshing ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : (
          <FlatList
            data={history}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
            }
            ListEmptyComponent={
              <View className="flex-1 justify-center items-center pt-20">
                <View className="bg-gray-100 p-6 rounded-full">
                  <Clock size={48} color="#9CA3AF" />
                </View>
                <Text className="text-text-secondary font-body mt-6 text-center text-lg px-10">
                  Aucune évaluation trouvée. Commencez par estimer un véhicule !
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}
