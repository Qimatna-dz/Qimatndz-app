import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sparkles, ArrowLeft, Lock, Star } from 'lucide-react-native';
import { Colors } from '../constants/theme';

export default function AuthScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-[#f8f6f2]">
      <Stack.Screen options={{ 
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')} className="ml-4 p-1">
            <ArrowLeft size={24} color="#0d0e10" />
          </TouchableOpacity>
        ),
        title: "Espace Membre",
        headerShadowVisible: false,
        headerStyle: { backgroundColor: '#f8f6f2' },
        headerTitleStyle: { fontFamily: 'Playfair Display', fontWeight: 'bold', color: '#0d0e10' }
      }} />
      
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6 bg-[#f8f6f2]">
        <View className="flex-1 justify-center items-center py-10">
          
          {/* Elegant Icon Badge */}
          <View className="relative mb-8">
            <View className="bg-primary/5 w-24 h-24 rounded-full items-center justify-center border border-primary/10">
              <Lock size={44} color="#00b89a" />
            </View>
            <View className="absolute -top-1 -right-1 bg-yellow-400 p-2 rounded-full shadow-sm">
              <Sparkles size={16} color="#0d0e10" />
            </View>
          </View>

          {/* Badge Category */}
          <View className="bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full mb-4">
            <Text className="text-primary font-body font-bold text-xs uppercase tracking-widest">Bientôt Disponible</Text>
          </View>

          {/* Title */}
          <Text className="text-3xl font-display font-bold text-text-primary text-center px-4 leading-10 font-serif">
            Espace Membre
          </Text>

          {/* Subtitle / Description */}
          <Text className="font-body text-text-secondary text-center mt-4 leading-6 text-sm px-6 max-w-md">
            Nous finalisons votre futur espace personnalisé pour vous permettre de sauvegarder vos estimations, suivre l'évolution des prix et configurer des alertes personnalisées sur le marché algérien.
          </Text>

          {/* Premium Features Preview Card */}
          <View className="bg-white border border-gray-100/80 rounded-3xl p-6 mt-8 w-full max-w-sm shadow-sm flex flex-col gap-5">
            <View className="flex-row items-start">
              <View className="bg-[#00b89a]/5 p-2.5 rounded-xl mr-3.5 border border-[#00b89a]/10">
                <Star size={18} color="#00b89a" />
              </View>
              <View className="flex-1">
                <Text className="font-body font-bold text-sm text-text-primary">Favoris & Historique illimité</Text>
                <Text className="font-body text-xs text-text-secondary mt-0.5 leading-4">Retrouvez et triez toutes vos estimations en un clin d'œil.</Text>
              </View>
            </View>

            <View className="flex-row items-start">
              <View className="bg-[#00b89a]/5 p-2.5 rounded-xl mr-3.5 border border-[#00b89a]/10">
                <Sparkles size={18} color="#00b89a" />
              </View>
              <View className="flex-1">
                <Text className="font-body font-bold text-sm text-text-primary">Alertes de Prix en Temps Réel</Text>
                <Text className="font-body text-xs text-text-secondary mt-0.5 leading-4">Soyez immédiatement notifié dès qu'un modèle baisse sur le marché.</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="w-full max-w-sm mt-10 flex flex-col gap-3">
            <TouchableOpacity 
              onPress={() => router.replace('/(tabs)/evaluate')}
              activeOpacity={0.8}
              className="bg-primary py-4 rounded-2xl items-center shadow-sm border border-primary/20"
            >
              <Text className="text-white text-base font-body font-bold">
                Retourner à l'estimation
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')}
              activeOpacity={0.8}
              className="bg-white border border-gray-200/80 py-4 rounded-2xl items-center"
            >
              <Text className="text-text-primary text-base font-body font-bold">
                Retour
              </Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
