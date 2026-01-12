/**
 * Feather Icons to HeroIcons Mapping
 * 
 * Bu dosya Feather icon isimlerini HeroIcons component isimlerine çevirir.
 * 
 * Kullanım:
 * import { getHeroiconFromFeather } from '@/src/utils/featherToHeroicons';
 * const IconComponent = getHeroiconFromFeather('chevron-up', 'outline');
 */

import * as HeroIconsOutline from 'react-native-heroicons/outline';
import * as HeroIconsSolid from 'react-native-heroicons/solid';
import React from 'react';

/**
 * Feather icon isimlerinden HeroIcons component isimlerine mapping
 */
const FEATHER_TO_HEROICONS_MAP: Record<string, string> = {
  // Navigation & Arrows
  'chevron-up': 'ChevronUpIcon',
  'chevron-down': 'ChevronDownIcon',
  'chevron-left': 'ChevronLeftIcon',
  'chevron-right': 'ChevronRightIcon',
  'arrow-left': 'ArrowLeftIcon',
  'arrow-right': 'ArrowRightIcon',
  'arrow-up': 'ArrowUpIcon',
  'arrow-down': 'ArrowDownIcon',
  
  // Actions
  'plus': 'PlusIcon',
  'minus': 'MinusIcon',
  'x': 'XMarkIcon',
  'check': 'CheckIcon',
  'edit': 'PencilIcon',
  'edit-2': 'PencilIcon',
  'edit-3': 'PencilIcon',
  'trash': 'TrashIcon',
  'trash-2': 'TrashIcon',
  'send': 'PaperAirplaneIcon',
  'share': 'ArrowTopRightOnSquareIcon',
  'share-2': 'ArrowTopRightOnSquareIcon',
  
  // User & Account
  'user': 'UserIcon',
  'user-plus': 'UserPlusIcon',
  'users': 'UsersIcon',
  'user-circle': 'UserCircleIcon',
  
  // Media
  'camera': 'CameraIcon',
  'image': 'PhotoIcon',
  'video': 'VideoCameraIcon',
  
  // UI Elements
  'search': 'MagnifyingGlassIcon',
  'filter': 'FunnelIcon',
  'menu': 'Bars3Icon',
  'more-vertical': 'EllipsisVerticalIcon',
  'more-horizontal': 'EllipsisHorizontalIcon',
  'x-circle': 'XCircleIcon',
  'check-circle': 'CheckCircleIcon',
  'info': 'InformationCircleIcon',
  'alert-circle': 'ExclamationCircleIcon',
  'alert-triangle': 'ExclamationTriangleIcon',
  
  // Settings & Configuration
  'settings': 'Cog6ToothIcon',
  'lock': 'LockClosedIcon',
  'unlock': 'LockOpenIcon',
  'eye': 'EyeIcon',
  'eye-off': 'EyeSlashIcon',
  
  // Social & Interactions
  'heart': 'HeartIcon',
  'star': 'StarIcon',
  'bookmark': 'BookmarkIcon',
  'message-circle': 'ChatBubbleLeftIcon',
  'message-square': 'ChatBubbleLeftRightIcon',
  
  // Files & Documents
  'file': 'DocumentIcon',
  'file-text': 'DocumentTextIcon',
  'folder': 'FolderIcon',
  
  // Time & Calendar
  'clock': 'ClockIcon',
  'calendar': 'CalendarIcon',
  
  // Shopping
  'shopping-cart': 'ShoppingCartIcon',
  'shopping-bag': 'ShoppingBagIcon',
  
  // Other
  'link': 'LinkIcon',
  'external-link': 'ArrowTopRightOnSquareIcon',
  'download': 'ArrowDownTrayIcon',
  'upload': 'ArrowUpTrayIcon',
  'refresh-cw': 'ArrowPathIcon',
  'copy': 'DocumentDuplicateIcon',
  'clipboard': 'ClipboardIcon',
};

/**
 * Feather icon isminden HeroIcon component'ini döndür
 * 
 * @param featherName - Feather icon ismi (örn: 'chevron-up', 'user')
 * @param variant - Icon variant ('outline' veya 'solid'), default: 'outline'
 * @returns HeroIcon component veya null
 */
export function getHeroiconFromFeather(
  featherName: string,
  variant: 'outline' | 'solid' = 'outline'
): React.ComponentType<{ width?: number; height?: number; color?: string }> | null {
  const heroiconName = FEATHER_TO_HEROICONS_MAP[featherName];
  
  if (!heroiconName) {
    console.warn(`[featherToHeroicons] Heroicon bulunamadı: ${featherName}`);
    return null;
  }
  
  const iconSet = variant === 'solid' ? HeroIconsSolid : HeroIconsOutline;
  const IconComponent = (iconSet as any)[heroiconName];
  
  if (!IconComponent) {
    console.warn(`[featherToHeroicons] Heroicon component bulunamadı: ${heroiconName} (${variant})`);
    return null;
  }
  
  return IconComponent;
}

/**
 * Feather icon isminden HeroIcon component ismini döndür
 */
export function getHeroiconNameFromFeather(featherName: string): string | null {
  return FEATHER_TO_HEROICONS_MAP[featherName] || null;
}
