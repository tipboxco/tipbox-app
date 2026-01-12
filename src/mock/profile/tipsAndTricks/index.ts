import { TipsAndTricksPost } from './types';

export const mock_tips_and_tricks_posts: TipsAndTricksPost[] = [
  {
    id: '1',
    user: {
      id: '1',
      name: 'John Doe',
      title: 'Technology Enthuistant - Hardware Expert - Digital Surfer',
      avatar: require('@/assets/avatar/default-useravatar.png'),
    },
    category: {
      id: '1',
      name: 'Technology',
      subCategory: 'Computer / Tablets',
      image: require('@/assets/product/product_01.png'),
      product: {
        id: '1',
        name: 'MacBook Pro M2',
        subName: 'Apple',
        image: require('@/assets/product/product_01.png'),
      },
    },
    content: 'MacBook Pro M2 kullanıcıları için önemli bir ipucu: Batarya ömrünü uzatmak için "Optimized Battery Charging" özelliğini aktif tutun. Bu özellik, kullanım alışkanlıklarınızı öğrenerek şarj döngüsünü optimize eder. MacBook Pro M2 kullanıcıları için önemli bir ipucu: Batarya ömrünü uzatmak için "Optimized Battery Charging" özelliğini aktif tutun. Bu özellik, kullanım alışkanlıklarınızı öğrenerek şarj döngüsünü optimize eder.',
    images: [],
    stats: {
      likes: 245,
      comments: 23,
      shares: 12,
      bookmarks: 45,
    },
    tag: 'Battery',
    createdAt: '2024-03-17T10:30:00Z',
  },
  {
    id: '2',
    user: {
      id: '2',
      name: 'Jane Smith',
      title: 'Technology Enthuistant - Hardware Expert - Digital Surfer',
      avatar: require('@/assets/avatar/default-useravatar.png'),
    },
    category: {
      id: '2',
      name: 'Technology',
      subCategory: 'Smartphones',
      image: require('@/assets/inventory/product_03.png'),
      product: {
        id: '2',
        name: 'iPhone 15 Pro Max',
        subName: 'Apple',
        image: require('@/assets/inventory/product_03.png'),
      },
    },
    content: 'iPhone 15 Pro Max kamera ayarları için profesyonel ipuçları! Swipe ile paylaştığım ayarları kullanarak gece çekimlerinizde çok daha iyi sonuçlar alabilirsiniz. iPhone 15 Pro Max kamera ayarları için profesyonel ipuçları! Swipe ile paylaştığım ayarları kullanarak gece çekimlerinizde çok daha iyi sonuçlar alabilirsiniz.',
    images: [
      require('@/assets/product/Cat.png'),
      require('@/assets/product/Cat.png'),
    ],
    stats: {
      likes: 567,
      comments: 89,
      shares: 34,
      bookmarks: 123,
    },
    tag: 'Camera',
    createdAt: '2024-03-17T09:15:00Z',
  },
  {
    id: '3',
    user: {
      id: '3',
      name: 'Jane Smith',
      title: 'Technology Enthuistant - Hardware Expert - Digital Surfer',
      avatar: require('@/assets/avatar/default-useravatar.png'),
    },
    category: {
      id: '3',
      name: 'Electrical Home Appliances',
      subCategory: 'Air Purification',
      image: require('@/assets/inventory/product_05.png'),
    },
    content: 'iPhone 15 Pro Max kamera ayarları için profesyonel ipuçları! Swipe ile paylaştığım ayarları kullanarak gece çekimlerinizde çok daha iyi sonuçlar alabilirsiniz. iPhone 15 Pro Max kamera ayarları için profesyonel ipuçları! Swipe ile paylaştığım ayarları kullanarak gece çekimlerinizde çok daha iyi sonuçlar alabilirsiniz.',
    images: [
      require('@/assets/product/Cat.png'),
      require('@/assets/product/Cat.png'),
    ],
    stats: {
      likes: 567,
      comments: 89,
      shares: 34,
      bookmarks: 123,
    },
    tag: 'Camera',
    createdAt: '2024-03-17T09:15:00Z',
  },
];