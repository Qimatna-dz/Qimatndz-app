import { supabase } from './supabase';

export interface CarModel {
  id: string;
  brand: string;
  model: string;
  popular: boolean;
}

export async function fetchPopularModels(): Promise<CarModel[]> {
  const { data, error } = await supabase
    .from('vehicle_catalog')
    .select('*')
    .eq('popular', true)
    .order('brand', { ascending: true });

  if (error) {
    console.error('Error fetching catalog:', error);
    return [];
  }

  return data || [];
}

export async function fetchModelsByBrand(brand: string): Promise<CarModel[]> {
  const { data, error } = await supabase
    .from('vehicle_catalog')
    .select('*')
    .eq('brand', brand)
    .order('model', { ascending: true });

  if (error) {
    console.error('Error fetching models:', error);
    return [];
  }

  return data || [];
}
