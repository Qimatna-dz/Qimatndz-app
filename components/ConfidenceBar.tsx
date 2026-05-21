import { View, Text } from 'react-native';
import { ShieldCheck, ShieldAlert, Shield } from 'lucide-react-native';

interface ConfidenceBarProps {
  confidence: 'faible' | 'moyen' | 'élevé';
  dataPoints: number;
}

export function ConfidenceBar({ confidence, dataPoints }: ConfidenceBarProps) {
  const config = {
    faible: { color: 'bg-red-500', text: 'Confiance faible', icon: ShieldAlert, textColor: 'text-red-700', bgColor: 'bg-red-50' },
    moyen: { color: 'bg-amber-500', text: 'Confiance moyenne', icon: Shield, textColor: 'text-amber-700', bgColor: 'bg-amber-50' },
    élevé: { color: 'bg-emerald-500', text: 'Confiance élevée', icon: ShieldCheck, textColor: 'text-emerald-700', bgColor: 'bg-emerald-50' },
  };

  const current = config[confidence] || config.faible;
  const Icon = current.icon;

  return (
    <View className={`rounded-xl p-4 flex-row items-center ${current.bgColor}`}>
      <Icon size={20} color={current.textColor === 'text-emerald-700' ? '#059669' : current.textColor === 'text-amber-700' ? '#D97706' : '#DC2626'} />
      <View className="ml-3 flex-1">
        <Text className={`font-body font-bold text-sm ${current.textColor}`}>
          {current.text}
        </Text>
        <Text className="text-gray-500 text-xs font-body">
          Basé sur {dataPoints} annonces similaires
        </Text>
      </View>
      <View className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
        <View 
          className={`h-full ${current.color}`} 
          style={{ width: confidence === 'élevé' ? '100%' : confidence === 'moyen' ? '60%' : '30%' }}
        />
      </View>
    </View>
  );
}
