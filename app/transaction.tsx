import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle2, ChevronRight, AlertCircle } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { Colors } from '../constants/theme';

export default function TransactionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const finalPrice = parseInt(price.replace(/\D/g, ''));
    if (!finalPrice || finalPrice < 100000) {
      alert('Veuillez saisir un prix de vente valide.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('real_transactions')
        .insert({
          brand: params.brand,
          model: params.model,
          year: parseInt(params.year as string),
          mileage: parseInt(params.mileage as string),
          final_price: finalPrice,
          condition: params.condition,
          wilaya: params.wilaya,
        });

      if (error) throw error;

      alert('Merci pour votre contribution ! Votre prix aide la communauté.');
      router.replace('/(tabs)/evaluate');
    } catch (err: any) {
      console.error('Error saving transaction:', err);
      alert(`Erreur: ${err.message || 'Problème de connexion au serveur'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-6 pt-10">
        <View className="items-center mb-10">
          <View className="bg-green-100 p-6 rounded-full mb-6">
            <CheckCircle2 size={60} color="#15803d" />
          </View>
          <Text className="text-text-primary text-3xl font-display font-bold text-center">Félicitations !</Text>
          <Text className="text-text-secondary font-body text-center mt-2 px-4">
            Aidez la communauté en partageant votre prix de vente final. Ces données sont anonymes.
          </Text>
        </View>

        <View className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <Text className="text-text-primary font-body font-bold mb-4 text-lg">Prix de vente final</Text>
          
          <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2 mb-8">
            <TextInput 
              placeholder="0"
              placeholderTextColor="#9CA3AF"
              style={{ outlineStyle: 'none' } as any}
              keyboardType="numeric"
              className="flex-1 text-4xl font-display font-bold text-text-primary"
              value={price}
              onChangeText={setPrice}
              autoFocus
            />
            <Text className="text-text-secondary text-xl font-display font-bold ml-2">DZD</Text>
          </View>

          <TouchableOpacity 
            onPress={handleSubmit}
            disabled={loading}
            className={`bg-accent py-5 rounded-2xl items-center ${loading ? 'opacity-70' : ''}`}
          >
            <View className="flex-row items-center">
              {loading ? (
                <ActivityIndicator color={Colors.primary} />
              ) : (
                <>
                  <Text className="text-primary text-lg font-body font-bold mr-2">Confirmer & Contribuer</Text>
                  <ChevronRight size={20} color={Colors.primary} />
                </>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/evaluate')}
            disabled={loading}
            className="mt-4 items-center p-2"
          >
            <Text className="text-text-secondary font-body">Plus tard</Text>
          </TouchableOpacity>
        </View>
        
        <View className="mt-10 mb-20 flex-row items-start bg-amber-50 p-4 rounded-xl border border-amber-100">
          <AlertCircle size={20} color="#D97706" />
          <Text className="text-amber-800 text-xs font-body ml-2 flex-1">
            Vos données de vente sont utilisées pour affiner l'algorithme QimatnaDz et fournir des cotes plus précises à tous les utilisateurs.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
