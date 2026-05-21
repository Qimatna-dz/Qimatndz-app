import React from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Search as SearchIcon, History as HistoryIcon, User as UserIcon } from 'lucide-react-native';
import { Colors } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Search = SearchIcon as any;
const History = HistoryIcon as any;
const User = UserIcon as any;

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: '#6B6B6B',
        tabBarStyle: {
          backgroundColor: '#F8F7F4',
          borderTopWidth: 1,
          borderTopColor: '#EAE8E3',
          height: Platform.OS === 'ios' ? (insets.bottom > 0 ? 80 : 64) : 64,
          paddingBottom: Platform.OS === 'ios' ? (insets.bottom > 0 ? insets.bottom - 6 : 8) : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: 'DMSans-Medium',
          fontSize: 12,
        },
        headerShown: false,
      }}>
      <Tabs.Screen
        name="evaluate"
        options={{
          title: 'Évaluation',
          tabBarIcon: ({ color }) => <Search size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Historique',
          tabBarIcon: ({ color }) => <History size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Compte',
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
