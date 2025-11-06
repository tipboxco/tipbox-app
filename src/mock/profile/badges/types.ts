export type BadgeRarity = 'Usual' | 'Rare' | 'Epic' | 'Legendary';

export interface Badge {
  id: string;
  title: string;
  icon: any;
  rarity: BadgeRarity;
  category: 'achievement' | 'bridge';
}

export interface BadgesData {
  achievements: Badge[];
  bridges: Badge[];
}

