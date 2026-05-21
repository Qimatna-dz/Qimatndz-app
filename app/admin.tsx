import { useEffect } from 'react';
import { Platform, View, Text, ActivityIndicator } from 'react-native';

export default function AdminRedirectScreen() {
  useEffect(() => {
    if (Platform.OS === 'web') {
      window.location.href = '/admin.html';
    }
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f6f2' }}>
      <ActivityIndicator size="large" color="#00b89a" style={{ marginBottom: 16 }} />
      <Text style={{ fontFamily: 'Figtree', fontSize: 16, color: '#0d0e10', fontWeight: '500' }}>
        Redirection vers le portail d'administration web...
      </Text>
    </View>
  );
}
