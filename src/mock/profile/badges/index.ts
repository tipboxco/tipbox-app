import { BadgesData } from './types';

export const mockBadgesData: BadgesData = {
  achievements: [
    {
      id: '1',
      title: 'Everyday Consumer',
      icon: require('@/assets/badges/badge_01.png'),
      rarity: 'Usual',
      category: 'achievement',
    },
    {
      id: '2',
      title: 'Premium Shopper',
      icon: require('@/assets/badges/badge_02.png'),
      rarity: 'Rare',
      category: 'achievement',
    },
    {
      id: '3',
      title: 'Collector',
      icon: require('@/assets/badges/badge_03.png'),
      rarity: 'Usual',
      category: 'achievement',
    },
    {
      id: '4',
      title: 'Wishmaker',
      icon: require('@/assets/badges/badge_04.png'),
      rarity: 'Usual',
      category: 'achievement',
    },
    {
      id: '5',
      title: 'Hardware Expert',
      icon: require('@/assets/badges/badge_01.png'),
      rarity: 'Usual',
      category: 'achievement',
    },
    {
      id: '6',
      title: 'Early Tech Adopter',
      icon: require('@/assets/badges/badge_02.png'),
      rarity: 'Rare',
      category: 'achievement',
    },
  ],
  bridges: [
    {
      id: '7',
      title: 'Community Builder',
      icon: require('@/assets/badges/badge_03.png'),
      rarity: 'Epic',
      category: 'bridge',
    },
    {
      id: '8',
      title: 'Network Guru',
      icon: require('@/assets/badges/badge_04.png'),
      rarity: 'Legendary',
      category: 'bridge',
    },
  ],
};

