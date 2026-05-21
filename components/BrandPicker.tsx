import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, FlatList, Modal, ActivityIndicator, ScrollView } from 'react-native';
import { Search as SearchIcon, ChevronRight, ChevronLeft, X as XIcon, Car as CarIcon, CheckCircle2, Sparkles as SparklesIcon } from 'lucide-react-native';

const Search = SearchIcon as any;
const X = XIcon as any;
const Car = CarIcon as any;
const Sparkles = SparklesIcon as any;
import { supabase } from '../lib/supabase';
import { Colors } from '../constants/theme';
import { useTranslation } from 'react-i18next';
import { I18nManager } from 'react-native';

interface BrandPickerProps {
  onSelect: (brand: string, model: string, trim?: string | null) => void;
  selectedBrand: string;
  selectedModel: string;
  selectedTrim?: string | null;
}

type SelectionStep = 'brand' | 'model' | 'trim';

export function BrandPicker({ onSelect, selectedBrand, selectedModel, selectedTrim }: BrandPickerProps) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<SelectionStep>('brand');
  const [search, setSearch] = useState('');
  
  const [brands, setBrands] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [trims, setTrims] = useState<string[]>([]);
  
  const [tempBrand, setTempBrand] = useState('');
  const [tempModel, setTempModel] = useState('');
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      if (step === 'brand') loadBrands();
    }
  }, [visible, step]);

  // Helper to wrap promises with a timeout safety net
  function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number = 3000): Promise<T> {
    return Promise.race([
      promise as Promise<T>,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Query Timeout')), timeoutMs)
      )
    ]);
  }

  // Popular fallback brands & models in Algeria
  // Popular fallback brands & models in Algeria
  const POPULAR_BRANDS = [
    'Renault', 'Dacia', 'Peugeot', 'Volkswagen', 'Toyota', 'Hyundai', 'Kia', 'Suzuki', 
    'Seat', 'Skoda', 'Citroën', 'Fiat', 'Opel', 'Chevrolet', 'Nissan', 'Ford', 'Mitsubishi',
    'Mercedes-Benz', 'BMW', 'Audi', 'Porsche', 'Land Rover', 'Range Rover',
    'Geely', 'Chery', 'Jetour', 'Changan', 'JAC', 'DFSK', 'MG', 'BYD',
    'Maruti', 'Zotye', 'Lifan', 'Lada', 'Great Wall', 'Foton', 'JMC', 'Mahindra', 'SsangYong'
  ];

  const PREMIUM_CATALOG_FALLBACKS: Record<string, string[]> = {
    // Mass-market favorites in Algeria
    'Renault': ['Clio 2', 'Clio 3', 'Clio 4', 'Clio 5', 'Clio Campus', 'Symbol', 'Megane 3', 'Megane 4', 'Megane Classic', 'Kangoo', 'Express', 'Captur', 'Kadjar', 'Fluence', 'Trafic', 'Master'],
    'Dacia': ['Logan', 'Sandero', 'Sandero Stepway', 'Duster', 'Lodgy', 'Dokker', 'Solenza'],
    'Peugeot': ['206', '207', '208', '301', '306', '307', '308', '406', '407', '508', '2008', '3008', '5008', 'Partner', 'Partner Origin', 'Expert', 'Boxer'],
    'Volkswagen': ['Polo', 'Golf 6', 'Golf 7', 'Golf 8', 'Tiguan', 'Caddy', 'Passat', 'T-Roc', 'T-Cross', 'Amarok', 'Crafter', 'Transporter', 'Touareg'],
    'Toyota': ['Corolla', 'Yaris', 'Hilux', 'Land Cruiser', 'Prado', 'RAV4', 'Fortuner', 'Land Cruiser LC300'],
    'Hyundai': ['i10', 'Grand i10', 'i20', 'i30', 'Accent', 'Elantra', 'Tucson', 'Creta', 'Santa Fe', 'Kona', 'Atos', 'Atos Prime', 'Eon', 'H1', 'H100', 'Mighty', 'HD35', 'HD65', 'HD72'],
    'Kia': ['Picanto', 'Rio', 'Sportage', 'Sorento', 'Cerato', 'Pegas', 'K3', 'K5', 'KX1', 'KX3', 'Sonet', 'Seltos', 'Soul', 'Carens', 'K2500', 'K2700'],
    'Suzuki': ['Alto', 'Alto K10', 'Swift', 'Celerio', 'Jimny', 'Vitara', 'Baleno', 'Super Carry'],
    'Seat': ['Ibiza', 'Leon', 'Arona', 'Ateca', 'Toledo'],
    'Skoda': ['Fabia', 'Octavia', 'Superb', 'Kamiq', 'Rapid', 'Kodiaq'],
    'Citroën': ['C3', 'C-Élysée', 'C4', 'C4 Cactus', 'C5 Aircross', 'Berlingo', 'Jumpy', 'Jumper'],
    'Fiat': ['500', 'Tipo', 'Doblo', 'Fiorino', 'Scudo', 'Ducato'],
    'Opel': ['Astra', 'Corsa', 'Mokka', 'Grandland', 'Combo'],
    'Chevrolet': ['Spark', 'Aveo', 'Cruze', 'Optra', 'Sail', 'Captiva'],
    'Nissan': ['Sunny', 'Patrol', 'Qashqai', 'Navara', 'Juke', 'X-Trail', 'Micra'],
    'Ford': ['Fiesta', 'Focus', 'Ranger', 'Kuga', 'Fusion', 'Figo'],
    'Mitsubishi': ['L200', 'Pajero', 'ASX', 'Eclipse Cross'],
    
    // Chinese Brands (Recent massive success)
    'Geely': ['GX3 Pro', 'Coolray', 'Emgrand', 'Preface'],
    'Chery': ['QQ', 'QQ6', 'Tiggo 2 Pro', 'Tiggo 4 Pro', 'Tiggo 7 Pro', 'Tiggo 8 Pro', 'Arrizo 8', 'Cowin'],
    'Jetour': ['Dashing', 'X70 Plus', 'X90 Plus', 'Traveller T2'],
    'Changan': ['Alsvin', 'Hunter', 'UNI-T', 'UNI-K', 'CS35 Plus', 'CS55 Plus'],
    'JAC': ['T8', 'T9', 'Sunray', 'Bosseur', '1040'],
    'DFSK': ['Glory 500', 'Glory 560', 'Glory 580', 'Fengon', 'K01S (Mini Truck)', 'V21', 'V22'],
    'MG': ['MG3', 'ZS', 'HS', 'MG4', 'ONE'],
    'BYD': ['Song Plus', 'Han', 'Atto 3', 'Seagull'],
    
    // Budget & Utility brands (Legendary in Algeria)
    'Maruti': ['800', 'Alto'],
    'Zotye': ['Z100', 'Nomad', 'Hunter'],
    'Lifan': ['320', '520', 'X60'],
    'Lada': ['Niva', 'Granta'],
    'Great Wall': ['Wingle 5', 'Wingle 6', 'Wingle 7', 'Florid'],
    'Foton': ['Gratour', 'Tunland', 'Ollin'],
    'JMC': ['Boarding', 'Vigus', 'Carrying'],
    'Mahindra': ['Scorpio', 'Pikup'],
    'SsangYong': ['Korando', 'Actyon', 'Musso', 'Kyron'],

    // Premium Brands
    'Mercedes-Benz': ['Classe A', 'CLA', 'Classe C', 'Classe E', 'CLS', 'Classe S', 'GLA', 'GLB', 'GLC', 'GLE', 'GLE Coupé', 'GLS', 'Classe G'],
    'Mercedes': ['Classe A', 'CLA', 'Classe C', 'Classe E', 'CLS', 'Classe S', 'GLA', 'GLB', 'GLC', 'GLE', 'GLE Coupé', 'GLS', 'Classe G'],
    'Mercedes-AMG': ['C63', 'E63', 'G63', 'GT'],
    'BMW': ['Série 1', 'Série 2 Gran Coupé', 'Série 3', 'Série 5', 'Série 7', 'X1', 'X3', 'X5', 'X6', 'X7', 'M3', 'M4', 'M5'],
    'Audi': ['A1 Sportback', 'A3 Sportback', 'A4', 'A5 Sportback', 'A6', 'A7 Sportback', 'A8', 'Q2', 'Q3', 'Q5', 'Q7', 'Q8'],
    'Porsche': ['911', 'Cayenne', 'Macan', 'Panamera', 'Taycan'],
    'Land Rover': ['Range Rover Evoque', 'Range Rover Velar', 'Range Rover Sport', 'Range Rover', 'Defender'],
    'Range Rover': ['Evoque', 'Velar', 'Sport', 'Vogue', 'Autobiography', 'Defender'],
  };

  const PREMIUM_TRIM_FALLBACKS: Record<string, string[]> = {
    // French & Mass-Market Finitions (Very popular)
    'Symbol': ['Essentiel', 'Sensation', 'Extrême'],
    'Logan': ['Essentiel', 'Sensation', 'Extrême'],
    'Clio': ['Authentique', 'Expression', 'Dynamique', 'GT Line', 'Limited'],
    'Sandero': ['Ambiance', 'Lauréate', 'Stepway Extrême'],
    'Stepway': ['Ambiance', 'Lauréate', 'Extrême'],
    'Golf': ['Start', 'Trendline', 'Comfortline', 'Carat', 'R-Line', 'GTI', 'GTD', 'R'],
    'Ibiza': ['Reference', 'Style', 'Sol', 'Highline', 'FR'],
    'Leon': ['Style', 'FR', 'Cupra'],
    '208': ['Access', 'Active', 'Allure', 'GT Line', 'GT'],
    '308': ['Access', 'Active', 'Allure', 'GT Line', 'GT'],
    'Accent': ['GL', 'GLS', 'Sensation'],
    'Hilux': ['S', 'SR', 'SR5', 'Adventure', 'GR Sport'],
    
    // Premium Trims
    'Classe A': ['Standard', 'Progressive', 'AMG Line'],
    'CLA': ['Standard', 'AMG Line'],
    'Classe C': ['C180', 'C200', 'C220d', 'AMG Line'],
    'Classe E': ['E200', 'E220d', 'E250', 'E350', 'AMG Line'],
    'Classe S': ['S350d', 'S400d', 'S500', 'AMG Line'],
    'GLC': ['Progressive', 'AMG Line'],
    'GLE': ['Progressive', 'AMG Line'],
    'Classe G': ['G350d', 'G400d', 'G63 AMG', 'AMG Line'],
    'Range Rover Sport': ['SE', 'HSE', 'Autobiography'],
    'Range Rover Velar': ['SE', 'HSE', 'R-Dynamic'],
    'Cayenne': ['Standard', 'E-Hybrid', 'GTS', 'Coupé'],
    '911': ['Carrera', 'Carrera S', 'Turbo S']
  };

  async function loadBrands() {
    setLoading(true);
    let uniqueBrands: string[] = [];
    
    try {
      const res = await withTimeout(supabase.from('vehicle_catalog').select('brand'), 3000) as any;
      if (res?.data && res.data.length > 0) {
        uniqueBrands = Array.from(new Set(res.data.map((i: any) => i.brand))).sort() as string[];
      }
    } catch (e) {
      console.warn('Error loading brands from DB:', e);
    }
    
    // Inject popular brands if missing
    POPULAR_BRANDS.forEach(b => {
      if (!uniqueBrands.includes(b)) {
        uniqueBrands.push(b);
      }
    });
    
    setBrands(uniqueBrands.sort());
    setLoading(false);
  }

  async function loadModels(brand: string) {
    setLoading(true);
    let uniqueModels: string[] = [];
    
    try {
      const res = await withTimeout(supabase.from('vehicle_catalog').select('model').eq('brand', brand), 3000) as any;
      if (res?.data && res.data.length > 0) {
        uniqueModels = Array.from(new Set(res.data.map((i: any) => i.model))).sort() as string[];
      }
    } catch (e) {
      console.warn('Error loading models from DB:', e);
    }
    
    // Inject fallback premium models
    const fallbacks = PREMIUM_CATALOG_FALLBACKS[brand] || [];
    fallbacks.forEach(m => {
      if (!uniqueModels.includes(m)) {
        uniqueModels.push(m);
      }
    });
    
    setModels(uniqueModels.sort());
    setLoading(false);
  }

  async function loadTrims(brand: string, model: string) {
    setLoading(true);
    let uniqueTrims: string[] = [];
    
    try {
      const res = await withTimeout(supabase.from('vehicle_catalog').select('trim').eq('brand', brand).eq('model', model), 3000) as any;
      if (res?.data && res.data.length > 0) {
        uniqueTrims = Array.from(new Set(res.data.map((i: any) => i.trim).filter((t: any) => t))).sort() as string[];
      }
    } catch (e) {
      console.warn('Error loading trims from DB:', e);
    }
    
    // Inject fallback premium trims
    const fallbacks = PREMIUM_TRIM_FALLBACKS[model] || PREMIUM_TRIM_FALLBACKS[brand] || [];
    fallbacks.forEach(t => {
      if (!uniqueTrims.includes(t)) {
        uniqueTrims.push(t);
      }
    });
    
    if (!uniqueTrims.includes('Standard')) uniqueTrims.unshift('Standard');
    setTrims(uniqueTrims.sort());
    setLoading(false);
  }

  const handleBrandSelect = (brand: string) => {
    setTempBrand(brand);
    loadModels(brand);
    setStep('model');
    setSearch('');
  };

  const handleModelSelect = (model: string) => {
    setTempModel(model);
    loadTrims(tempBrand, model);
    setStep('trim');
    setSearch('');
  };

  const handleTrimSelect = (trim: string) => {
    onSelect(tempBrand, tempModel, trim === 'Standard' ? null : trim);
    setVisible(false);
    reset();
  };

  const handleCustomSelect = () => {
    const value = search.trim();
    if (!value) return;
    
    if (step === 'brand') {
      setTempBrand(value);
      loadModels(value);
      setStep('model');
      setSearch('');
    } else if (step === 'model') {
      setTempModel(value);
      loadTrims(tempBrand, value);
      setStep('trim');
      setSearch('');
    } else {
      handleTrimSelect(value);
    }
  };

  const reset = () => {
    setStep('brand');
    setTempBrand('');
    setTempModel('');
    setSearch('');
  };

  const filteredItems = () => {
    const list = step === 'brand' ? brands : step === 'model' ? models : trims;
    return list.filter(i => i.toLowerCase().includes(search.toLowerCase()));
  };

  return (
    <View>
      <TouchableOpacity 
        onPress={() => setVisible(true)}
        className={`bg-white rounded-xl p-4 flex-row items-center justify-between border ${visible ? 'border-accent' : 'border-gray-100'} shadow-sm ${I18nManager.isRTL ? 'flex-row-reverse' : ''}`}
      >
        <View className={`flex-row items-center flex-1 ${I18nManager.isRTL ? 'ml-2 flex-row-reverse' : 'mr-2'}`}>
          <Car size={20} color={selectedBrand ? Colors.primary : "#6B6B6B"} />
          <View className={`flex-1 ${I18nManager.isRTL ? 'mr-3' : 'ml-3'}`}>
            <Text className={`font-body text-xs text-text-secondary uppercase tracking-widest ${selectedBrand ? 'mb-0.5' : 'hidden'} ${I18nManager.isRTL ? 'text-right' : 'text-left'}`}>
              {t('components.brand_selected')}
            </Text>
            <Text 
              className={`font-body ${selectedBrand ? 'text-text-primary font-bold text-base' : 'text-text-secondary'} ${I18nManager.isRTL ? 'text-right' : 'text-left'}`}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {selectedBrand ? `${selectedBrand} ${selectedModel}${selectedTrim ? ` • ${selectedTrim}` : ''}` : t('components.brand_placeholder')}
            </Text>
          </View>
        </View>
        {I18nManager.isRTL ? <ChevronLeft size={20} color="#6B6B6B" /> : <ChevronRight size={20} color="#6B6B6B" />}
      </TouchableOpacity>

      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-background">
          {/* Header */}
          <View className={`p-6 border-b border-gray-50 flex-row items-center justify-between bg-white ${I18nManager.isRTL ? 'flex-row-reverse' : ''}`}>
            <View className={`flex-row items-center ${I18nManager.isRTL ? 'flex-row-reverse' : ''}`}>
              {step !== 'brand' && (
                <TouchableOpacity 
                  onPress={() => setStep(step === 'trim' ? 'model' : 'brand')} 
                  className={`${I18nManager.isRTL ? 'ml-4' : 'mr-4'} bg-gray-50 p-2 rounded-full`}
                >
                  {I18nManager.isRTL ? <ChevronRight size={20} color={Colors.primary} /> : <ChevronLeft size={20} color={Colors.primary} />}
                </TouchableOpacity>
              )}
              <View>
                <Text className={`text-2xl font-display font-bold text-primary ${I18nManager.isRTL ? 'text-right' : 'text-left'}`}>
                  {step === 'brand' ? t('components.brand_title') : step === 'model' ? t('components.model_title') : t('components.trim_title')}
                </Text>
                {step !== 'brand' && (
                  <Text className={`text-text-secondary font-body text-xs uppercase tracking-widest ${I18nManager.isRTL ? 'text-right' : 'text-left'}`}>
                    {tempBrand} {tempModel && `• ${tempModel}`}
                  </Text>
                )}
              </View>
            </View>
            <TouchableOpacity onPress={() => { setVisible(false); reset(); }} className="bg-gray-100 p-2 rounded-full">
              <X size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View className="p-4 bg-white">
            <View className={`bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 flex-row items-center ${I18nManager.isRTL ? 'flex-row-reverse' : ''}`}>
              <Search size={20} color={Colors.primary} />
              <TextInput 
                placeholder={step === 'brand' ? t('components.search_brand') : step === 'model' ? t('components.search_model') : t('components.search_trim')}
                placeholderTextColor="#9CA3AF"
                className={`flex-1 font-body text-text-primary text-base ${I18nManager.isRTL ? 'mr-3 text-right' : 'ml-3 text-left'}`}
                value={search}
                onChangeText={setSearch}
              />
            </View>
          </View>

          {/* List */}
          {search.trim().length > 0 && (
            <TouchableOpacity 
              onPress={handleCustomSelect}
              className={`mx-4 my-1.5 px-5 py-4 rounded-2xl flex-row items-center bg-accent/10 border border-accent/20 ${I18nManager.isRTL ? 'flex-row-reverse' : ''}`}
            >
              <View className={`w-10 h-10 rounded-xl items-center justify-center bg-accent/20 ${I18nManager.isRTL ? 'ml-4' : 'mr-4'}`}>
                <Sparkles size={20} color={Colors.primary} />
              </View>
              <Text className={`flex-1 font-body text-base text-text-primary ${I18nManager.isRTL ? 'text-right' : 'text-left'}`}>
                {t('components.manual_input')} <Text className="font-bold text-primary">"{search.trim()}"</Text>
              </Text>
              {I18nManager.isRTL ? <ChevronLeft size={18} color={Colors.primary} /> : <ChevronRight size={18} color={Colors.primary} />}
            </TouchableOpacity>
          )}

          {loading ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
            <FlatList 
              data={filteredItems()}
              keyExtractor={(item) => item}
              contentContainerStyle={{ paddingBottom: 40 }}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  onPress={() => {
                    if (step === 'brand') handleBrandSelect(item);
                    else if (step === 'model') handleModelSelect(item);
                    else handleTrimSelect(item);
                  }}
                  className={`mx-4 my-1.5 px-5 py-5 rounded-2xl flex-row items-center bg-white shadow-sm border border-gray-50 ${I18nManager.isRTL ? 'flex-row-reverse' : ''}`}
                >
                  <View className={`w-10 h-10 rounded-xl items-center justify-center ${I18nManager.isRTL ? 'ml-4' : 'mr-4'} ${
                    (step === 'brand' && item === selectedBrand) || 
                    (step === 'model' && item === selectedModel) || 
                    (step === 'trim' && item === selectedTrim)
                    ? 'bg-primary' : 'bg-primary/5'
                  }`}>
                    {step === 'trim' ? (
                       <CheckCircle2 size={20} color={(item === selectedTrim) ? '#FFFFFF' : Colors.primary} />
                    ) : (
                       <Car size={20} color={(step === 'brand' && item === selectedBrand) || (step === 'model' && item === selectedModel) ? '#FFFFFF' : Colors.primary} />
                    )}
                  </View>
                  <Text className={`flex-1 font-body text-lg ${I18nManager.isRTL ? 'text-right' : 'text-left'} ${
                    (step === 'brand' && item === selectedBrand) || 
                    (step === 'model' && item === selectedModel) || 
                    (step === 'trim' && item === selectedTrim)
                    ? 'text-primary font-bold' : 'text-text-primary'
                  }`}>
                    {item}
                  </Text>
                  {I18nManager.isRTL ? <ChevronLeft size={18} color="#9CA3AF" /> : <ChevronRight size={18} color="#9CA3AF" />}
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}
