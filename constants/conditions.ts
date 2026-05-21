export type VehicleCondition = 'excellent' | 'bon' | 'moyen' | 'mauvais';

export interface ConditionOption {
  value: VehicleCondition;
  label: string;
  description: string;
  multiplier: number;
}

export const CONDITIONS: ConditionOption[] = [
  {
    value: 'excellent',
    label: 'Excellent',
    description: 'Comme neuf, entretien rigoureux, aucun défaut',
    multiplier: 1.08,
  },
  {
    value: 'bon',
    label: 'Bon',
    description: 'Bon état général, entretien régulier, petits défauts',
    multiplier: 1.0,
  },
  {
    value: 'moyen',
    label: 'Moyen',
    description: 'Usure visible, quelques réparations nécessaires',
    multiplier: 0.88,
  },
  {
    value: 'mauvais',
    label: 'Mauvais',
    description: 'Gros défauts, accident, moteur ou carrosserie abîmé',
    multiplier: 0.75,
  },
];
