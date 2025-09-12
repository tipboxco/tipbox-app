import { Collection } from '@/src/mock/profile/collections/types';

export const mock_collections: Collection[] = [
  {
    id: '1',
    title: 'Everyday Consumer',
    description: 'En az 10 gönderi ile etkileşime geç ve 3 gönderi paylaş.',
    image: require('@/assets/badges/badge_01.png'),
    type: 'usual',
    isCompleted: false,
  },
  {
    id: '2',
    title: 'Premium Shopper',
    description: 'Premium ürünlerle 5 farklı etkileşimde bulun.',
    image: require('@/assets/badges/badge_02.png'),
    type: 'rare',
    isCompleted: true,
  },
  {
    id: '3',
    title: 'Collector',
    description: 'Koleksiyonuna 10 farklı ürün ekle.',
    image: require('@/assets/badges/badge_03.png'),
    type: 'usual',
    isCompleted: false,
  },
  {
    id: '4',
    title: 'Wishmaker',
    description: 'İstek listene 5 ürün ekle ve 3 tanesini satın al.',
    image: require('@/assets/badges/badge_04.png'),
    type: 'usual',
    isCompleted: true,
  },
  {
    id: '5',
    title: 'Hardware Expert',
    description: 'Teknoloji kategorisinde 5 farklı ürün değerlendir.',
    image: require('@/assets/badges/badge_01.png'),
    type: 'usual',
    isCompleted: false,
  },
  {
    id: '6',
    title: 'Early Tech Adopter',
    description: 'Yeni çıkan 3 teknoloji ürününü ilk değerlendirenlerden ol.',
    image: require('@/assets/badges/badge_02.png'),
    type: 'rare',
    isCompleted: true,
  }
];
