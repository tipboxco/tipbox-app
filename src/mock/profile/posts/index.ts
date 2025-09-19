import { Post } from './types';

export const mock_posts: Post[] = [
  {
    id: '1',
    user: {
      id: '1',
      name: 'Michael Clark',
      title: 'Technology Enthuistant - Hardware Expert - Digital Surfer',
      avatar: require('@/assets/avatar/ozan.png'),
    },
    category: {
      id: '1',
      name: 'Technology Subcategories',
      subCategory: 'Technology Subcategories',
      image: require('@/assets/product/product_01.png'),
      product: {
        id: '1',
        name: 'Dyson V15s',
        subName: 'Detect Submarine™ Wet & Dry Cordless Vacuum',
        image: require('@/assets/product/product_01.png'),
        hasDiscount: true,
      },
    },
    content: 'Using the Dyson V15s Submarine daily has completely changed how I clean my home. The wet cleaning head works brilliantly for kitchen and bathroom floors, picking up spills and leaving surfaces spotless. The suction power is incredible, and switching between wet and dry modes is seamless.',
    stats: {
      likes: 110,
      comments: 32,
      shares: 11,
      bookmarks: 32,
    },
    tag: 'Permanence / Durability',
    createdAt: '2024-03-17T10:30:00Z',
  },
  {
    id: '2',
    user: {
      id: '2',
      name: 'Sarah Johnson',
      title: 'Professional Photographer - Tech Reviewer',
      avatar: require('@/assets/avatar/ozan.png'),
    },
    category: {
      id: '2',
      name: 'Technology Subcategories',
      subCategory: 'Technology Subcategories',
      image: require('@/assets/product/product_02.png'),
      product: {
        id: '2',
        name: 'Sony A7 IV',
        subName: 'Full-frame Mirrorless Camera',
        image: require('@/assets/product/product_02.png'),
        hasDiscount: false,
      },
    },
    content: 'After 6 months of intensive use with the Sony A7 IV, I can confidently say this is the most versatile hybrid camera available. The image quality is outstanding, and the autofocus system is incredibly reliable.',
    images: [
      require('@/assets/product/Cat.png'),
      require('@/assets/product/Cat.png'),
    ],
    stats: {
      likes: 245,
      comments: 56,
      shares: 23,
      bookmarks: 78,
    },
    tag: 'Image Quality',
    createdAt: '2024-03-17T09:15:00Z',
    isPromoted: true,
  },
  {
    id: '3',
    user: {
      id: '3',
      name: 'Sarah Johnson',
      title: 'Professional Photographer - Tech Reviewer',
      avatar: require('@/assets/avatar/ozan.png'),
    },
    category: {
      id: '3',
      name: 'Technology Subcategories',
      subCategory: 'Smart Watch',
      image: require('@/assets/product/product_02.png'),
    },
    content: 'After 6 months of intensive use with the Sony A7 IV, I can confidently say this is the most versatile hybrid camera available. The image quality is outstanding, and the autofocus system is incredibly reliable.',
    images: [
      require('@/assets/product/Cat.png'),
      require('@/assets/product/Cat.png'),
    ],
    stats: {
      likes: 245,
      comments: 56,
      shares: 23,
      bookmarks: 78,
    },
    tag: 'Image Quality',
    createdAt: '2024-03-17T09:15:00Z',
    isPromoted: true,
  },
];
