import { BadgesData } from './types';

export const mockBadgesData: BadgesData = {
  event: [
    {
      id: '1',
      title: 'Everyday Consumer',
      icon: require('@/assets/badges/badge_01.png'),
      rarity: 'Usual',
      category: 'event',
    },
    {
      id: '2',
      title: 'Premium Shopper',
      icon: require('@/assets/badges/badge_02.png'),
      rarity: 'Rare',
      category: 'event',
    },
    {
      id: '3',
      title: 'Collector',
      icon: require('@/assets/badges/badge_03.png'),
      rarity: 'Usual',
      category: 'event',
    },
  ],
  collection: [
    {
      id: '4',
      title: 'Wishmaker',
      icon: require('@/assets/badges/badge_04.png'),
      rarity: 'Usual',
      category: 'collection',
    },
    {
      id: '5',
      title: 'Hardware Expert',
      icon: require('@/assets/badges/badge_01.png'),
      rarity: 'Usual',
      category: 'collection',
    },
  ],
  cosmetic: [
    {
      id: '6',
      title: 'Early Tech Adopter',
      icon: require('@/assets/badges/badge_02.png'),
      rarity: 'Rare',
      category: 'cosmetic',
    },
  ],
  brand: [
    {
      id: '7',
      title: 'Community Builder',
      icon: require('@/assets/badges/badge_03.png'),
      rarity: 'Epic',
      category: 'brand',
    },
    {
      id: '8',
      title: 'Network Guru',
      icon: require('@/assets/badges/badge_04.png'),
      rarity: 'Legendary',
      category: 'brand',
    },
  ],
};
