import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { User, Shield, ChevronRight, LogOut, Settings, BarChart3, LogIn } from 'lucide-react-native';
import { Colors } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

export default function ProfileScreen() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) checkAdminStatus(session.user.id);
    });
  }, []);

  const checkAdminStatus = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();
    
    if (data?.is_admin) {
      setIsAdmin(true);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/auth');
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8F7F4]">
      <StatusBar style="dark" />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-6">
        <Text className="text-text-primary font-display font-bold text-3xl mb-8">Mon Compte</Text>

        {/* Profile Card */}
        <View className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-50 items-center mb-8">
          <View className="bg-primary/10 w-20 h-20 rounded-full items-center justify-center mb-4">
            <User size={40} color={Colors.primary} />
          </View>
          <Text className="text-text-primary font-display font-bold text-xl">
            {session?.user?.email || 'Utilisateur invité'}
          </Text>
          <Text className="text-text-secondary font-body mt-1 text-center text-xs">
            {session ? 'QimatnaDz Membre' : 'Créez un compte pour sauvegarder vos estimations'}
          </Text>
        </View>

        {/* Menu Sections */}
        <View className="flex flex-col gap-4">
          <MenuButton 
            title="Paramètres" 
            icon={Settings} 
            onPress={() => router.push('/settings')} 
          />
          
          {/* Admin Section (Visible only for admins) */}
          {isAdmin && (
            <MenuButton 
              title="Dashboard Administration" 
              subtitle="Suivi des utilisateurs & stats"
              icon={BarChart3} 
              color={Colors.primary}
              onPress={() => router.push('/admin')} 
            />
          )}

          {session ? (
            <MenuButton 
              title="Déconnexion" 
              icon={LogOut} 
              color="#EF4444"
              onPress={handleSignOut} 
            />
          ) : (
            <MenuButton 
              title="Se connecter / S'inscrire" 
              subtitle="Accéder à tous les avantages"
              icon={LogIn} 
              color={Colors.primary}
              onPress={() => router.push('/auth')} 
            />
          )}
        </View>

        <View className="mt-12 items-center">
          <Text className="text-gray-300 font-body text-[10px]">VERSION 1.0.0 — QIMATNADZ MVP</Text>
        </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuButton({ title, subtitle, icon: Icon, onPress, color }: any) {
  return (
    <TouchableOpacity 
      onPress={onPress}
      className="bg-white rounded-2xl p-4 flex-row items-center justify-between border border-gray-50"
    >
      <View className="flex-row items-center">
        <View style={{ backgroundColor: color ? `${color}10` : '#F3F4F6' }} className="p-2 rounded-xl mr-3">
          <Icon size={20} color={color || '#6B6B6B'} />
        </View>
        <View>
          <Text className="text-text-primary font-body font-bold">{title}</Text>
          {subtitle && <Text className="text-text-secondary font-body text-[10px]">{subtitle}</Text>}
        </View>
      </View>
      <ChevronRight size={18} color="#D1D5DB" />
    </TouchableOpacity>
  );
}
