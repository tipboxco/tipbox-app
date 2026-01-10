import { BenchmarkPost } from './benchmarkTypes';

export const mock_benchmark_posts: BenchmarkPost[] = [
  {
    id: '1',
    user: {
      id: '1',
      name: 'Michael Clark',
      avatar: require('@/assets/avatar/default-useravatar.png'),
      title: 'Technology Enthusiast - Hardware Expert',
    },
    content: 'iPhone 16 Pro Max vs Samsung Galaxy S25 Ultra karşılaştırması. Her iki telefonun da güçlü yanları var, hangisi daha iyi?',
    products: [
      {
        id: '1',
        name: 'iPhone 16 Pro Max',
        subName: 'Apple',
        image: require('@/assets/events/card-icon.png'),
        choice: true,
        isOwned: true,
      },
      {
        id: '2',
        name: 'Samsung Galaxy S25 Ultra',
        subName: 'Samsung',
        image: require('@/assets/events/card-icon.png'),
        choice: false,
        isOwned: false,
      },
    ],
    stats: {
      likes: 89,
      comments: 23,
      shares: 12,
      bookmarks: 45,
    },
    createdAt: '2 hours ago',
  },
  {
    id: '2',
    user: {
      id: '2',
      name: 'Sarah Johnson',
      avatar: require('@/assets/avatar/default-useravatar.png'),
      title: 'Tech Reviewer - Gadget Expert',
    },
    content: 'Google Pixel 9 Pro vs OnePlus 13 Pro detaylı karşılaştırması. Kamera kalitesi, performans ve pil ömrü açısından analiz.',
    products: [
      {
        id: '3',
        name: 'Google Pixel 9 Pro',
        subName: 'Google',
        image: require('@/assets/events/card-icon.png'),
        choice: true,
        isOwned: false,
      },
      {
        id: '4',
        name: 'OnePlus 13 Pro',
        subName: 'OnePlus',
        image: require('@/assets/events/card-icon.png'),
        choice: false,
        isOwned: true,
      },
    ],
    stats: {
      likes: 67,
      comments: 18,
      shares: 8,
      bookmarks: 32,
    },
    createdAt: '4 hours ago',
  },
  {
    id: '3',
    user: {
      id: '3',
      name: 'Alex Chen',
      avatar: require('@/assets/avatar/default-useravatar.png'),
      title: 'Mobile Expert - Phone Reviewer',
    },
    content: 'Xiaomi 15 Ultra vs Huawei Mate 70 Pro karşılaştırması. Her iki telefonun da güçlü kamera sistemleri var, hangisi daha iyi performans gösteriyor?',
    products: [
      {
        id: '5',
        name: 'Xiaomi 15 Ultra',
        subName: 'Xiaomi',
        image: require('@/assets/events/card-icon.png'),
        choice: false,
        isOwned: false,
      },
      {
        id: '6',
        name: 'Huawei Mate 70 Pro',
        subName: 'Huawei',
        image: require('@/assets/events/card-icon.png'),
        choice: true,
        isOwned: true,
      },
    ],
    stats: {
      likes: 112,
      comments: 35,
      shares: 19,
      bookmarks: 58,
    },
    createdAt: '6 hours ago',
  },
];
