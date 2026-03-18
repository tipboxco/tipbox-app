export type BadgeRarity = 'Usual' | 'Rare' | 'Epic' | 'Legendary';

export interface Badge {
  id: string;
  title: string;
  icon: any;
  rarity: BadgeRarity;
  category: 'collection' | 'event' | 'cosmetic' | 'brand';
  // Real API data fields (optional, populated from API)
  earnedDate?: string | null;
  totalEarned?: number;
  isClaimed?: boolean;
  nftAddress?: string | null;
  tasks?: Array<{
    id: string;
    title: string;
    type: 'Comment' | 'Like' | 'Share';
    current: number;
    total: number;
    isCompleted: boolean;
  }>;
  description?: string;
}

export interface BadgesData {
  collection: Badge[];
  event: Badge[];
  cosmetic: Badge[];
  brand: Badge[];
}

