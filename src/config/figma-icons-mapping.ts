/**
 * Figma Icon Names to Heroicons Mapping
 * 
 * Bu dosya Figma'dan çıkarılan icon isimlerini heroicons kütüphanesindeki
 * icon isimlerine map eder.
 * 
 * Kullanım:
 * import { HomeIcon } from 'react-native-heroicons/outline';
 * import { HomeIcon as HomeIconSolid } from 'react-native-heroicons/solid';
 */

export interface FigmaIconMapping {
  figmaName: string;
  heroiconName: string;
  availableInHeroicons: boolean;
  notes?: string;
}

/**
 * Figma icon isimlerinden heroicons icon isimlerine mapping
 * 
 * Not: Bazı iconlar heroicons'da farklı isimlerle olabilir veya
 * hiç bulunmayabilir. Bu durumda alternatif iconlar önerilir.
 */
export const FIGMA_TO_HEROICONS_MAPPING: FigmaIconMapping[] = [
  // Tab Navigation Icons
  { figmaName: 'home', heroiconName: 'HomeIcon', availableInHeroicons: true },
  { figmaName: 'magnifying-glass', heroiconName: 'MagnifyingGlassIcon', availableInHeroicons: true },
  { figmaName: 'rectangle-stack', heroiconName: 'Squares2X2Icon', availableInHeroicons: true },
  { figmaName: 'events', heroiconName: 'CalendarIcon', availableInHeroicons: true },
  { figmaName: 'bell', heroiconName: 'BellIcon', availableInHeroicons: true },
  { figmaName: 'envelope', heroiconName: 'EnvelopeIcon', availableInHeroicons: true },
  
  // User & Account
  { figmaName: 'user-circle', heroiconName: 'UserCircleIcon', availableInHeroicons: true },
  { figmaName: 'user-plus', heroiconName: 'UserPlusIcon', availableInHeroicons: true },
  { figmaName: 'users', heroiconName: 'UsersIcon', availableInHeroicons: true },
  
  // Wallet & Payment
  { figmaName: 'wallet', heroiconName: 'WalletIcon', availableInHeroicons: false, notes: 'Heroicons\'da yok, alternatif: CurrencyDollarIcon' },
  { figmaName: 'credit-card', heroiconName: 'CreditCardIcon', availableInHeroicons: true },
  { figmaName: 'qr-code', heroiconName: 'QrCodeIcon', availableInHeroicons: true },
  
  // Actions
  { figmaName: 'bookmark', heroiconName: 'BookmarkIcon', availableInHeroicons: true },
  { figmaName: 'heart', heroiconName: 'HeartIcon', availableInHeroicons: true },
  { figmaName: 'chat-bubble-left', heroiconName: 'ChatBubbleLeftIcon', availableInHeroicons: true },
  { figmaName: 'paper-airplane', heroiconName: 'PaperAirplaneIcon', availableInHeroicons: true },
  { figmaName: 'share', heroiconName: 'ArrowTopRightOnSquareIcon', availableInHeroicons: true },
  { figmaName: 'arrow-top-right-on-square', heroiconName: 'ArrowTopRightOnSquareIcon', availableInHeroicons: true },
  { figmaName: 'flag', heroiconName: 'FlagIcon', availableInHeroicons: true },
  { figmaName: 'trash', heroiconName: 'TrashIcon', availableInHeroicons: true },
  { figmaName: 'plus', heroiconName: 'PlusIcon', availableInHeroicons: true },
  { figmaName: 'x-circle', heroiconName: 'XCircleIcon', availableInHeroicons: true },
  { figmaName: 'check-circle', heroiconName: 'CheckCircleIcon', availableInHeroicons: true },
  { figmaName: 'check-badge', heroiconName: 'CheckBadgeIcon', availableInHeroicons: true },
  
  // Shopping & Marketplace
  { figmaName: 'shopping-cart', heroiconName: 'ShoppingCartIcon', availableInHeroicons: false, notes: 'Heroicons\'da yok, alternatif: ShoppingBagIcon' },
  { figmaName: 'shopping-bag', heroiconName: 'ShoppingBagIcon', availableInHeroicons: true },
  
  // Settings & Configuration
  { figmaName: 'cog-6-tooth', heroiconName: 'Cog6ToothIcon', availableInHeroicons: true },
  { figmaName: 'key', heroiconName: 'KeyIcon', availableInHeroicons: true },
  { figmaName: 'lock-closed', heroiconName: 'LockClosedIcon', availableInHeroicons: true },
  { figmaName: 'shield-check', heroiconName: 'ShieldCheckIcon', availableInHeroicons: true },
  { figmaName: 'device-phone-mobile', heroiconName: 'DevicePhoneMobileIcon', availableInHeroicons: true },
  
  // Navigation & Arrows
  { figmaName: 'chevron', heroiconName: 'ChevronRightIcon', availableInHeroicons: true },
  { figmaName: 'chevron-double-up', heroiconName: 'ChevronDoubleUpIcon', availableInHeroicons: true },
  { figmaName: 'arrows-right-left', heroiconName: 'ArrowsRightLeftIcon', availableInHeroicons: true },
  { figmaName: 'arrow-path-rounded-square', heroiconName: 'ArrowPathRoundedSquareIcon', availableInHeroicons: true },
  { figmaName: 'arrow-right-start-on-rectangle', heroiconName: 'ArrowRightStartOnRectangleIcon', availableInHeroicons: true },
  
  // Information & Alerts
  { figmaName: 'information-circle', heroiconName: 'InformationCircleIcon', availableInHeroicons: true },
  { figmaName: 'exclamation-circle', heroiconName: 'ExclamationCircleIcon', availableInHeroicons: true },
  { figmaName: 'question-mark-circle', heroiconName: 'QuestionMarkCircleIcon', availableInHeroicons: true },
  { figmaName: 'bell-slash', heroiconName: 'BellSlashIcon', availableInHeroicons: true },
  { figmaName: 'bell-alert', heroiconName: 'BellAlertIcon', availableInHeroicons: true },
  
  // Media & Files
  { figmaName: 'camera', heroiconName: 'CameraIcon', availableInHeroicons: true },
  { figmaName: 'photo', heroiconName: 'PhotoIcon', availableInHeroicons: true },
  { figmaName: 'document', heroiconName: 'DocumentIcon', availableInHeroicons: true },
  { figmaName: 'document-text', heroiconName: 'DocumentTextIcon', availableInHeroicons: true },
  { figmaName: 'viewfinder-circle', heroiconName: 'ViewfinderCircleIcon', availableInHeroicons: true },
  
  // UI Elements
  { figmaName: 'ellipsis', heroiconName: 'EllipsisHorizontalIcon', availableInHeroicons: true },
  { figmaName: 'funnel', heroiconName: 'FunnelIcon', availableInHeroicons: true },
  { figmaName: 'adjustments-vertical', heroiconName: 'AdjustmentsVerticalIcon', availableInHeroicons: true },
  { figmaName: 'bars-arrow', heroiconName: 'BarsArrowIcon', availableInHeroicons: false, notes: 'Heroicons\'da yok' },
  { figmaName: 'eye', heroiconName: 'EyeIcon', availableInHeroicons: true },
  { figmaName: 'eye-slash', heroiconName: 'EyeSlashIcon', availableInHeroicons: true },
  { figmaName: 'square-2-stack', heroiconName: 'Square2StackIcon', availableInHeroicons: true },
  { figmaName: 'squares-2x2', heroiconName: 'Squares2X2Icon', availableInHeroicons: true },
  
  // Time & Calendar
  { figmaName: 'calendar', heroiconName: 'CalendarIcon', availableInHeroicons: true },
  { figmaName: 'clock', heroiconName: 'ClockIcon', availableInHeroicons: true },
  { figmaName: 'hourglass-simple', heroiconName: 'HourglassIcon', availableInHeroicons: true },
  
  // Communication
  { figmaName: 'chat-bubble-left-right', heroiconName: 'ChatBubbleLeftRightIcon', availableInHeroicons: true },
  { figmaName: 'chat-bubble-oval-left', heroiconName: 'ChatBubbleOvalLeftIcon', availableInHeroicons: true },
  { figmaName: 'chat-bubble-oval-left-ellipsis', heroiconName: 'ChatBubbleOvalLeftEllipsisIcon', availableInHeroicons: true },
  
  // Inventory & Collections
  { figmaName: 'inbox', heroiconName: 'InboxIcon', availableInHeroicons: true },
  { figmaName: 'inbox-arrow-down', heroiconName: 'InboxArrowDownIcon', availableInHeroicons: true },
  
  // Content & Posts
  { figmaName: 'pencil-square', heroiconName: 'PencilSquareIcon', availableInHeroicons: true },
  { figmaName: 'pencil-simple-line', heroiconName: 'PencilIcon', availableInHeroicons: true },
  { figmaName: 'arrows-clockwise', heroiconName: 'ArrowPathIcon', availableInHeroicons: true },
  
  // Rewards & Achievements
  { figmaName: 'trophy', heroiconName: 'TrophyIcon', availableInHeroicons: true },
  { figmaName: 'gift', heroiconName: 'GiftIcon', availableInHeroicons: true },
  { figmaName: 'circle-stack', heroiconName: 'CircleStackIcon', availableInHeroicons: false, notes: 'Heroicons\'da yok' },
  { figmaName: 'star', heroiconName: 'StarIcon', availableInHeroicons: true },
  
  // Special Actions
  { figmaName: 'no-symbol', heroiconName: 'NoSymbolIcon', availableInHeroicons: true },
  { figmaName: 'cursor-arrow-ripple', heroiconName: 'CursorArrowRippleIcon', availableInHeroicons: true },
  { figmaName: 'ticket', heroiconName: 'TicketIcon', availableInHeroicons: true },
  { figmaName: 'cube', heroiconName: 'CubeIcon', availableInHeroicons: true },
  { figmaName: 'seal-question', heroiconName: 'QuestionMarkCircleIcon', availableInHeroicons: true, notes: 'Alternatif: QuestionMarkCircleIcon' },
  { figmaName: 'lightbulb', heroiconName: 'LightBulbIcon', availableInHeroicons: true },
  { figmaName: 'rocket-launch', heroiconName: 'RocketLaunchIcon', availableInHeroicons: true },
  { figmaName: 'language', heroiconName: 'LanguageIcon', availableInHeroicons: true },
  { figmaName: 'clipboard-document-list', heroiconName: 'ClipboardDocumentListIcon', availableInHeroicons: true },
  { figmaName: 'minus-circle', heroiconName: 'MinusCircleIcon', availableInHeroicons: true },
];

/**
 * Heroicons'da mevcut olan iconların listesi
 */
export const AVAILABLE_HEROICONS = FIGMA_TO_HEROICONS_MAPPING
  .filter(m => m.availableInHeroicons)
  .map(m => m.heroiconName);

/**
 * Heroicons'da olmayan iconların listesi
 */
export const MISSING_HEROICONS = FIGMA_TO_HEROICONS_MAPPING
  .filter(m => !m.availableInHeroicons)
  .map(m => ({ figmaName: m.figmaName, heroiconName: m.heroiconName, notes: m.notes }));

/**
 * Figma icon isminden heroicon ismine çevir
 */
export function getHeroiconName(figmaName: string): string | null {
  const mapping = FIGMA_TO_HEROICONS_MAPPING.find(m => m.figmaName === figmaName);
  return mapping?.heroiconName || null;
}

/**
 * Heroicon isminden Figma icon ismine çevir
 */
export function getFigmaName(heroiconName: string): string | null {
  const mapping = FIGMA_TO_HEROICONS_MAPPING.find(m => m.heroiconName === heroiconName);
  return mapping?.figmaName || null;
}
