import { View, Text } from 'react-native';

interface PriceCardProps {
  label: string;
  price: number;
  isMain?: boolean;
}

export function PriceCard({ label, price, isMain }: PriceCardProps) {
  const formattedPrice = price.toLocaleString('fr-DZ');

  return (
    <View className={`rounded-2xl p-6 border ${
      isMain ? 'bg-white border-accent shadow-sm' : 'bg-gray-50 border-gray-100'
    }`}>
      <Text className={`font-body text-sm mb-2 uppercase tracking-widest ${
        isMain ? 'text-accent font-bold' : 'text-text-secondary'
      }`}>
        {label}
      </Text>
      <View className="flex-row items-baseline">
        <Text className={`font-display font-bold ${
          isMain ? 'text-text-primary text-4xl' : 'text-text-primary text-2xl'
        }`}>
          {formattedPrice}
        </Text>
        <Text className={`font-body ml-1 ${
          isMain ? 'text-text-primary text-lg' : 'text-text-secondary text-sm'
        }`}>
          DZD
        </Text>
      </View>
    </View>
  );
}
