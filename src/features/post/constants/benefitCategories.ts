/**
 * Benefit Categories Configuration
 * Tips & Tricks post type için kategori tanımları
 * CreateTipsAndTrickPostScreen ve TipsAndTricksPostCard'da paylaşılır
 */

export type BenefitCategoryValue = 'time_saving' | 'energy_efficiency' | 'durability' | 'better_result';

export interface BenefitCategory {
  label: string;
  value: BenefitCategoryValue;
  icon: 'clock' | 'zap' | 'shield' | 'target';
  color: string; // Hex color for UI
  bgColor: string; // Background color for badge
}

/**
 * Benefit Categories Array
 * CreateTipsAndTrickPostScreen'de dropdown için kullanılır
 */
export const BENEFIT_CATEGORIES: BenefitCategory[] = [
  {
    label: 'Time Saving',
    value: 'time_saving',
    icon: 'clock',
    color: '#4CAF50',
    bgColor: '#E8F5E9',
  },
  {
    label: 'Energy Efficiency',
    value: 'energy_efficiency',
    icon: 'zap',
    color: '#FF9800',
    bgColor: '#FFF3E0',
  },
  {
    label: 'Durability',
    value: 'durability',
    icon: 'shield',
    color: '#2196F3',
    bgColor: '#E3F2FD',
  },
  {
    label: 'Better Result',
    value: 'better_result',
    icon: 'target',
    color: '#9C27B0',
    bgColor: '#F3E5F5',
  },
];

/**
 * Benefit Category Map
 * TipsAndTricksPostCard'da hızlı erişim için
 */
export const BENEFIT_CATEGORY_MAP: Record<BenefitCategoryValue, BenefitCategory> = {
  time_saving: BENEFIT_CATEGORIES[0],
  energy_efficiency: BENEFIT_CATEGORIES[1],
  durability: BENEFIT_CATEGORIES[2],
  better_result: BENEFIT_CATEGORIES[3],
};

/**
 * Get benefit category config by value
 */
export const getBenefitCategory = (value: BenefitCategoryValue): BenefitCategory => {
  return BENEFIT_CATEGORY_MAP[value];
};
