import { getHeroiconName } from '@/src/config/figma-icons-mapping';
import * as HeroIconsOutline from 'react-native-heroicons/outline';
import * as HeroIconsSolid from 'react-native-heroicons/solid';
import React from 'react';

/**
 * Feather icon ismini Figma ismine çevir ve heroicons component'ini döndür
 * 
 * @param featherName - Feather icon ismi (örn: 'user', 'arrow-left')
 * @param variant - Icon variant ('outline' veya 'solid')
 * @returns Heroicon component veya null
 * 
 * @example
 * const IconComponent = getHeroiconComponent('user', 'outline');
 * if (IconComponent) {
 *   return <IconComponent width={20} height={20} color="#000" />;
 * }
 */
export function getHeroiconComponent(
  featherName: string,
  variant: 'outline' | 'solid' = 'outline'
): React.ComponentType<{ width?: number; height?: number; color?: string }> | null {
  // Feather icon ismini Figma ismine çevir (gerekirse)
  // Figma isminden heroicon ismine çevir
  const heroiconName = getHeroiconName(featherName);
  if (!heroiconName) {
    console.warn(`[iconMapper] Heroicon bulunamadı: ${featherName}`);
    return null;
  }
  
  const iconSet = variant === 'solid' ? HeroIconsSolid : HeroIconsOutline;
  const IconComponent = (iconSet as any)[heroiconName];
  
  if (!IconComponent) {
    console.warn(`[iconMapper] Heroicon component bulunamadı: ${heroiconName} (${variant})`);
    return null;
  }
  
  return IconComponent;
}

/**
 * Feather icon ismini direkt heroicons component ismine çevir
 * 
 * @param featherName - Feather icon ismi
 * @returns Heroicon component ismi veya null
 */
export function getHeroiconNameFromFeather(featherName: string): string | null {
  return getHeroiconName(featherName);
}
